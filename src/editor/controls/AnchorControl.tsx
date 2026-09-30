import type { Anchor } from "@/design-system/layers";
import styles from "./controls.module.css";

interface AnchorControlProps {
  label: string;
  value: Anchor | undefined;
  onChange: (value: Anchor | undefined) => void;
  inherited?: Anchor;
}

const GRID: Exclude<Anchor, "fill">[] = [
  "top-left", "top", "top-right",
  "left", "center", "right",
  "bottom-left", "bottom", "bottom-right",
];

const READABLE = (anchor: Anchor) => anchor.replace("-", " ");

export function AnchorControl({ label, value, onChange, inherited }: AnchorControlProps) {
  const active = value ?? inherited ?? "center";
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className={styles.anchorGrid} role="group" aria-label={label}>
        {GRID.map((anchor) => (
          <button
            key={anchor}
            type="button"
            title={READABLE(anchor)}
            aria-label={READABLE(anchor)}
            aria-pressed={active === anchor}
            className={`${styles.anchorCell} ${active === anchor ? styles.anchorCellActive : ""}`}
            onClick={() => onChange(anchor)}
          />
        ))}
      </div>
      <button
        type="button"
        aria-pressed={active === "fill"}
        className={`${styles.segment} ${active === "fill" ? styles.segmentActive : ""}`}
        onClick={() => onChange("fill")}
      >
        Fill the whole layer
      </button>
    </div>
  );
}

