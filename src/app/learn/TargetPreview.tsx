"use client";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./learn.module.css";

const DEVICES = [
  { id: "desktop", label: "Desktop", width: 900 },
  { id: "tablet", label: "Tablet", width: 720 },
  { id: "mobile", label: "Mobile", width: 390 },
] as const;

const FRAME_HEIGHT = 520;

/** The finished popup in a frame at a chosen device width, scaled to fit the panel. */
export function TargetPreview({ id }: { id: string }) {
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("desktop");
  const box = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(340);
  const width = DEVICES.find((d) => d.id === device)?.width ?? 900;
  const scale = Math.min(1, boxWidth / width);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    observer.observe(el);
    setBoxWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.preview}>
      <div className={styles.previewTools}>
        <div className={styles.seg} role="group" aria-label="Preview device">
          {DEVICES.map((d) => (
            <button key={d.id} type="button" aria-pressed={device === d.id} className={device === d.id ? styles.segOn : undefined} onClick={() => setDevice(d.id)}>
              {d.label}
            </button>
          ))}
        </div>
        <a className={styles.previewOpen} href={`/learn/target/${id}`} target="_blank" rel="noreferrer">
          Open full size <ExternalLink size={11} aria-hidden style={{ verticalAlign: "-1px" }} />
        </a>
      </div>
      <div ref={box} className={styles.previewBox} style={{ height: FRAME_HEIGHT * scale }}>
        <iframe
          key={device}
          title={`Target popup on ${device}`}
          src={`/learn/target/${id}`}
          className={styles.previewFrame}
          style={{ width, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
