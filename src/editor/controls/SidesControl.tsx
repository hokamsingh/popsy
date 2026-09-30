import { Link2, Link2Off } from "lucide-react";
import { useState } from "react";
import { formatSides, parseSides, type Sides } from "./values";
import styles from "./controls.module.css";

interface SidesControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  inherited?: string;
}

const SIDE_NAMES = ["Top", "Right", "Bottom", "Left"] as const;
const SIDE_AREAS = ["top", "right", "bottom", "left"] as const;

export function SidesControl({ label, value, onChange, inherited }: SidesControlProps) {
  const sides = parseSides(value);
  const [linked, setLinked] = useState(() => !sides || sides.every((side) => side === sides[0]));

  if (!sides) {
    return (
      <input className={styles.text} aria-label={label} value={value} onChange={(event) => onChange(event.target.value || undefined)} />
    );
  }

  const placeholders = parseSides(inherited) ?? [0, 0, 0, 0];

  const setSide = (index: number, amount: number) => {
    const next = (linked ? [amount, amount, amount, amount] : sides.map((side, i) => (i === index ? amount : side))) as Sides;
    onChange(next.every((side) => side === 0) ? undefined : formatSides(next));
  };

  return (
    <div className={styles.sides}>
      {SIDE_NAMES.map((name, index) => (
        <label key={name} className={styles.sideLabel} style={{ gridArea: SIDE_AREAS[index] }}>
          {name}
          <input
            type="number"
            min={0}
            className={styles.sideInput}
            aria-label={`${label} ${name.toLowerCase()}`}
            value={value === undefined ? "" : sides[index]}
            placeholder={String(placeholders[index])}
            onChange={(event) => setSide(index, Math.max(0, event.target.valueAsNumber || 0))}
          />
        </label>
      ))}
      <button
        type="button"
        className={`${styles.iconButton} ${linked ? styles.iconButtonActive : ""}`}
        style={{ gridArea: "link" }}
        aria-pressed={linked}
        aria-label="Change all sides together"
        title={linked ? "All sides move together" : "Sides are independent"}
        onClick={() => setLinked(!linked)}
      >
        {linked ? <Link2 size={15} aria-hidden /> : <Link2Off size={15} aria-hidden />}
      </button>
    </div>
  );
}
