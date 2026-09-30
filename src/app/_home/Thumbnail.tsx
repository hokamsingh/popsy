import { PopupRenderer } from "@/runtime/renderer";
import type { Popup } from "@/schema/popup";
import styles from "../home.module.css";

const CANVAS_WIDTH = 900;

export function Thumbnail({ popup }: { popup: Popup }) {
  return (
    <div className={styles.thumb} inert aria-hidden>
      <div className={styles.thumbCanvas} style={{ width: CANVAS_WIDTH }}>
        <PopupRenderer popup={popup} mode="inline" editing />
      </div>
    </div>
  );
}
