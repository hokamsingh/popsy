import { X } from "lucide-react";
import { defaultTokens } from "@/design-system/tokens";
import { formatColor, isTokenColor, parseColor } from "./values";
import styles from "./controls.module.css";

interface ColorControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  inherited?: string;
  showOpacity?: boolean;
}

const COLOR_CHOICES = [
  { name: "Primary", value: "token:color.primary" },
  { name: "Text", value: "token:color.text" },
  { name: "Gray", value: "token:color.muted" },
  { name: "Light", value: "token:color.surface" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
] as const;

const TOKEN_NAMES: Record<string, string> = Object.fromEntries(
  COLOR_CHOICES.filter((choice) => choice.value.startsWith("token:")).map((choice) => [choice.value, `${choice.name} (theme)`]),
);

function describe(value: string | undefined, hex: string | undefined) {
  if (!value) return "Not set";
  if (isTokenColor(value)) return TOKEN_NAMES[value] ?? "Theme color";
  return hex ?? value;
}

export function ColorControl({ label, value, onChange, inherited, showOpacity = true }: ColorControlProps) {
  const color = parseColor(value);
  const shown = color ?? parseColor(inherited);
  const isUnrecognised = value !== undefined && color === null;

  if (isUnrecognised) {
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
    <div style={{ display: "grid", gap: 10 }}>
      <div className={styles.colorRow}>
        <input
          type="color"
          className={styles.colorSwatch}
          aria-label={`${label} picker`}
          value={shown?.hex ?? "#000000"}
          onChange={(event) => onChange(formatColor({ hex: event.target.value, alpha: color?.alpha ?? 1 }))}
        />
        <span className={styles.colorName}>{describe(value, color?.hex)}</span>
        {value !== undefined && (
          <button type="button" className={styles.iconButton} aria-label={`Clear ${label}`} title="Clear" onClick={() => onChange(undefined)}>
            <X size={14} aria-hidden />
          </button>
        )}
      </div>

      <div className={styles.chips}>
        {COLOR_CHOICES.map((choice) => (
          <button
            key={choice.value}
            type="button"
            title={choice.name}
            aria-label={choice.name}
            aria-pressed={value === choice.value}
            className={`${styles.chip} ${value === choice.value ? styles.chipActive : ""}`}
            style={{ background: choice.value.startsWith("token:") ? defaultTokens[choice.value.slice(6)] : choice.value }}
            onClick={() => onChange(choice.value)}
          />
        ))}
      </div>

      {showOpacity && color && (
        <label className={styles.hint} style={{ display: "grid", gap: 4 }}>
          See-through: {Math.round((1 - color.alpha) * 100)}%
          <input
            type="range"
            className={styles.slider}
            aria-label={`${label} transparency`}
            min={0}
            max={100}
            value={Math.round((1 - color.alpha) * 100)}
            onChange={(event) => onChange(formatColor({ hex: color.hex, alpha: 1 - Number(event.target.value) / 100 }))}
          />
        </label>
      )}
    </div>
  );
}
