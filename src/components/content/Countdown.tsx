"use client";
import { Frame, type NodeBaseProps } from "../frame";
import { useRuntime } from "@/runtime/context";
import { splitDuration, useCountdown, visibleUnits } from "@/runtime/countdown";
import type { Action } from "@/schema/actions";

const SIZES = {
  sm: { value: "20px", label: "10px", padding: "6px 10px", gap: "8px" },
  md: { value: "30px", label: "11px", padding: "10px 14px", gap: "10px" },
  lg: { value: "44px", label: "13px", padding: "14px 20px", gap: "14px" },
} as const;

type Size = keyof typeof SIZES;

const countdownRules = (look: "tiles" | "plain", size: Size) => (selector: string) => {
  const { value, label, padding } = SIZES[size];
  const tile =
    look === "tiles"
      ? `padding:${padding};border-radius:10px;background:color-mix(in srgb, currentColor 10%, transparent);border:1px solid color-mix(in srgb, currentColor 22%, transparent);`
      : "";
  return [
    `${selector} .pp-countdown-unit{display:grid;justify-items:center;min-width:1.6em;${tile}}`,
    `${selector} .pp-countdown-value{font-size:${value};font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}`,
    `${selector} .pp-countdown-label{font-size:${label};letter-spacing:.06em;text-transform:uppercase;opacity:.75}`,
    `${selector} .pp-countdown-separator{font-size:${value};font-weight:700;opacity:.5;align-self:start;line-height:1.1}`,
  ].join("");
};

interface CountdownProps extends NodeBaseProps {
  mode?: "date" | "duration";
  target?: string;
  durationMinutes?: number;
  showDays?: boolean;
  showSeconds?: boolean;
  showLabels?: boolean;
  look?: "tiles" | "plain";
  size?: Size;
  endText?: string;
  onEnd?: Action;
}

export function Countdown({
  mode = "date",
  target,
  durationMinutes = 15,
  showDays = true,
  showSeconds = true,
  showLabels = true,
  look = "tiles",
  size = "md",
  endText,
  onEnd,
  ...node
}: CountdownProps) {
  const { run, editing, vars } = useRuntime();
  const { remaining, isReady, isFinished } = useCountdown({
    mode,
    target,
    durationMinutes,
    isEditing: editing,
    onEnd: () => run(onEnd),
  });

  const showsEndText = isFinished && !!endText;
  const units = visibleUnits(splitDuration(remaining, showDays), { showDays, showSeconds });

  return (
    <Frame
      {...node}
      kind="countdown"
      attrs={{ role: "timer" }}
      nested={countdownRules(look, size)}
      cssProps={{ display: "flex", "align-items": "flex-start", "justify-content": "center", gap: SIZES[size].gap, "font-family": "token:font.body" }}
    >
      {showsEndText ? (
        <span className="pp-countdown-value">{vars.text(endText ?? "")}</span>
      ) : (
        units.map((unit, index) => (
          <CountdownUnit key={unit.key} unit={unit} isReady={isReady} showLabel={showLabels} showSeparator={look === "plain" && index > 0} />
        ))
      )}
    </Frame>
  );
}

function CountdownUnit({ unit, isReady, showLabel, showSeparator }: { unit: { label: string; value: string }; isReady: boolean; showLabel: boolean; showSeparator: boolean }) {
  return (
    <>
      {showSeparator && <span className="pp-countdown-separator" aria-hidden>:</span>}
      <span className="pp-countdown-unit">
        <span className="pp-countdown-value">{isReady ? unit.value : "--"}</span>
        {showLabel && <span className="pp-countdown-label">{unit.label}</span>}
      </span>
    </>
  );
}
