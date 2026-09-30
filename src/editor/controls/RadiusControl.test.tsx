import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RadiusControl } from "./RadiusControl";

describe("RadiusControl", () => {
  it("offers named sizes and writes the matching theme value", () => {
    const onChange = vi.fn();
    render(<RadiusControl label="Corner roundness" value={undefined} onChange={onChange} unsetLabel="Default" />);
    fireEvent.change(screen.getByLabelText("Corner roundness"), { target: { value: "token:radius.full" } });
    expect(onChange).toHaveBeenCalledWith("token:radius.full");
  });

  it("shows the current preset by name", () => {
    render(<RadiusControl label="Corner roundness" value="token:radius.lg" onChange={() => {}} />);
    expect((screen.getByLabelText("Corner roundness") as HTMLSelectElement).selectedOptions[0].textContent).toBe("Very rounded");
  });

  it("clears back to the default", () => {
    const onChange = vi.fn();
    render(<RadiusControl label="Corner roundness" value="token:radius.md" onChange={onChange} unsetLabel="Default" />);
    fireEvent.change(screen.getByLabelText("Corner roundness"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("reveals an exact-size control for custom values", () => {
    const onChange = vi.fn();
    const { rerender } = render(<RadiusControl label="Corner roundness" value="token:radius.md" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Corner roundness"), { target: { value: "custom" } });
    expect(onChange).toHaveBeenCalledWith("12px");
    rerender(<RadiusControl label="Corner roundness" value="12px" onChange={onChange} />);
    expect(screen.getByLabelText("Corner roundness size slider")).toBeTruthy();
  });
});
