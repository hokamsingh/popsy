import styles from "./controls.module.css";

interface ToggleControlProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleControl({ label, hint, checked, onChange }: ToggleControlProps) {
  return (
    <div className={styles.toggle}>
      <div className={styles.toggleText}>
        <span className={styles.label}>{label}</span>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`${styles.switch} ${checked ? styles.switchOn : ""}`}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
