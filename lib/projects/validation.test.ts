import { describe, it, expect } from "vitest";
import { slugify, validateProjectForm, parseProjectRecipesPayload } from "./validation";

// ─── slugify ────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Death Guard Plague Marine")).toBe("death-guard-plague-marine");
  });

  it("removes special characters", () => {
    expect(slugify("Iron Warriors 4th Company!")).toBe("iron-warriors-4th-company");
  });

  it("collapses multiple spaces/underscores to a single hyphen", () => {
    expect(slugify("My  Cool   Model")).toBe("my-cool-model");
    expect(slugify("my_cool_model")).toBe("my-cool-model");
  });

  it("strips leading/trailing hyphens", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("truncates to 200 chars", () => {
    const long = "a".repeat(250);
    expect(slugify(long).length).toBeLessThanOrEqual(200);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("preserves numbers", () => {
    expect(slugify("Chaos Space Marine 2nd Edition")).toBe("chaos-space-marine-2nd-edition");
  });
});

// ─── validateProjectForm ─────────────────────────────────────────────────────

describe("validateProjectForm", () => {
  function makeForm(fields: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    return fd;
  }

  it("returns parsed data for a valid minimal submission", () => {
    const fd = makeForm({ title: "Plague Marine", slug: "plague-marine" });
    const result = validateProjectForm(fd);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.title).toBe("Plague Marine");
      expect(result.data.slug).toBe("plague-marine");
      expect(result.data.status).toBe("draft");
      expect(result.data.summary).toBeNull();
      expect(result.data.body).toBeNull();
      expect(result.data.game).toBeNull();
      expect(result.data.faction).toBeNull();
    }
  });

  it("trims whitespace from title and slug", () => {
    const fd = makeForm({ title: "  Plague Marine  ", slug: "  plague-marine  " });
    const result = validateProjectForm(fd);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.title).toBe("Plague Marine");
      expect(result.data.slug).toBe("plague-marine");
    }
  });

  it("requires a non-empty title", () => {
    const fd = makeForm({ title: "", slug: "some-slug" });
    const result = validateProjectForm(fd);
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.title).toBeTruthy();
  });

  it("rejects titles over 200 chars", () => {
    const fd = makeForm({ title: "a".repeat(201), slug: "some-slug" });
    const result = validateProjectForm(fd);
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.title).toBeTruthy();
  });

  it("requires a non-empty slug", () => {
    const fd = makeForm({ title: "Plague Marine", slug: "" });
    const result = validateProjectForm(fd);
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.slug).toBeTruthy();
  });

  it("rejects slugs with invalid characters (uppercase, spaces, special chars)", () => {
    const fd = makeForm({ title: "Some Title", slug: "Not A Valid Slug!" });
    const result = validateProjectForm(fd);
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.slug).toBeTruthy();
  });

  it("accepts valid slugs with hyphens and numbers", () => {
    const fd = makeForm({ title: "Test", slug: "iron-warriors-4th-edition" });
    const result = validateProjectForm(fd);
    expect("data" in result).toBe(true);
  });

  it("defaults status to draft when not provided", () => {
    const fd = makeForm({ title: "Test", slug: "test" });
    const result = validateProjectForm(fd);
    if ("data" in result) expect(result.data.status).toBe("draft");
  });

  it("accepts published status", () => {
    const fd = makeForm({ title: "Test", slug: "test", status: "published" });
    const result = validateProjectForm(fd);
    if ("data" in result) expect(result.data.status).toBe("published");
  });

  it("rejects invalid status values", () => {
    const fd = makeForm({ title: "Test", slug: "test", status: "live" });
    const result = validateProjectForm(fd);
    expect("errors" in result).toBe(true);
    if ("errors" in result) expect(result.errors.status).toBeTruthy();
  });

  it("captures optional fields when present", () => {
    const fd = makeForm({
      title: "Test",
      slug: "test",
      summary: "A great model",
      body: "## Step 1\nBlah",
      game: "Warhammer 40k",
      faction: "Death Guard",
    });
    const result = validateProjectForm(fd);
    if ("data" in result) {
      expect(result.data.summary).toBe("A great model");
      expect(result.data.body).toBe("## Step 1\nBlah");
      expect(result.data.game).toBe("Warhammer 40k");
      expect(result.data.faction).toBe("Death Guard");
    }
  });

  it("returns null for optional fields that are empty strings", () => {
    const fd = makeForm({ title: "Test", slug: "test", summary: "", game: "" });
    const result = validateProjectForm(fd);
    if ("data" in result) {
      expect(result.data.summary).toBeNull();
      expect(result.data.game).toBeNull();
    }
  });
});

// ─── parseProjectRecipesPayload ───────────────────────────────────────────────

describe("parseProjectRecipesPayload", () => {
  it("returns empty array for empty input", () => {
    const result = parseProjectRecipesPayload("[]");
    expect("data" in result).toBe(true);
    if ("data" in result) expect(result.data).toEqual([]);
  });

  it("parses a valid single-item payload", () => {
    const payload = JSON.stringify([
      { recipe_id: "abc-123", area: "armor", sort_order: 0, note: null },
    ]);
    const result = parseProjectRecipesPayload(payload);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data[0].recipe_id).toBe("abc-123");
      expect(result.data[0].area).toBe("armor");
      expect(result.data[0].sort_order).toBe(0);
      expect(result.data[0].note).toBeNull();
    }
  });

  it("trims whitespace from area", () => {
    const payload = JSON.stringify([{ recipe_id: "abc", area: "  skin  ", sort_order: 0 }]);
    const result = parseProjectRecipesPayload(payload);
    if ("data" in result) expect(result.data[0].area).toBe("skin");
  });

  it("defaults sort_order to the item index when not provided", () => {
    const payload = JSON.stringify([
      { recipe_id: "r1", area: "armor" },
      { recipe_id: "r2", area: "skin" },
    ]);
    const result = parseProjectRecipesPayload(payload);
    if ("data" in result) {
      expect(result.data[0].sort_order).toBe(0);
      expect(result.data[1].sort_order).toBe(1);
    }
  });

  it("errors when recipe_id is missing", () => {
    const payload = JSON.stringify([{ area: "armor", sort_order: 0 }]);
    const result = parseProjectRecipesPayload(payload);
    expect("errors" in result).toBe(true);
  });

  it("errors when area is empty", () => {
    const payload = JSON.stringify([{ recipe_id: "abc", area: "", sort_order: 0 }]);
    const result = parseProjectRecipesPayload(payload);
    expect("errors" in result).toBe(true);
  });

  it("errors on invalid JSON", () => {
    const result = parseProjectRecipesPayload("not-json");
    expect("errors" in result).toBe(true);
  });

  it("errors when payload is not an array", () => {
    const result = parseProjectRecipesPayload(JSON.stringify({ recipe_id: "x" }));
    expect("errors" in result).toBe(true);
  });

  it("errors when payload is missing (null)", () => {
    const result = parseProjectRecipesPayload(null);
    expect("errors" in result).toBe(true);
  });
});
