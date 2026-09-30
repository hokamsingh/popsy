import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FONTS } from "@/design-system/fonts";
import { FontControl } from "./FontControl";

const lora = FONTS.find((font) => font.id === "lora")!;

describe("FontControl", () => {
  it("stores a theme reference when used on a single block", () => {
    const onChange = vi.fn();
    render(<FontControl label="Font" value={undefined} onChange={onChange} storeAs="reference" unsetLabel="Use the popup's font" />);
    fireEvent.change(screen.getByLabelText("Font"), { target: { value: "token:font.lora" } });
    expect(onChange).toHaveBeenCalledWith("token:font.lora");
  });

  it("stores the whole font stack when used for the popup-wide fonts", () => {
    const onChange = vi.fn();
    render(<FontControl label="Body font" value={undefined} onChange={onChange} storeAs="stack" unsetLabel="Default" />);
    fireEvent.change(screen.getByLabelText("Body font"), { target: { value: lora.stack } });
    expect(onChange).toHaveBeenCalledWith(lora.stack);
  });

  it("clears back to the default", () => {
    const onChange = vi.fn();
    render(<FontControl label="Font" value="token:font.lora" onChange={onChange} storeAs="reference" unsetLabel="Default" />);
    fireEvent.change(screen.getByLabelText("Font"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("previews the chosen font and keeps unknown values visible as custom", () => {
    const { rerender } = render(<FontControl label="Font" value="token:font.lora" onChange={() => {}} storeAs="reference" unsetLabel="Default" />);
    expect(screen.getByText(/quick brown fox/).getAttribute("style")).toContain("Lora");
    rerender(<FontControl label="Font" value="Comic Sans MS" onChange={() => {}} storeAs="reference" unsetLabel="Default" />);
    expect(screen.getByText("Custom: Comic Sans MS")).toBeTruthy();
  });
});
