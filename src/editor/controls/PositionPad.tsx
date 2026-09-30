import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { ASSUMED_BLOCK, offsetsFromCenterPoint, type Point, type Size } from "@/design-system/layers";
import styles from "./controls.module.css";

interface PositionPadProps {
  label: string;
  layer: Size;
  position: Point;
  onMove: (offsets: Point) => void;
}

const PAD_WIDTH = 240;
const ARROW_STEP = 1;
const SHIFT_ARROW_STEP = 10;

const ARROW_DIRECTIONS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

export function PositionPad({ label, layer, position, onMove }: PositionPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const scale = PAD_WIDTH / layer.width;

  const moveTo = (event: PointerEvent) => {
    const pad = padRef.current?.getBoundingClientRect();
    if (!pad) return;
    onMove(offsetsFromCenterPoint({ x: (event.clientX - pad.left) / scale, y: (event.clientY - pad.top) / scale }, layer));
  };

  const nudge = (event: KeyboardEvent) => {
    const direction = ARROW_DIRECTIONS[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? SHIFT_ARROW_STEP : ARROW_STEP;
    onMove(offsetsFromCenterPoint({ x: position.x + ASSUMED_BLOCK.width / 2 + direction.x * step, y: position.y + ASSUMED_BLOCK.height / 2 + direction.y * step }, layer));
  };

  return (
    <div
      ref={padRef}
      className={styles.pad}
      style={{ width: PAD_WIDTH, height: layer.height * scale }}
      onPointerDown={(event) => {
        isDragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event);
      }}
      onPointerMove={(event) => isDragging.current && moveTo(event)}
      onPointerUp={() => (isDragging.current = false)}
      onPointerCancel={() => (isDragging.current = false)}
    >
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={`${Math.round(position.x)} pixels from the left, ${Math.round(position.y)} pixels from the top`}
        aria-valuenow={Math.round(position.x)}
        className={styles.padBlock}
        style={{
          left: position.x * scale,
          top: position.y * scale,
          width: ASSUMED_BLOCK.width * scale,
          height: ASSUMED_BLOCK.height * scale,
        }}
        onKeyDown={nudge}
      />
    </div>
  );
}
