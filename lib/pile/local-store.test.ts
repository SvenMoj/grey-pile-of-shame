import { describe, expect, it } from "vitest";
import { createLocalPileStore } from "./local-store";

// ---------------------------------------------------------------------------
// Fake in-memory Storage (no window required — usable in node test env)
// ---------------------------------------------------------------------------

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

let counter = 0;
function testDeps() {
  return {
    id: () => `id-${++counter}`,
    now: () => "2026-06-01T12:00:00.000Z",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIXED_TIME = "2026-06-01T12:00:00.000Z";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createLocalPileStore", () => {
  describe("list", () => {
    it("returns [] for an empty store", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      expect(await store.list()).toEqual([]);
    });
  });

  describe("add", () => {
    it("persists an item and returns it", async () => {
      const storage = fakeStorage();
      const store = createLocalPileStore(storage, testDeps());
      const created = await store.add({ display_name: "Sergeant" });
      expect(created.display_name).toBe("Sergeant");
      expect(created.state).toBe("unbuilt");
      const listed = await store.list();
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(created.id);
    });

    it("accumulates multiple adds", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      await store.add({ display_name: "A" });
      await store.add({ display_name: "B" });
      expect(await store.list()).toHaveLength(2);
    });
  });

  describe("addMany", () => {
    it("adds multiple items in one call", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      const created = await store.addMany([
        { display_name: "A" },
        { display_name: "B" },
        { display_name: "C" },
      ]);
      expect(created).toHaveLength(3);
      expect(await store.list()).toHaveLength(3);
    });

    it("returns the created items in order", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      const [a, b] = await store.addMany([{ display_name: "A" }, { display_name: "B" }]);
      expect(a.display_name).toBe("A");
      expect(b.display_name).toBe("B");
    });
  });

  describe("advanceState", () => {
    it("advances an item one step and persists", async () => {
      const storage = fakeStorage();
      const store = createLocalPileStore(storage, testDeps());
      const created = await store.add({ display_name: "Model", state: "unbuilt" });

      const updated = await store.advanceState(created.id);
      expect(updated?.state).toBe("built");

      // Re-read from the same storage to confirm persistence
      const store2 = createLocalPileStore(storage, testDeps());
      const listed = await store2.list();
      expect(listed[0].state).toBe("built");
    });

    it("jumps to a target state when provided", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      const created = await store.add({ display_name: "Model", state: "unbuilt" });
      const updated = await store.advanceState(created.id, "painted");
      expect(updated?.state).toBe("painted");
      expect(updated?.painted_at).toBe(FIXED_TIME);
    });

    it("sets painted_at on the hop into painted", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      const item = await store.add({ display_name: "M", state: "in_progress" });
      const updated = await store.advanceState(item.id);
      expect(updated?.state).toBe("painted");
      expect(updated?.painted_at).toBe(FIXED_TIME);
    });

    it("returns null for a missing id", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      expect(await store.advanceState("missing-id")).toBeNull();
    });

    it("does not change other items when advancing one", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      const a = await store.add({ display_name: "A" });
      const b = await store.add({ display_name: "B" });
      await store.advanceState(a.id);
      const listed = await store.list();
      expect(listed.find((i) => i.id === b.id)?.state).toBe("unbuilt");
    });
  });

  describe("remove", () => {
    it("removes an item by id", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      const item = await store.add({ display_name: "Doomed" });
      await store.remove(item.id);
      expect(await store.list()).toHaveLength(0);
    });

    it("leaves other items intact", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      const a = await store.add({ display_name: "A" });
      const b = await store.add({ display_name: "B" });
      await store.remove(a.id);
      const listed = await store.list();
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe(b.id);
    });

    it("is a no-op for a missing id", async () => {
      const store = createLocalPileStore(fakeStorage(), testDeps());
      await store.add({ display_name: "A" });
      await store.remove("missing");
      expect(await store.list()).toHaveLength(1);
    });
  });

  describe("SSR / unavailable storage path (null)", () => {
    it("list returns [] when storage is null", async () => {
      const store = createLocalPileStore(null, testDeps());
      expect(await store.list()).toEqual([]);
    });

    it("add does not throw when storage is null", async () => {
      const store = createLocalPileStore(null, testDeps());
      await expect(store.add({ display_name: "Ghost" })).resolves.toBeDefined();
    });

    it("list still returns [] after add when storage is null", async () => {
      const store = createLocalPileStore(null, testDeps());
      await store.add({ display_name: "Ghost" });
      expect(await store.list()).toEqual([]);
    });

    it("addMany does not throw when storage is null", async () => {
      const store = createLocalPileStore(null, testDeps());
      await expect(
        store.addMany([{ display_name: "A" }, { display_name: "B" }]),
      ).resolves.toBeDefined();
    });

    it("advanceState returns null when storage is null", async () => {
      const store = createLocalPileStore(null, testDeps());
      expect(await store.advanceState("any-id")).toBeNull();
    });

    it("remove does not throw when storage is null", async () => {
      const store = createLocalPileStore(null, testDeps());
      await expect(store.remove("any-id")).resolves.toBeUndefined();
    });
  });

  describe("corrupt storage path", () => {
    it("falls back to [] when storage contains garbage", async () => {
      const storage = fakeStorage({ "gpos.pile.v1": "garbage" });
      const store = createLocalPileStore(storage, testDeps());
      expect(await store.list()).toEqual([]);
    });

    it("can add items after finding corrupt data (overwrites)", async () => {
      const storage = fakeStorage({ "gpos.pile.v1": "garbage" });
      const store = createLocalPileStore(storage, testDeps());
      await store.add({ display_name: "Recovery" });
      expect(await store.list()).toHaveLength(1);
    });
  });
});
