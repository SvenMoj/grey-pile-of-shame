import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUserOrRedirect } from "@/lib/user/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteRecipeAction } from "./actions";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/user/auth", () => ({ getUserOrRedirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// Build a minimal Supabase client stub with a configurable delete result.
function buildClient(deleteResult: {
  data: { id: string }[] | null;
  error: { message: string } | null;
}) {
  const select = vi.fn().mockResolvedValue(deleteResult);
  const eq2 = vi.fn().mockReturnValue({ select });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const del = vi.fn().mockReturnValue({ eq: eq1 });
  const storageFrom = vi.fn().mockReturnValue({
    list: vi.fn().mockResolvedValue({ data: [] }),
    remove: vi.fn().mockResolvedValue({ data: [] }),
  });
  return {
    from: vi.fn().mockReturnValue({ delete: del }),
    storage: { from: storageFrom },
  };
}

function makeFormData(id: string) {
  const fd = new FormData();
  if (id) fd.set("id", id);
  return fd;
}

describe("deleteRecipeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getUserOrRedirect).mockResolvedValue({ id: "user-abc" } as any);
  });

  it("returns an error without hitting the DB when id is missing", async () => {
    const result = await deleteRecipeAction(makeFormData(""));
    expect(result).toEqual({ error: "Missing recipe id." });
    expect(vi.mocked(createClient)).not.toHaveBeenCalled();
    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });

  it("returns an error and does not redirect when zero rows are deleted", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createClient).mockResolvedValue(buildClient({ data: [], error: null }) as any);
    const result = await deleteRecipeAction(makeFormData("recipe-123"));
    expect(result).toMatchObject({ error: expect.any(String) });
    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });

  it("returns the db error message and does not redirect", async () => {
    vi.mocked(createClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildClient({ data: null, error: { message: "permission denied" } }) as any,
    );
    const result = await deleteRecipeAction(makeFormData("recipe-123"));
    expect(result).toEqual({ error: "permission denied" });
    expect(vi.mocked(redirect)).not.toHaveBeenCalled();
  });

  it("revalidates /recipes and redirects on successful delete", async () => {
    vi.mocked(createClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildClient({ data: [{ id: "recipe-123" }], error: null }) as any,
    );
    await deleteRecipeAction(makeFormData("recipe-123"));
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/recipes");
    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/recipes");
  });
});
