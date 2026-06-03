import { describe, it, expect } from "vitest";
import { validatePassword, MIN_PASSWORD_LENGTH } from "./password";

describe("validatePassword", () => {
  it("returns an error when password is too short", () => {
    const result = validatePassword("short", "short");
    expect(result).toContain(String(MIN_PASSWORD_LENGTH));
  });

  it("returns an error when passwords do not match", () => {
    const result = validatePassword("longpassword1", "longpassword2");
    expect(result).not.toBeNull();
    expect(result).toMatch(/match/i);
  });

  it("returns an error when password is empty", () => {
    const result = validatePassword("", "");
    expect(result).not.toBeNull();
  });

  it("returns null for a valid password that matches confirmation", () => {
    const result = validatePassword("securePassword1!", "securePassword1!");
    expect(result).toBeNull();
  });

  it("returns null for a password exactly at the minimum length", () => {
    const pw = "a".repeat(MIN_PASSWORD_LENGTH);
    const result = validatePassword(pw, pw);
    expect(result).toBeNull();
  });
});
