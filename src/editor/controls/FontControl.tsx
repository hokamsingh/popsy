import { FONT_CATEGORIES, FONTS, fontTokenReference, findFontByReference, findFontByStack } from "@/design-system/fonts";
import styles from "./controls.module.css";

interface FontControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  storeAs: "reference" | "stack";
  unsetLabel: string;
}

const CUSTOM = "custom";
const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";

export function FontControl({ label, value, onChange, storeAs, unsetLabel }: FontControlProps) {
  const valueFor = (font: (typeof FONTS)[number]) => (storeAs === "reference" ? fontTokenReference(font.id) : font.stack);
  const known = storeAs === "reference" ? findFontByReference(value) : findFontByStack(value);
  const selected = value === undefined ? "" : known ? valueFor(known) : CUSTOM;
  const previewFamily = known?.stack ?? value;

  const choose = (next: string) => {
    if (next === "") onChange(undefined);
    else if (next !== CUSTOM) onChange(next);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <select
        className={styles.select}
        aria-label={label}
        value={selected}
        onChange={(event) => choose(event.target.value)}
      >
        <option value="">{unsetLabel}</option>
        {FONT_CATEGORIES.map((category) => (
          <optgroup key={category} label={category}>
            {FONTS.filter((font) => font.category === category).map((font) => (
              <option key={font.id} value={valueFor(font)}>
                {font.label}
              </option>
            ))}
          </optgroup>
        ))}
        {selected === CUSTOM && <option value={CUSTOM}>Custom: {value}</option>}
      </select>
      {value !== undefined && (
        <p className={styles.fontPreview} style={{ fontFamily: previewFamily }}>
          {SAMPLE_TEXT}
        </p>
      )}
    </div>
  );
}
