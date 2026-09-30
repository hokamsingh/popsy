import { describe, expect, it } from "vitest";
import { createBlankPopup } from "./blank";
import { parsePopup } from "@/schema/popup";

describe("createBlankPopup", () => {
  it("is valid and has an empty section to drop blocks into", () => {
    const result = parsePopup(createBlankPopup());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.children).toHaveLength(1);
  });
});
