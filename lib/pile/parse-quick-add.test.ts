import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "./parse-quick-add";

function fd(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return form;
}

function validFields(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    display_name: "Sergeant",
    game: "",
    faction: "",
    point_value: "",
    unit_size: "1",
    state: "unbuilt",
    ...overrides,
  };
}

describe("parseQuickAdd", () => {
  describe("display_name validation", () => {
    it("errors when display_name is missing", () => {
      const result = parseQuickAdd(fd(validFields({ display_name: "" })));
      expect(result).toMatchObject({ errors: { display_name: expect.any(String) } });
    });

    it("errors when display_name is only whitespace", () => {
      const result = parseQuickAdd(fd(validFields({ display_name: "   " })));
      expect(result).toMatchObject({ errors: { display_name: expect.any(String) } });
    });

    it("trims whitespace from display_name", () => {
      const result = parseQuickAdd(fd(validFields({ display_name: "  Hero  " })));
      expect(result).toMatchObject({ data: [{ display_name: "Hero" }] });
    });
  });

  describe("state validation", () => {
    it.each(["unbuilt", "built", "primed", "in_progress", "painted"] as const)(
      "accepts valid state '%s'",
      (state) => {
        const result = parseQuickAdd(fd(validFields({ state })));
        expect(result).toMatchObject({ data: [{ state }] });
      },
    );

    it("defaults state to unbuilt when omitted", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { state: _state, ...fields } = validFields();
      const result = parseQuickAdd(fd(fields));
      expect(result).toMatchObject({ data: [{ state: "unbuilt" }] });
    });

    it("errors on an unknown state", () => {
      const result = parseQuickAdd(fd(validFields({ state: "flying" })));
      expect(result).toMatchObject({ errors: { state: expect.any(String) } });
    });
  });

  describe("optional numeric fields", () => {
    it("coerces point_value to a number", () => {
      const result = parseQuickAdd(fd(validFields({ point_value: "150" })));
      expect(result).toMatchObject({ data: [{ point_value: 150 }] });
    });

    it("maps empty point_value to null", () => {
      const result = parseQuickAdd(fd(validFields({ point_value: "" })));
      expect(result).toMatchObject({ data: [{ point_value: null }] });
    });

    it("errors on a non-integer point_value", () => {
      const result = parseQuickAdd(fd(validFields({ point_value: "1.5" })));
      expect(result).toMatchObject({ errors: { point_value: expect.any(String) } });
    });

    it("errors on a non-numeric point_value", () => {
      const result = parseQuickAdd(fd(validFields({ point_value: "abc" })));
      expect(result).toMatchObject({ errors: { point_value: expect.any(String) } });
    });
  });

  describe("optional text fields", () => {
    it("trims and passes game and faction through", () => {
      const result = parseQuickAdd(fd(validFields({ game: " 40k ", faction: " Ultramarines " })));
      expect(result).toMatchObject({ data: [{ game: "40k", faction: "Ultramarines" }] });
    });

    it("maps empty game and faction to null", () => {
      const result = parseQuickAdd(fd(validFields({ game: "", faction: "" })));
      expect(result).toMatchObject({ data: [{ game: null, faction: null }] });
    });
  });

  describe("unit_size — single model", () => {
    it("returns a single-element array for unit_size 1", () => {
      const result = parseQuickAdd(fd(validFields({ unit_size: "1" })));
      expect("data" in result && result.data).toHaveLength(1);
    });

    it("sets unit_size to 1 on the resulting item", () => {
      const result = parseQuickAdd(fd(validFields({ unit_size: "1" })));
      expect(result).toMatchObject({ data: [{ unit_size: 1 }] });
    });
  });

  describe("unit_size — batch expansion", () => {
    it("expands unit_size 3 into 3 separate items", () => {
      const result = parseQuickAdd(fd(validFields({ display_name: "Trooper", unit_size: "3" })));
      expect("data" in result && result.data).toHaveLength(3);
    });

    it("each expanded item has unit_size 1", () => {
      const result = parseQuickAdd(fd(validFields({ unit_size: "3" })));
      expect("data" in result && result.data.every((i) => i.unit_size === 1)).toBe(true);
    });

    it("numbers expanded items in the display_name", () => {
      const result = parseQuickAdd(fd(validFields({ display_name: "Scout", unit_size: "3" })));
      expect("data" in result && result.data.map((i) => i.display_name)).toEqual([
        "Scout #1",
        "Scout #2",
        "Scout #3",
      ]);
    });

    it("errors on a non-integer unit_size", () => {
      const result = parseQuickAdd(fd(validFields({ unit_size: "2.5" })));
      expect(result).toMatchObject({ errors: { unit_size: expect.any(String) } });
    });

    it("errors on unit_size below 1", () => {
      const result = parseQuickAdd(fd(validFields({ unit_size: "0" })));
      expect(result).toMatchObject({ errors: { unit_size: expect.any(String) } });
    });

    it("errors on a non-numeric unit_size", () => {
      const result = parseQuickAdd(fd(validFields({ unit_size: "many" })));
      expect(result).toMatchObject({ errors: { unit_size: expect.any(String) } });
    });
  });

  describe("happy path — full valid input", () => {
    it("returns all fields correctly for a single model", () => {
      const result = parseQuickAdd(
        fd(
          validFields({
            display_name: "Captain",
            game: "Warhammer 40k",
            faction: "Space Marines",
            point_value: "95",
            unit_size: "1",
            state: "primed",
          }),
        ),
      );
      expect(result).toMatchObject({
        data: [
          {
            display_name: "Captain",
            game: "Warhammer 40k",
            faction: "Space Marines",
            point_value: 95,
            unit_size: 1,
            state: "primed",
          },
        ],
      });
    });
  });
});
