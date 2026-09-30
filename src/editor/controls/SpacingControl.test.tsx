import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpacingControl } from "./SpacingControl";

const choose = (value: string) => fireEvent.change(screen.getByLabelText("Space inside"), { target: { value } });

describe("SpacingControl", () => {
  it("offers named amounts and writes a plain pixel value", () => {
    const onChange = vi.fn();
    render(<SpacingControl label="Space inside" value={undefined} onChange={onChange} />);
    choose("16px");
    expect(onChange).toHaveBeenCalledWith("16px");
  });

  it("goes back to nothing when None is chosen", () => {
    const onChange = vi.fn();
    render(<SpacingControl label="Space inside" value="24px" onChange={onChange} />);
    choose("none");
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("only shows the per-side boxes for custom values", () => {
    const { rerender } = render(<SpacingControl label="Space inside" value="16px" onChange={() => {}} />);
    expect(screen.queryByText("Same on all sides")).toBeNull();
    rerender(<SpacingControl label="Space inside" value="10px 30px" onChange={() => {}} />);
    expect(screen.getByText("Same on all sides")).toBeTruthy();
    expect(screen.getByText("Top")).toBeTruthy();
  });

  it("edits one side at a time when sides are not linked", () => {
    const onChange = vi.fn();
    render(<SpacingControl label="Space inside" value="10px 30px" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Space inside, top"), { target: { value: "50" } });
    expect(onChange).toHaveBeenCalledWith("50px 30px 10px 30px");
  });
});
