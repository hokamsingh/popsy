import type { ReactNode } from "react";
import styles from "./controls.module.css";

interface FieldShellProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function FieldShell({ label, hint, children }: FieldShellProps) {
  return (
    <div className={styles.shell}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
