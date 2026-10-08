import { Star } from "lucide-react";
import { allNodes } from "@/learn/objectives";
import { LEVELS, type Level } from "@/learn/types";
import type { Popup } from "@/schema/popup";
import styles from "./learn.module.css";

export function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} size={size} className={i <= count ? styles.starOn : undefined} fill={i <= count ? "currentColor" : "none"} aria-hidden />
      ))}
    </span>
  );
}

export function LevelPill({ level }: { level: Level }) {
  return <span className={`${styles.level} ${styles[`level${level}`]}`}>{LEVELS[level].name}</span>;
}

/** True when the popup is hidden on desktop and tablet, so a desktop thumbnail would look empty. */
export function isPhoneOnly(popup: Popup): boolean {
  return allNodes(popup.children).some((n) => {
    const hidden = (n.style as { hidden?: { desktop?: boolean } } | undefined)?.hidden;
    return typeof hidden === "object" && hidden?.desktop === true;
  });
}
