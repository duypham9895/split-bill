import { describe, expect, test } from "vitest";
import { resolveBankBin } from "./bank-bins";

describe("resolveBankBin", () => {
  test("maps common short codes to 6-digit BIN", () => {
    expect(resolveBankBin("VCB")).toBe("970436");
    expect(resolveBankBin("TCB")).toBe("970407");
    expect(resolveBankBin("vcb")).toBe("970436"); // case-insensitive
  });
  test("passes through an existing 6-digit BIN", () => {
    expect(resolveBankBin("970415")).toBe("970415");
  });
  test("returns null for unknown code", () => {
    expect(resolveBankBin("NOTABANK")).toBeNull();
  });
  test("returns null for empty/undefined", () => {
    expect(resolveBankBin("")).toBeNull();
    expect(resolveBankBin(undefined)).toBeNull();
  });
});
