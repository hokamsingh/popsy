import { parsePopup, type Popup } from "@/schema/popup";
import { BENCHMARKS } from "@/templates/benchmarks";

const KEY = "popsy:popup:v1";

export function loadPopup(): Popup {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = parsePopup(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    }
  } catch {
  }
  return BENCHMARKS["two-column-promotion"]();
}

export function savePopup(popup: Popup): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(popup));
  } catch {
  }
}
