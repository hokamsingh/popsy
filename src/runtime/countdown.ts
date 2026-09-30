import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface DurationParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function splitDuration(milliseconds: number, includeDays: boolean): DurationParts {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const days = includeDays ? Math.floor(total / 86_400) : 0;
  const rest = total - days * 86_400;
  return {
    days,
    hours: Math.floor(rest / 3600),
    minutes: Math.floor((rest % 3600) / 60),
    seconds: rest % 60,
  };
}

export interface CountdownUnit {
  key: keyof DurationParts;
  label: string;
  value: string;
}

export function visibleUnits(parts: DurationParts, options: { showDays: boolean; showSeconds: boolean }): CountdownUnit[] {
  const units: CountdownUnit[] = [
    { key: "days", label: "Days", value: String(parts.days).padStart(2, "0") },
    { key: "hours", label: "Hours", value: String(parts.hours).padStart(2, "0") },
    { key: "minutes", label: "Minutes", value: String(parts.minutes).padStart(2, "0") },
    { key: "seconds", label: "Seconds", value: String(parts.seconds).padStart(2, "0") },
  ];
  return units.filter((unit) => (unit.key === "days" ? options.showDays : unit.key === "seconds" ? options.showSeconds : true));
}

const subscribeToClock = (onTick: () => void) => {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
};
const currentSecond = () => Math.floor(Date.now() / 1000);
const beforeFirstTick = () => 0;

interface CountdownOptions {
  mode: "date" | "duration";
  target: string | undefined;
  durationMinutes: number;
  isEditing: boolean;
  onEnd: () => void;
}

export function useCountdown({ mode, target, durationMinutes, isEditing, onEnd }: CountdownOptions) {
  const second = useSyncExternalStore(subscribeToClock, currentSecond, beforeFirstTick);
  const [openedAt] = useState(() => Date.now());
  const sawTimeLeft = useRef(false);

  const fullDuration = durationMinutes * 60_000;
  const endsAt = mode === "duration" ? openedAt + fullDuration : target ? Date.parse(target) : 0;

  const isReady = second !== 0;
  const holdsAtFullDuration = mode === "duration" && isEditing;
  const remaining = holdsAtFullDuration ? fullDuration : Math.max(0, endsAt - second * 1000);
  const isFinished = isReady && remaining === 0;

  useEffect(() => {
    if (remaining > 0) {
      sawTimeLeft.current = true;
      return;
    }
    if (isFinished && sawTimeLeft.current && !isEditing) {
      sawTimeLeft.current = false;
      onEnd();
    }
  }, [remaining, isFinished, isEditing, onEnd]);

  return { remaining, isReady, isFinished };
}
