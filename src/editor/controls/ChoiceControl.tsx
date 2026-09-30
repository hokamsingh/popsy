import styles from "./controls.module.css";

export interface Choice<T extends string> {
  value: T;
  label: string;
}

interface ChoiceControlProps<T extends string> {
  label: string;
  choices: readonly Choice<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  inherited?: T;
  unsetLabel?: string;
}

const MAX_SEGMENTS = 4;

export function ChoiceControl<T extends string>({ label, choices, value, onChange, inherited, unsetLabel }: ChoiceControlProps<T>) {
  if (choices.length > MAX_SEGMENTS) {
    return (
      <select
        className={styles.select}
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}
      >
        {unsetLabel && <option value="">{unsetLabel}</option>}
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    );
  }

  const active = value ?? inherited;
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {choices.map((choice) => (
        <button
          key={choice.value}
          type="button"
          aria-pressed={active === choice.value}
          className={`${styles.segment} ${active === choice.value ? styles.segmentActive : ""}`}
          onClick={() => onChange(value === choice.value && unsetLabel ? undefined : choice.value)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
