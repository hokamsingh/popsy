import { X } from "lucide-react";
import { NumberStepper } from "./NumberStepper";
import { formatLength, parseLength, type LengthUnit } from "./values";
import styles from "./controls.module.css";

export interface SliderRange {
  min: number;
  max: number;
  step?: number;
}

export interface LengthControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  inherited?: string;
  slider?: SliderRange;
  units?: readonly LengthUnit[];
  allowAuto?: boolean;
}

const DEFAULT_UNITS: readonly LengthUnit[] = ["px", "%", "rem"];

export function LengthControl({ label, value, onChange, inherited, slider, units = DEFAULT_UNITS, allowAuto }: LengthControlProps) {
  const current = parseLength(value);
  const fallback = parseLength(inherited);
  const unit = current?.unit ?? fallback?.unit ?? units[0];
  const isCustomText = value !== undefined && current === null;

  const setAmount = (amount: number | undefined) =>
    onChange(amount === undefined ? undefined : formatLength({ amount, unit }));

  if (isCustomText) {
    return (
      <div className={styles.row}>
        <input className={styles.text} aria-label={label} value={value} onChange={(event) => onChange(event.target.value || undefined)} />
        <button type="button" className={styles.iconButton} aria-label={`Reset ${label}`} title="Reset" onClick={() => onChange(undefined)}>
          <X size={14} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className={styles.row}>
        <NumberStepper label={label} value={current?.amount} onChange={setAmount} placeholder={fallback ? String(fallback.amount) : "auto"} step={unit === "rem" || unit === "em" ? 0.25 : 1} />
        <select
          className={styles.select}
          aria-label={`${label} unit`}
          value={unit}
          onChange={(event) => current && onChange(formatLength({ amount: current.amount, unit: event.target.value as LengthUnit }))}
        >
          {units.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {allowAuto && (
          <button type="button" className={styles.segment} onClick={() => onChange("auto")}>
            Auto
          </button>
        )}
        {value !== undefined && (
          <button type="button" className={styles.iconButton} aria-label={`Clear ${label}`} title="Clear" onClick={() => onChange(undefined)}>
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      {slider && unit === "px" && (
        <input
          type="range"
          className={styles.slider}
          aria-label={`${label} slider`}
          min={slider.min}
          max={slider.max}
          step={slider.step ?? 1}
          value={current?.amount ?? fallback?.amount ?? slider.min}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      )}
    </div>
  );
}
