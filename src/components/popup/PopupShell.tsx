"use client";
import { useEffect, useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { tokensToCssVars, resolveTokens } from "@/design-system/tokens";
import type { PopupSettings } from "@/schema/popup";

type Position = PopupSettings["position"];

export type ShellMode = "overlay" | "inline";

export interface PopupShellProps {
  settings: PopupSettings;
  mode?: ShellMode;
  open?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
}

const PLACEMENT: Record<Position, { justify: string; align: string }> = {
  center: { justify: "center", align: "center" },
  top: { justify: "center", align: "flex-start" },
  bottom: { justify: "center", align: "flex-end" },
  left: { justify: "flex-start", align: "center" },
  right: { justify: "flex-end", align: "center" },
  "top-left": { justify: "flex-start", align: "flex-start" },
  "top-right": { justify: "flex-end", align: "flex-start" },
  "bottom-left": { justify: "flex-start", align: "flex-end" },
  "bottom-right": { justify: "flex-end", align: "flex-end" },
};

const SHELL_CSS = `
@keyframes pp-fade{from{opacity:0}to{opacity:1}}
@keyframes pp-scale{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes pp-slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes pp-slide-down{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:none}}
.pp-anim-fade{animation:pp-fade .2s ease-out both}
.pp-anim-scale{animation:pp-scale .2s ease-out both}
.pp-anim-slide-up{animation:pp-slide-up .25s ease-out both}
.pp-anim-slide-down{animation:pp-slide-down .25s ease-out both}
.pp-shell-close{position:absolute;top:8px;right:8px;z-index:2;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border:0;border-radius:9999px;background:rgba(15,23,42,.08);color:#0f172a;cursor:pointer}
.pp-shell-close:hover{background:rgba(15,23,42,.16)}
.pp-shell-close:focus-visible,[data-pp-dialog] :focus-visible{outline:2px solid var(--pp-color-primary);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.pp-anim-fade,.pp-anim-scale,.pp-anim-slide-up,.pp-anim-slide-down{animation:none}}
`;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),video[controls],[tabindex]:not([tabindex="-1"])';

export function PopupShell({ settings: s, mode = "overlay", open = true, onDismiss, children }: PopupShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const overlayMode = mode === "overlay";

  useEffect(() => {
    if (!overlayMode || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    (dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog)?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    if (s.lockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [overlayMode, open, s.lockScroll]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!overlayMode) return;
    if (e.key === "Escape" && s.closeOnEscape) {
      e.stopPropagation();
      onDismiss?.();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
      (el) => !el.closest("[hidden]"),
    );
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const place = PLACEMENT[s.position];
  const tokenVars = tokensToCssVars(s.tokens) as CSSProperties;

  const dialogStyle: CSSProperties = {
    position: "relative",
    boxSizing: "border-box",
    width: resolveTokens(s.width),
    maxWidth: resolveTokens(s.maxWidth),
    height: resolveTokens(s.height),
    maxHeight: resolveTokens(s.maxHeight),
    overflow: "auto",
    background: resolveTokens(s.background),
    borderRadius: resolveTokens(s.radius),
    boxShadow: resolveTokens(s.shadow),
    color: "var(--pp-color-text)",
    fontFamily: "var(--pp-font-body)",
    outline: "none",
    margin: overlayMode ? undefined : "0 auto",
  };

  const dialog = (
    <div
      ref={dialogRef}
      role={overlayMode ? "dialog" : undefined}
      aria-modal={overlayMode && s.overlay ? true : undefined}
      aria-labelledby={overlayMode ? titleId : undefined}
      tabIndex={-1}
      data-pp-dialog=""
      className={overlayMode && s.animation !== "none" ? `pp-anim-${s.animation}` : undefined}
      style={dialogStyle}
    >
      <span id={titleId} hidden>
        {s.title}
      </span>
      {s.showCloseButton ? (
        <button type="button" className="pp-shell-close" aria-label="Close" onClick={() => onDismiss?.()}>
          <X size={18} aria-hidden />
        </button>
      ) : null}
      {children}
    </div>
  );

  if (!overlayMode) {
    return (
      <div data-pp-root="" style={{ ...tokenVars, padding: 16, boxSizing: "border-box" }}>
        <style>{SHELL_CSS}</style>
        {dialog}
      </div>
    );
  }

  return (
    <div
      data-pp-root=""
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && s.closeOnOverlayClick) onDismiss?.();
      }}
      style={{
        ...tokenVars,
        position: "fixed",
        inset: 0,
        zIndex: s.zIndex,
        display: "flex",
        justifyContent: place.justify,
        alignItems: place.align,
        padding: 16,
        boxSizing: "border-box",
        background: s.overlay ? resolveTokens(s.overlayColor) : "transparent",
        backdropFilter: s.overlay ? s.overlayBlur : undefined,
        WebkitBackdropFilter: s.overlay ? s.overlayBlur : undefined,
        pointerEvents: s.overlay ? "auto" : "none",
      }}
    >
      <style>{SHELL_CSS}</style>
      <div style={{ pointerEvents: "auto", display: "contents" }}>{dialog}</div>
    </div>
  );
}
