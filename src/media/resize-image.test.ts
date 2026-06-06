import { describe, expect, test } from "vitest";
import { isImageFile } from "./resize-image";

describe("isImageFile", () => {
  test("accepts image mime types", () => {
    expect(isImageFile(new File([], "a.jpg", { type: "image/jpeg" }))).toBe(true);
    expect(isImageFile(new File([], "a.png", { type: "image/png" }))).toBe(true);
  });
  test("rejects non-images", () => {
    expect(isImageFile(new File([], "a.pdf", { type: "application/pdf" }))).toBe(false);
  });
});
