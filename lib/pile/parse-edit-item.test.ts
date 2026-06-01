import { describe, expect, it } from "vitest";
import { parseEditItem } from "./parse-edit-item";

function fd(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return form;
}

function validFields(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    display_name: "Space Marine Sergeant",
    game: "",
    faction: "",
    point_value: "",
    state: "unbuilt",
    ...overrides,
  };
}

describe("parseEditItem", () => {
  describe("display_name validation", () => {
    it("errors when display_name is missing", () => {
      const result = parseEditItem(fd(validFields({ display_name: "" })));
      expect(result).toMatchObject({ errors: { display_name: expect.any(String) } });
    });

    it("errors when display_name is only whitespace", () => {
      const result = parseEditItem(fd(validFields({ display_name: "   " })));
      expect(result).toMatchObject({ errors: { display_name: expect.any(String) } });
    });

    it("trims whitespace from display_name", () => {
      const result = parseEditItem(fd(validFields({ display_name: "  Hero  " })));
      expect(result).toMatchObject({ data: { display_name: "Hero" } });
    });
  });

  describe("state validation", () => {
    it.each(["unbuilt", "built", "primed", "in_progress", "painted"] as const)(
      "accepts valid state '%s'",
      (state) => {
        const result = parseEditItem(fd(validFields({ state })));
        expect(result).toMatchObject({ data: { state } });
      },
    );

    it("errors on an unknown state", () => {
      const result = parseEditItem(fd(validFields({ state: "flying" })));
      expect(result).toMatchObject({ errors: { state: expect.any(String) } });
    });

    it("errors when state is empty", () => {
      const result = parseEditItem(fd(validFields({ state: "" })));
      expect(result).toMatchObject({ errors: { state: expect.any(String) } });
    });
  });

  describe("optional text fields", () => {
    it("trims and passes game through", () => {
      const result = parseEditItem(fd(validFields({ game: "  40k  " })));
      expect(result).toMatchObject({ data: { game: "40k" } });
    });

    it("maps empty game to null", () => {
      const result = parseEditItem(fd(validFields({ game: "" })));
      expect(result).toMatchObject({ data: { game: null } });
    });

    it("trims and passes faction through", () => {
      const result = parseEditItem(fd(validFields({ faction: "  Ultramarines  " })));
      expect(result).toMatchObject({ data: { faction: "Ultramarines" } });
    });

    it("maps empty faction to null", () => {
      const result = parseEditItem(fd(validFields({ faction: "" })));
      expect(result).toMatchObject({ data: { faction: null } });
    });
  });

  describe("point_value", () => {
    it("coerces a valid integer", () => {
      const result = parseEditItem(fd(validFields({ point_value: "95" })));
      expect(result).toMatchObject({ data: { point_value: 95 } });
    });

    it("maps empty point_value to null", () => {
      const result = parseEditItem(fd(validFields({ point_value: "" })));
      expect(result).toMatchObject({ data: { point_value: null } });
    });

    it("errors on a non-integer value", () => {
      const result = parseEditItem(fd(validFields({ point_value: "1.5" })));
      expect(result).toMatchObject({ errors: { point_value: expect.any(String) } });
    });

    it("errors on a non-numeric value", () => {
      const result = parseEditItem(fd(validFields({ point_value: "lots" })));
      expect(result).toMatchObject({ errors: { point_value: expect.any(String) } });
    });
  });

  describe("happy path", () => {
    it("returns all fields correctly on a fully valid form", () => {
      const result = parseEditItem(
        fd(
          validFields({
            display_name: "Captain Uriel Ventris",
            game: "Warhammer 40k",
            faction: "Ultramarines",
            point_value: "95",
            state: "primed",
          }),
        ),
      );
      expect(result).toMatchObject({
        data: {
          display_name: "Captain Uriel Ventris",
          game: "Warhammer 40k",
          faction: "Ultramarines",
          point_value: 95,
          state: "primed",
        },
      });
    });

    it("does not include unit_size or batch expansion (single-item only)", () => {
      const result = parseEditItem(fd(validFields()));
      expect("data" in result && !("unit_size" in result.data)).toBe(true);
    });
  });
});
