import { ChoiceControl } from "./ChoiceControl";
import { LengthControl, type SliderRange } from "./LengthControl";
import { parseLength } from "./values";

interface SizeControlProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  inherited?: string;
  slider?: SliderRange;
  autoLabel: string;
  fixedLabel: string;
  startingSize: string;
}

type Mode = "auto" | "fixed";

function currentMode(value: string | undefined, inherited: string | undefined): Mode {
  const effective = value ?? inherited;
  return effective === undefined || effective === "auto" ? "auto" : "fixed";
}

export function SizeControl({ label, value, onChange, inherited, slider, autoLabel, fixedLabel, startingSize }: SizeControlProps) {
  const mode = currentMode(value, inherited);

  const chooseMode = (next: Mode | undefined) => {
    if (next === "auto") onChange("auto");
    if (next === "fixed") onChange(parseLength(inherited) ? inherited : startingSize);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <ChoiceControl
        label={`${label} mode`}
        choices={[
          { value: "auto", label: autoLabel },
          { value: "fixed", label: fixedLabel },
        ]}
        value={mode}
        onChange={chooseMode}
      />
      {mode === "fixed" && <LengthControl label={label} value={value} onChange={onChange} inherited={inherited} slider={slider} units={["px", "%", "rem"]} />}
    </div>
  );
}
