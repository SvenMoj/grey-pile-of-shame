import { describe, expect, it, vi } from "vitest";
import { migrateLocalToSupabase, PILE_MIGRATION_KEY } from "./migrate";
import type { PileItem, PileStore } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(id: string, overrides: Partial<PileItem> = {}): PileItem {
  return {
    id,
    kit_id: null,
    display_name: `Model ${id}`,
    game: null,
    faction: null,
    unit_size: 1,
    unit_id: null,
    state: "unbuilt",
    point_value: null,
    image_url: null,
    visibility: "private" as const,
    created_at: "2026-06-01T00:00:00.000Z",
    painted_at: null,
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Build a minimal in-memory PileStore for testing. */
function mockStore(initial: PileItem[] = []): PileStore & { _items: PileItem[] } {
  const items = [...initial];
  return {
    _items: items,
    async list() {
      return [...items];
    },
    async add(input) {
      const item = {
        ...input,
        id: `new-${items.length}`,
        created_at: "t",
        updated_at: "t",
      } as PileItem;
      items.push(item);
      return item;
    },
    async addMany(inputs) {
      return inputs.map((input, i) => {
        const item = {
          ...input,
          id: `new-${items.length + i}`,
          created_at: "t",
          updated_at: "t",
        } as PileItem;
        items.push(item);
        return item;
      });
    },
    async advanceState() {
      return null;
    },
    async update() {
      return null;
    },
    async remove(id) {
      const idx = items.findIndex((i) => i.id === id);
      if (idx !== -1) items.splice(idx, 1);
    },
  };
}

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(initial));
  return {
    get length() {
      return m.size;
    },
    clear() {
      m.clear();
    },
    getItem(k: string) {
      return m.get(k) ?? null;
    },
    key(i: number) {
      return [...m.keys()][i] ?? null;
    },
    removeItem(k: string) {
      m.delete(k);
    },
    setItem(k: string, v: string) {
      m.set(k, String(v));
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("migrateLocalToSupabase", () => {
  describe("empty local pile", () => {
    it("does not call addMany on the remote store", async () => {
      const local = mockStore([]);
      const remote = mockStore([]);
      const addManySpy = vi.spyOn(remote, "addMany");
      await migrateLocalToSupabase(local, remote, fakeStorage());
      expect(addManySpy).not.toHaveBeenCalled();
    });

    it("sets the migration flag even when local pile is empty", async () => {
      const storage = fakeStorage();
      await migrateLocalToSupabase(mockStore([]), mockStore([]), storage);
      expect(storage.getItem(PILE_MIGRATION_KEY)).toBe("1");
    });
  });

  describe("local pile has items", () => {
    it("calls addMany on the remote store with all local items as NewPileItems", async () => {
      const items = [makeItem("a"), makeItem("b"), makeItem("c")];
      const local = mockStore(items);
      const remote = mockStore([]);
      const addManySpy = vi.spyOn(remote, "addMany");

      await migrateLocalToSupabase(local, remote, fakeStorage());

      expect(addManySpy).toHaveBeenCalledOnce();
      const [newItems] = addManySpy.mock.calls[0];
      expect(newItems).toHaveLength(3);
      // display_name preserved
      expect(newItems.map((i) => i.display_name)).toEqual(["Model a", "Model b", "Model c"]);
      // generated fields stripped
      expect(
        newItems.every(
          (i) =>
            !(
              ("id" in i && (i as Record<string, unknown>).id === items[0].id) ||
              (i as Record<string, unknown>).id === items[1].id
            ),
        ),
      ).toBe(true);
    });

    it("removes each local item after migration", async () => {
      const items = [makeItem("x"), makeItem("y")];
      const local = mockStore(items);
      await migrateLocalToSupabase(local, mockStore([]), fakeStorage());
      expect(await local.list()).toHaveLength(0);
    });

    it("sets the migration flag after migration", async () => {
      const storage = fakeStorage();
      await migrateLocalToSupabase(mockStore([makeItem("a")]), mockStore([]), storage);
      expect(storage.getItem(PILE_MIGRATION_KEY)).toBe("1");
    });

    it("appends to existing remote data (never clobbers)", async () => {
      const local = mockStore([makeItem("local-1"), makeItem("local-2")]);
      const remote = mockStore([makeItem("remote-1"), makeItem("remote-2"), makeItem("remote-3")]);

      await migrateLocalToSupabase(local, remote, fakeStorage());

      // remote should have original 3 + 2 migrated = 5
      expect(await remote.list()).toHaveLength(5);
    });
  });

  describe("already-migrated guard", () => {
    it("skips migration when the flag is already set", async () => {
      const storage = fakeStorage({ [PILE_MIGRATION_KEY]: "1" });
      const local = mockStore([makeItem("a"), makeItem("b")]);
      const remote = mockStore([]);
      const addManySpy = vi.spyOn(remote, "addMany");

      await migrateLocalToSupabase(local, remote, storage);

      expect(addManySpy).not.toHaveBeenCalled();
      // local items untouched
      expect(await local.list()).toHaveLength(2);
    });
  });

  describe("null storage (SSR / unavailable)", () => {
    it("migrates successfully without checking or setting the flag", async () => {
      const local = mockStore([makeItem("a")]);
      const remote = mockStore([]);
      // Should not throw
      await expect(migrateLocalToSupabase(local, remote, null)).resolves.toBeUndefined();
      // Items were still migrated
      expect(await remote.list()).toHaveLength(1);
      // Local cleared
      expect(await local.list()).toHaveLength(0);
    });
  });

  describe("preserves important fields", () => {
    it("carries over game, faction, state, point_value, painted_at", async () => {
      const item = makeItem("p", {
        game: "Warhammer 40k",
        faction: "Ultramarines",
        state: "painted",
        point_value: 95,
        painted_at: "2026-05-01T00:00:00.000Z",
      });
      const local = mockStore([item]);
      const remote = mockStore([]);
      const addManySpy = vi.spyOn(remote, "addMany");

      await migrateLocalToSupabase(local, remote, fakeStorage());

      const [newItems] = addManySpy.mock.calls[0];
      expect(newItems[0]).toMatchObject({
        game: "Warhammer 40k",
        faction: "Ultramarines",
        state: "painted",
        point_value: 95,
        painted_at: "2026-05-01T00:00:00.000Z",
      });
    });
  });
});
