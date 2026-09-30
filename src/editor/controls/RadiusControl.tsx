import { LengthControl } from "./LengthControl";
import styles from "./controls.module.css";

interface RadiusControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  unsetLabel?: string;
}

const PRESETS = [
  { value: "0px", label: "Square" },
  { value: "token:radius.sm", label: "Slightly rounded" },
  { value: "token:radius.md", label: "Rounded" },
  { value: "token:radius.lg", label: "Very rounded" },
  { value: "token:radius.full", label: "Pill / circle" },
] as const;

const CUSTOM = "custom";
const STARTING_CUSTOM_SIZE = "12px";

export function RadiusControl({ label, value, onChange, unsetLabel }: RadiusControlProps) {
  const isPreset = PRESETS.some((preset) => preset.value === value);
  const selected = value === undefined ? "" : isPreset ? value : CUSTOM;

  const choose = (next: string) => {
    if (next === "") onChange(undefined);
    else onChange(next === CUSTOM ? STARTING_CUSTOM_SIZE : next);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <select className={styles.select} aria-label={label} value={selected} onChange={(event) => choose(event.target.value)}>
        {unsetLabel && <option value="">{unsetLabel}</option>}
        {PRESETS.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
        <option value={CUSTOM}>Custom…</option>
      </select>
      {selected === CUSTOM && (
        <LengthControl label={`${label} size`} value={value} onChange={onChange} slider={{ min: 0, max: 64 }} units={["px", "%"]} />
      )}
    </div>
  );
}
