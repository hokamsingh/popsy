import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PositionPad } from "./PositionPad";

const layer = { width: 480, height: 240 };

function renderPad(onMove = vi.fn(), position = { x: 100, y: 50 }) {
  const view = render(<PositionPad label="Position" layer={layer} position={position} onMove={onMove} />);
  const pad = view.container.firstElementChild as HTMLElement;
  pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 240, height: 120, right: 240, bottom: 120, x: 0, y: 0, toJSON: () => ({}) });
  pad.setPointerCapture = vi.fn();
  return { pad, onMove };
}

describe("PositionPad", () => {
  it("places the block where the pointer is, scaled up to the real layer size", () => {
    const { pad, onMove } = renderPad();
    fireEvent.pointerDown(pad, { clientX: 120, clientY: 60, pointerId: 1 });
    expect(onMove).toHaveBeenCalledWith({ x: 200, y: 106 });
  });

  it("follows the pointer while dragging and stops after release", () => {
    const { pad, onMove } = renderPad();
    fireEvent.pointerDown(pad, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(pad, { clientX: 60, clientY: 40 });
    expect(onMove).toHaveBeenCalledTimes(2);
    fireEvent.pointerUp(pad);
    fireEvent.pointerMove(pad, { clientX: 100, clientY: 80 });
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it("nudges with the arrow keys, in bigger steps with Shift", () => {
    const { onMove } = renderPad();
    const block = screen.getByRole("slider");
    fireEvent.keyDown(block, { key: "ArrowRight" });
    expect(onMove).toHaveBeenLastCalledWith({ x: 101, y: 50 });
    fireEvent.keyDown(block, { key: "ArrowDown", shiftKey: true });
    expect(onMove).toHaveBeenLastCalledWith({ x: 100, y: 60 });
  });

  it("describes the position for screen readers", () => {
    renderPad();
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("100 pixels from the left, 50 pixels from the top");
  });
});
