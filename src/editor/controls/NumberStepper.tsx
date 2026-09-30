import styles from "./controls.module.css";

interface NumberStepperProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

const round = (n: number) => Number(n.toFixed(4));

export function NumberStepper({ label, value, onChange, placeholder, min, max, step = 1 }: NumberStepperProps) {
  const clamp = (n: number) => round(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
  const nudge = (direction: 1 | -1) => onChange(clamp((value ?? 0) + direction * step));

  return (
    <span className={styles.stepper}>
      <button type="button" className={styles.stepperButton} aria-label={`Decrease ${label}`} onClick={() => nudge(-1)} disabled={min !== undefined && value !== undefined && value <= min}>
        −
      </button>
      <input
        type="number"
        className={styles.stepperInput}
        aria-label={label}
        value={value ?? ""}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value === "" ? undefined : clamp(event.target.valueAsNumber))}
      />
      <button type="button" className={styles.stepperButton} aria-label={`Increase ${label}`} onClick={() => nudge(1)} disabled={max !== undefined && value !== undefined && value >= max}>
        +
      </button>
    </span>
  );
}
