"use client";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { expandResponsive, resolveResponsive, type Responsive } from "@/design-system/responsive";
import type { Style } from "@/design-system/styles";
import { topLeftPoint, type Anchor, type Size } from "@/design-system/layers";
import { AnchorControl } from "./AnchorControl";
import { ChoiceControl, type Choice } from "./ChoiceControl";
import { ColorControl } from "./ColorControl";
import { FieldShell } from "./FieldShell";
import { LengthControl, type SliderRange } from "./LengthControl";
import { NumberStepper } from "./NumberStepper";
import { PerDevice } from "./PerDevice";
import { PositionPad } from "./PositionPad";
import { RadiusControl } from "./RadiusControl";
import { SpacingControl } from "./SpacingControl";
import { SizeControl } from "./SizeControl";
import { ToggleControl } from "./ToggleControl";
import { formatBlur, formatBorder, parseBlur, parseLength, parseBorder, BORDER_STYLES, type Border, type BorderStyle } from "./values";
import styles from "./controls.module.css";

type Update = <K extends keyof Style>(key: K, value: Style[K] | undefined) => void;

interface SectionProps {
  style: Style;
  update: Update;
  patch: (changes: Style) => void;
}

const plain = <T,>(value: Responsive<T> | undefined): T | undefined => expandResponsive(value).desktop;

const GRADIENTS = [
  { name: "Sunset", value: "linear-gradient(135deg, #f59e0b, #ec4899)" },
  { name: "Ocean", value: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { name: "Aurora", value: "linear-gradient(135deg, #22c55e, #0ea5e9, #8b5cf6)" },
  { name: "Berry", value: "linear-gradient(135deg, #6366f1, #ec4899 60%, #f59e0b)" },
  { name: "Night", value: "linear-gradient(160deg, #0f172a, #334155)" },
] as const;

const SHADOWS: Choice<string>[] = [
  { value: "none", label: "None" },
  { value: "token:shadow.sm", label: "Soft" },
  { value: "token:shadow.md", label: "Medium" },
  { value: "token:shadow.lg", label: "Strong" },
];

const TEXT_ALIGNMENTS: Choice<"left" | "center" | "right" | "justify">[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];

const BORDER_CHOICES: Choice<BorderStyle>[] = BORDER_STYLES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

const IMAGE_FITS: Choice<string>[] = [
  { value: "cover", label: "Fill" },
  { value: "contain", label: "Fit inside" },
];

const IMAGE_POSITIONS: Choice<string>[] = ["center", "top", "bottom", "left", "right"].map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}));

const POSITIONS: Choice<string>[] = [
  { value: "static", label: "Normal" },
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Free" },
  { value: "sticky", label: "Sticky" },
];

const OVERFLOWS: Choice<string>[] = [
  { value: "visible", label: "Show overflow" },
  { value: "hidden", label: "Clip" },
  { value: "auto", label: "Scroll if needed" },
  { value: "scroll", label: "Always scroll" },
];

const FROSTED_GLASS: Style = {
  background: "rgba(255, 255, 255, 0.18)",
  backdropFilter: "blur(14px) saturate(1.4)",
  border: "1px solid rgba(255, 255, 255, 0.35)",
};

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className={styles.section} open={defaultOpen}>
      <summary className={styles.sectionTitle}>
        {title}
        <ChevronDown size={16} aria-hidden />
      </summary>
      <div className={styles.sectionBody}>{children}</div>
    </details>
  );
}

function LengthRow({
  field,
  label,
  hint,
  slider,
  style,
  update,
}: SectionProps & { field: "minHeight" | "maxWidth"; label: string; hint?: string; slider?: SliderRange }) {
  return (
    <FieldShell label={label} hint={hint}>
      <PerDevice value={style[field]} onChange={(next) => update(field, next)}>
        {(device) => <LengthControl label={label} slider={slider} {...device} />}
      </PerDevice>
    </FieldShell>
  );
}

function SizeRow({
  field,
  label,
  autoLabel,
  fixedLabel,
  startingSize,
  slider,
  style,
  update,
}: SectionProps & { field: "width" | "height"; label: string; autoLabel: string; fixedLabel: string; startingSize: string; slider: SliderRange }) {
  return (
    <FieldShell label={label}>
      <PerDevice value={style[field]} onChange={(next) => update(field, next)}>
        {(device) => <SizeControl label={label} autoLabel={autoLabel} fixedLabel={fixedLabel} startingSize={startingSize} slider={slider} {...device} />}
      </PerDevice>
    </FieldShell>
  );
}

function SidesRow({ field, label, hint, style, update }: SectionProps & { field: "padding" | "margin"; label: string; hint: string }) {
  return (
    <FieldShell label={label} hint={hint}>
      <PerDevice value={style[field]} onChange={(next) => update(field, next)}>
        {(device) => <SpacingControl label={label} value={device.value} onChange={device.onChange} />}
      </PerDevice>
    </FieldShell>
  );
}

const pixels = (value: string | undefined) => {
  const length = parseLength(value);
  return length?.unit === "px" ? length.amount : undefined;
};

function LayerSection({ style, update, patch, layer }: SectionProps & { layer: Size }) {
  const anchor: Anchor = plain(style.anchor) ?? "center";
  const offsetX = pixels(style.offsetX as string | undefined) ?? 0;
  const offsetY = pixels(style.offsetY as string | undefined) ?? 0;
  const position = topLeftPoint(anchor, offsetX, offsetY, layer);

  return (
    <Section title="Position on the layer" defaultOpen>
      <FieldShell label="Where it sits" hint="This block floats on top of the others. Blocks lower in the Outline appear in front.">
        <PerDevice value={style.anchor} onChange={(next) => update("anchor", next)}>
          {(device) => <AnchorControl label="Where it sits" {...device} />}
        </PerDevice>
      </FieldShell>
      <FieldShell label="Or drag it anywhere" hint="Drag inside the box, or focus the blue box and use the arrow keys (Shift for bigger steps).">
        <PositionPad
          label="Position on the layer"
          layer={layer}
          position={position}
          onMove={({ x, y }) => patch({ anchor: "top-left", offsetX: `${x}px`, offsetY: `${y}px` })}
        />
      </FieldShell>
      <FieldShell label="Distance across" hint="Pushes it away from the left or right edge. For the middle spots it nudges sideways.">
        <LengthControl label="Distance across" value={style.offsetX as string | undefined} onChange={(next) => update("offsetX", next)} slider={{ min: -100, max: 100 }} units={["px"]} />
      </FieldShell>
      <FieldShell label="Distance down" hint="Pushes it away from the top or bottom edge. For the middle spots it nudges up or down.">
        <LengthControl label="Distance down" value={style.offsetY as string | undefined} onChange={(next) => update("offsetY", next)} slider={{ min: -100, max: 100 }} units={["px"]} />
      </FieldShell>
    </Section>
  );
}

function SpacingSection(props: SectionProps) {
  return (
    <Section title="Spacing" defaultOpen>
      <SidesRow {...props} field="padding" label="Space inside" hint="Gap between the edge of this block and what it contains." />
      <SidesRow {...props} field="margin" label="Space outside" hint="Gap between this block and the blocks next to it." />
    </Section>
  );
}

function SizeSection(props: SectionProps) {
  return (
    <Section title="Size">
      <SizeRow {...props} field="width" label="Width" autoLabel="Automatic" fixedLabel="Set a width" startingSize="300px" slider={{ min: 40, max: 900, step: 10 }} />
      <SizeRow {...props} field="height" label="Height" autoLabel="Fit the content" fixedLabel="Set a height" startingSize="200px" slider={{ min: 20, max: 800, step: 10 }} />
      <LengthRow {...props} field="minHeight" label="Minimum height" hint="It never gets shorter than this." slider={{ min: 0, max: 600, step: 10 }} />
      <LengthRow {...props} field="maxWidth" label="Maximum width" hint="It never gets wider than this." slider={{ min: 100, max: 1000, step: 10 }} />
    </Section>
  );
}

function TextSection({ style, update }: SectionProps) {
  return (
    <Section title="Text">
      <FieldShell label="Text color" hint="Applies to text inside, unless a block sets its own.">
        <ColorControl label="Text color" value={plain(style.color)} onChange={(next) => update("color", next)} showOpacity={false} />
      </FieldShell>
      <FieldShell label="Gradient text" hint="Fills the letters with a gradient instead of a flat colour.">
        <div className={styles.gradients}>
          <button type="button" className={`${styles.segment} ${plain(style.textGradient) === undefined ? styles.segmentActive : ""}`} onClick={() => update("textGradient", undefined)}>
            None
          </button>
          {GRADIENTS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              aria-label={`${preset.name} text`}
              aria-pressed={plain(style.textGradient) === preset.value}
              className={`${styles.gradient} ${plain(style.textGradient) === preset.value ? styles.gradientActive : ""}`}
              style={{ background: preset.value }}
              onClick={() => update("textGradient", preset.value)}
            />
          ))}
        </div>
      </FieldShell>
      <FieldShell label="Text alignment">
        <PerDevice value={style.textAlign} onChange={(next) => update("textAlign", next)}>
          {(device) => <ChoiceControl label="Text alignment" choices={TEXT_ALIGNMENTS} unsetLabel="Default" {...device} />}
        </PerDevice>
      </FieldShell>
    </Section>
  );
}

function BackgroundSection({ style, update }: SectionProps) {
  const gradient = plain(style.gradient);
  return (
    <Section title="Background">
      <FieldShell label="Color" hint="Use 'See-through' to let what's behind show.">
        <ColorControl label="Background color" value={plain(style.background)} onChange={(next) => update("background", next)} />
      </FieldShell>
      <FieldShell label="Gradient" hint="A gradient replaces the background image.">
        <div className={styles.gradients}>
          <button type="button" className={`${styles.segment} ${gradient === undefined ? styles.segmentActive : ""}`} onClick={() => update("gradient", undefined)}>
            None
          </button>
          {GRADIENTS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              aria-pressed={gradient === preset.value}
              className={`${styles.gradient} ${gradient === preset.value ? styles.gradientActive : ""}`}
              style={{ background: preset.value }}
              onClick={() => update("gradient", preset.value)}
            />
          ))}
        </div>
      </FieldShell>
      <FieldShell label="Image" hint="Paste a link to an image (https://…).">
        <input
          className={styles.text}
          aria-label="Background image link"
          placeholder="https://example.com/photo.jpg"
          value={style.backgroundImage ?? ""}
          onChange={(event) => update("backgroundImage", event.target.value || undefined)}
        />
        {style.backgroundImage && (
          <>
            <ChoiceControl label="Image size" choices={IMAGE_FITS} value={plain(style.backgroundSize)} onChange={(next) => update("backgroundSize", next)} unsetLabel="Default" />
            <ChoiceControl label="Image position" choices={IMAGE_POSITIONS} value={plain(style.backgroundPosition)} onChange={(next) => update("backgroundPosition", next)} unsetLabel="Default" />
          </>
        )}
      </FieldShell>
    </Section>
  );
}

function BorderSection({ style, update }: SectionProps) {
  const border = parseBorder(plain(style.border));
  const rawBorder = plain(style.border);
  const setBorder = (next: Partial<Border>) => {
    const merged = { width: 1, style: "solid" as BorderStyle, color: "token:color.border", ...border, ...next };
    update("border", merged.width > 0 ? formatBorder(merged) : undefined);
  };
  const shadow = plain(style.shadow);

  return (
    <Section title="Border & shadow">
      <FieldShell label="Border thickness">
        {rawBorder !== undefined && !border ? (
          <input className={styles.text} aria-label="Border" value={rawBorder} onChange={(event) => update("border", event.target.value || undefined)} />
        ) : (
          <>
            <NumberStepper label="Border thickness" value={border?.width ?? 0} min={0} max={20} onChange={(width) => setBorder({ width: width ?? 0 })} />
            {border && <ChoiceControl label="Border style" choices={BORDER_CHOICES} value={border.style} onChange={(value) => value && setBorder({ style: value })} />}
          </>
        )}
      </FieldShell>
      {border && (
        <FieldShell label="Border color">
          <ColorControl label="Border color" value={border.color} onChange={(color) => setBorder({ color: color ?? "token:color.border" })} />
        </FieldShell>
      )}
      <FieldShell label="Corner roundness">
        <RadiusControl label="Corner roundness" value={plain(style.radius)} onChange={(next) => update("radius", next)} unsetLabel="Default" />
      </FieldShell>
      <FieldShell label="Shadow">
        <ChoiceControl
          label="Shadow"
          choices={SHADOWS}
          value={shadow ?? "none"}
          onChange={(next) => update("shadow", next === "none" ? undefined : next)}
        />
      </FieldShell>
    </Section>
  );
}

function EffectsSection({ style, update, patch }: SectionProps) {
  const blur = parseBlur(plain(style.backdropFilter));
  const opacity = plain(style.opacity);
  return (
    <Section title="Glass & effects">
      <FieldShell label="Frosted glass" hint="Sets a see-through white background, a blur and a soft edge in one click. It needs a photo or colour behind it to show.">
        <button type="button" className={styles.presetButton} onClick={() => patch(FROSTED_GLASS)}>
          Make it frosted glass
        </button>
      </FieldShell>
      <FieldShell label={`Blur behind: ${blur}px`} hint="Blurs whatever is behind this. Pair with a see-through background.">
        <input
          type="range"
          className={styles.slider}
          aria-label="Blur behind"
          min={0}
          max={40}
          value={blur}
          onChange={(event) => update("backdropFilter", formatBlur(Number(event.target.value), plain(style.backdropFilter)))}
        />
      </FieldShell>
      <FieldShell label={`Overall see-through: ${Math.round((1 - (opacity ?? 1)) * 100)}%`} hint="Fades the whole block, including its text.">
        <input
          type="range"
          className={styles.slider}
          aria-label="Overall see-through"
          min={0}
          max={100}
          value={Math.round((1 - (opacity ?? 1)) * 100)}
          onChange={(event) => update("opacity", Number(event.target.value) === 0 ? undefined : 1 - Number(event.target.value) / 100)}
        />
      </FieldShell>
    </Section>
  );
}

const DEVICE_TOGGLES = [
  { id: "desktop", label: "Hide on desktop" },
  { id: "tablet", label: "Hide on tablet" },
  { id: "mobile", label: "Hide on mobile" },
] as const;

function VisibilitySection({ style, update }: SectionProps) {
  const hidden = resolveResponsive(style.hidden);
  const setHidden = (device: (typeof DEVICE_TOGGLES)[number]["id"], value: boolean) => {
    const next = { desktop: !!hidden.desktop, tablet: !!hidden.tablet, mobile: !!hidden.mobile, [device]: value };
    update("hidden", next.desktop || next.tablet || next.mobile ? next : undefined);
  };
  return (
    <Section title="Show or hide">
      {DEVICE_TOGGLES.map(({ id, label }) => (
        <ToggleControl key={id} label={label} checked={!!hidden[id]} onChange={(value) => setHidden(id, value)} />
      ))}
    </Section>
  );
}

function AdvancedSection({ style, update }: SectionProps) {
  return (
    <Section title="Advanced">
      <FieldShell label="Positioning" hint="Most blocks should stay Normal.">
        <ChoiceControl label="Positioning" choices={POSITIONS} value={plain(style.position)} onChange={(next) => update("position", next as Style["position"])} unsetLabel="Default" />
      </FieldShell>
      <FieldShell label="If content is too big">
        <ChoiceControl label="Overflow" choices={OVERFLOWS} value={plain(style.overflow)} onChange={(next) => update("overflow", next as Style["overflow"])} unsetLabel="Default" />
      </FieldShell>
      <FieldShell label="Custom gradient (CSS)" hint="For example: linear-gradient(90deg, red, blue)">
        <input className={styles.text} aria-label="Custom gradient" value={plain(style.gradient) ?? ""} onChange={(event) => update("gradient", event.target.value || undefined)} />
      </FieldShell>
      <FieldShell label="Custom shadow (CSS)" hint="For example: 0 8px 24px rgba(0,0,0,0.2)">
        <input className={styles.text} aria-label="Custom shadow" value={plain(style.shadow) ?? ""} onChange={(event) => update("shadow", event.target.value || undefined)} />
      </FieldShell>
    </Section>
  );
}

interface StyleEditorProps {
  value: Style | undefined;
  onChange: (value: Style) => void;
  layer?: Size | null;
}

export function StyleEditor({ value, onChange, layer = null }: StyleEditorProps) {
  const style = value ?? {};
  const patch = (changes: Style) => {
    const merged: Style = { ...style, ...changes };
    onChange(Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined)) as Style);
  };
  const update: Update = (key, next) => patch({ [key]: next });
  const props = { style, update, patch };

  return (
    <div>
      {layer && <LayerSection {...props} layer={layer} />}
      <SpacingSection {...props} />
      <SizeSection {...props} />
      <TextSection {...props} />
      <BackgroundSection {...props} />
      <BorderSection {...props} />
      <EffectsSection {...props} />
      <VisibilitySection {...props} />
      <AdvancedSection {...props} />
    </div>
  );
}
