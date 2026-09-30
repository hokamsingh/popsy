import { SidesControl } from "./SidesControl";
import styles from "./controls.module.css";

interface SpacingControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const PRESETS = [
  { value: "8px", label: "Small" },
  { value: "16px", label: "Medium" },
  { value: "24px", label: "Large" },
  { value: "40px", label: "Extra large" },
] as const;

const NONE = "none";
const CUSTOM = "custom";
const STARTING_CUSTOM = "12px 20px";

function selectedOption(value: string | undefined) {
  if (value === undefined || value === "0px") return NONE;
  return PRESETS.some((preset) => preset.value === value) ? value : CUSTOM;
}

export function SpacingControl({ label, value, onChange }: SpacingControlProps) {
  const selected = selectedOption(value);

  const choose = (next: string) => {
    if (next === NONE) onChange(undefined);
    else onChange(next === CUSTOM ? STARTING_CUSTOM : next);
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <select className={styles.select} aria-label={label} value={selected} onChange={(event) => choose(event.target.value)}>
        <option value={NONE}>None</option>
        {PRESETS.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
        <option value={CUSTOM}>Custom…</option>
      </select>
      {selected === CUSTOM && <SidesControl label={label} value={value} onChange={onChange} />}
    </div>
  );
}
