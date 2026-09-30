import { useState } from "react";
import { NumberStepper } from "./NumberStepper";
import { formatSides, parseSides, type Sides } from "./values";
import styles from "./controls.module.css";

interface SidesControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const SIDE_NAMES = ["Top", "Right", "Bottom", "Left"] as const;

export function SidesControl({ label, value, onChange }: SidesControlProps) {
  const sides = parseSides(value);
  const [sameOnAllSides, setSameOnAllSides] = useState(() => !sides || sides.every((side) => side === sides[0]));

  if (!sides) {
    return <input className={styles.text} aria-label={label} value={value} onChange={(event) => onChange(event.target.value || undefined)} />;
  }

  const save = (next: Sides) => onChange(next.every((side) => side === 0) ? undefined : formatSides(next));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <label className={styles.checkRow}>
        <input type="checkbox" checked={sameOnAllSides} onChange={(event) => setSameOnAllSides(event.target.checked)} />
        Same on all sides
      </label>

      {sameOnAllSides ? (
        <NumberStepper label={`${label}, all sides`} value={sides[0]} min={0} onChange={(amount) => save([amount ?? 0, amount ?? 0, amount ?? 0, amount ?? 0])} />
      ) : (
        <div className={styles.sidesGrid}>
          {SIDE_NAMES.map((name, index) => (
            <label key={name} className={styles.sideLabel}>
              {name}
              <NumberStepper
                label={`${label}, ${name.toLowerCase()}`}
                value={sides[index]}
                min={0}
                onChange={(amount) => save(sides.map((side, i) => (i === index ? (amount ?? 0) : side)) as Sides)}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
