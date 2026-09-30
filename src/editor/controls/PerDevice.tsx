import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  expandResponsive,
  inheritedValue,
  withBreakpointValue,
  type Breakpoint,
  type Responsive,
} from "@/design-system/responsive";
import styles from "./controls.module.css";

const DEVICES = [
  { id: "desktop", label: "Desktop", Icon: Monitor },
  { id: "tablet", label: "Tablet", Icon: Tablet },
  { id: "mobile", label: "Mobile", Icon: Smartphone },
] as const satisfies readonly { id: Breakpoint; label: string; Icon: unknown }[];

interface DeviceFieldProps<T> {
  value: T | undefined;
  inherited: T | undefined;
  onChange: (value: T | undefined) => void;
}

interface PerDeviceProps<T> {
  value: Responsive<T> | undefined;
  onChange: (value: Responsive<T> | undefined) => void;
  children: (props: DeviceFieldProps<T>) => ReactNode;
}

export function PerDevice<T>({ value, onChange, children }: PerDeviceProps<T>) {
  const [device, setDevice] = useState<Breakpoint>("desktop");
  const values = expandResponsive(value);
  const own = values[device];

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className={styles.deviceTabs} role="tablist" aria-label="Choose a device">
        {DEVICES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={device === id}
            className={`${styles.deviceTab} ${device === id ? styles.deviceTabActive : ""}`}
            onClick={() => setDevice(id)}
          >
            <Icon size={13} aria-hidden />
            {label}
            {id !== "desktop" && values[id] !== undefined && <span className={styles.dot} title="Changed for this device" />}
          </button>
        ))}
      </div>

      {children({
        value: own,
        inherited: inheritedValue(value, device),
        onChange: (next) => onChange(withBreakpointValue(value, device, next)),
      })}

      {device === "desktop" ? null : own === undefined ? (
        <p className={styles.hint}>Not changed here, so it matches {device === "tablet" ? "Desktop" : "Tablet or Desktop"}.</p>
      ) : (
        <button type="button" className={styles.linkButton} onClick={() => onChange(withBreakpointValue(value, device, undefined))}>
          Use the {device === "tablet" ? "Desktop" : "Tablet or Desktop"} value again
        </button>
      )}
    </div>
  );
}
