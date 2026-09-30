import { createEmptyPopup, type Popup } from "@/schema/popup";

/** A fresh popup with one empty section, so there is somewhere to drop the first block. */
export function createBlankPopup(): Popup {
  return {
    ...createEmptyPopup("Untitled popup"),
    children: [{ id: "section-1", type: "section", props: {}, style: { padding: "32px" }, children: [] }],
  };
}
