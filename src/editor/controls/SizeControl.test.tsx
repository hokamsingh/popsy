import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SizeControl } from "./SizeControl";

const props = { label: "Height", autoLabel: "Fit the content", fixedLabel: "Set a height", startingSize: "400px" };

describe("SizeControl", () => {
  it("treats 'auto' and an empty value as fit-the-content and hides the number box", () => {
    const { rerender } = render(<SizeControl {...props} value="auto" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Fit the content" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByLabelText("Height")).toBeNull();
    rerender(<SizeControl {...props} value={undefined} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Fit the content" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("switches to a starting size when 'Set a height' is chosen", () => {
    const onChange = vi.fn();
    render(<SizeControl {...props} value="auto" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Set a height" }));
    expect(onChange).toHaveBeenCalledWith("400px");
  });

  it("shows the number box for a fixed size and goes back to auto", () => {
    const onChange = vi.fn();
    render(<SizeControl {...props} value="320px" onChange={onChange} />);
    expect(screen.getByLabelText("Height")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fit the content" }));
    expect(onChange).toHaveBeenCalledWith("auto");
  });

  it("starts from the inherited size when a device has none of its own", () => {
    const onChange = vi.fn();
    render(<SizeControl {...props} value={undefined} inherited="500px" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Set a height" }).getAttribute("aria-pressed")).toBe("true");
  });
});
