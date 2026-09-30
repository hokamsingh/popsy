import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PopupRenderer } from "./renderer";
import { splitDuration, visibleUnits } from "./countdown";
import { createEmptyPopup, parsePopup, type Popup } from "@/schema/popup";

describe("splitDuration", () => {
  it("splits into days, hours, minutes and seconds", () => {
    expect(splitDuration(90_061_000, true)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 });
  });

  it("folds days into hours when days are hidden", () => {
    expect(splitDuration(90_061_000, false)).toEqual({ days: 0, hours: 25, minutes: 1, seconds: 1 });
  });

  it("never goes negative", () => {
    expect(splitDuration(-5000, true)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("visibleUnits", () => {
  const parts = { days: 1, hours: 2, minutes: 3, seconds: 4 };

  it("pads to two digits and follows the show options", () => {
    expect(visibleUnits(parts, { showDays: true, showSeconds: true }).map((unit) => unit.value)).toEqual(["01", "02", "03", "04"]);
    expect(visibleUnits(parts, { showDays: false, showSeconds: false }).map((unit) => unit.label)).toEqual(["Hours", "Minutes"]);
  });
});

const popupWith = (props: Record<string, unknown>): Popup => ({
  ...createEmptyPopup(),
  children: [{ id: "c", type: "countdown", props }],
});

describe("Countdown in a popup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.500Z"));
  });
  afterEach(() => vi.useRealTimers());

  const values = () => [...document.querySelectorAll(".pp-countdown-value")].map((node) => node.textContent);

  it("counts down a fixed date and updates every second", () => {
    const target = "2030-01-01T01:02:03.000Z";
    render(<PopupRenderer popup={popupWith({ mode: "date", target, showDays: false })} mode="inline" />);
    expect(values()).toEqual(["01", "02", "03"]);
    act(() => void vi.advanceTimersByTime(2000));
    expect(values()).toEqual(["01", "02", "01"]);
  });

  it("starts a duration when the popup opens", () => {
    render(<PopupRenderer popup={popupWith({ mode: "duration", durationMinutes: 2, showDays: false })} mode="inline" />);
    expect(values()).toEqual(["00", "02", "00"]);
    act(() => void vi.advanceTimersByTime(3000));
    expect(values()).toEqual(["00", "01", "57"]);
  });

  it("runs the end action once when it reaches zero and shows the end message", () => {
    const offerEnded = vi.fn();
    const popup = popupWith({ mode: "duration", durationMinutes: 1, endText: "Offer over", onEnd: { type: "event", name: "offer_ended" } });
    render(<PopupRenderer popup={popup} mode="inline" actions={{ handlers: { offer_ended: offerEnded } }} />);
    act(() => void vi.advanceTimersByTime(30_000));
    expect(offerEnded).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(40_000));
    expect(offerEnded).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Offer over")).toBeTruthy();
    act(() => void vi.advanceTimersByTime(10_000));
    expect(offerEnded).toHaveBeenCalledTimes(1);
  });

  it("shows the end message without firing the action when the date has already passed", () => {
    const offerEnded = vi.fn();
    const popup = popupWith({ mode: "date", target: "2020-01-01T00:00:00.000Z", endText: "Too late", onEnd: { type: "event", name: "offer_ended" } });
    render(<PopupRenderer popup={popup} mode="inline" actions={{ handlers: { offer_ended: offerEnded } }} />);
    expect(screen.getByText("Too late")).toBeTruthy();
    act(() => void vi.advanceTimersByTime(5000));
    expect(offerEnded).not.toHaveBeenCalled();
  });

  it("holds a duration at its full length and never fires actions while editing", () => {
    const offerEnded = vi.fn();
    const popup = popupWith({ mode: "duration", durationMinutes: 1, showDays: false, onEnd: { type: "event", name: "offer_ended" } });
    render(<PopupRenderer popup={popup} mode="inline" editing actions={{ handlers: { offer_ended: offerEnded } }} />);
    act(() => void vi.advanceTimersByTime(120_000));
    expect(values()).toEqual(["00", "01", "00"]);
    expect(offerEnded).not.toHaveBeenCalled();
  });
});

describe("countdown schema", () => {
  const doc = (props: Record<string, unknown>) => ({ version: 1, type: "popup", children: [{ id: "c", type: "countdown", props }] });

  it("needs an end date when counting to a date", () => {
    const result = parsePopup(doc({ mode: "date" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors[0].path).toBe("children[0].props.target");
  });

  it("accepts a date, or a duration without a date", () => {
    expect(parsePopup(doc({ mode: "date", target: "2030-05-01T10:00:00.000Z" })).success).toBe(true);
    expect(parsePopup(doc({ mode: "duration", durationMinutes: 30 })).success).toBe(true);
  });

  it("rejects nonsense dates and out-of-range durations", () => {
    expect(parsePopup(doc({ mode: "date", target: "next friday" })).success).toBe(false);
    expect(parsePopup(doc({ mode: "duration", durationMinutes: 0 })).success).toBe(false);
  });
});
