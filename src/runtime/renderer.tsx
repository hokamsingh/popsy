"use client";
import { useEffect, useMemo, type ReactNode } from "react";
import { Badge, Button, Icon, Image, RichText, Text, Video } from "@/components/content";
import { Container, Divider, Flex, Grid, Section, Spacer, Stack } from "@/components/layout";
import { PopupShell, type ShellMode } from "@/components/popup/PopupShell";
import type { Popup, PopupNode } from "@/schema/popup";
import { parsePopup } from "@/schema/popup";
import { createActionRuntime, type ActionRuntimeOptions } from "./actions";
import { RuntimeContext } from "./context";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const RENDERERS: Record<string, (props: any) => ReactNode> = {
  section: Section,
  container: Container,
  stack: Stack,
  flex: Flex,
  grid: Grid,
  spacer: Spacer,
  divider: Divider,
  text: Text,
  richtext: RichText,
  image: Image,
  video: Video,
  icon: Icon,
  button: Button,
  badge: Badge,
};

export function renderNode(node: PopupNode): ReactNode {
  const Component = RENDERERS[node.type];
  if (!Component) return null;
  return (
    <Component key={node.id} id={node.id} style={node.style} {...node.props}>
      {node.children?.map(renderNode)}
    </Component>
  );
}

export interface PopupRendererProps {
  /** A canonical popup. Validated on every render; invalid documents render nothing. */
  popup: Popup | unknown;
  mode?: ShellMode;
  open?: boolean;
  onDismiss?: () => void;
  /** Host-provided action implementations (domain actions, navigation, ...). */
  actions?: Omit<ActionRuntimeOptions, "onDismiss">;
  /** Disables action execution, e.g. for static previews. */
  editing?: boolean;
  onInvalid?: (errors: { path: string; message: string }[]) => void;
}

export function PopupRenderer({
  popup,
  mode = "overlay",
  open = true,
  onDismiss,
  actions,
  editing = false,
  onInvalid,
}: PopupRendererProps) {
  const parsed = useMemo(() => parsePopup(popup), [popup]);
  const runtime = useMemo(
    () => createActionRuntime({ ...actions, onDismiss }),
    [actions, onDismiss],
  );
  const ctx = useMemo(
    () => ({ run: (a: Parameters<typeof runtime.run>[0]) => void runtime.run(a), editing }),
    [runtime, editing],
  );

  useEffect(() => {
    if (!parsed.success) onInvalid?.(parsed.errors);
  }, [parsed, onInvalid]);

  if (!parsed.success) return null;
  const { settings, children } = parsed.data;
  return (
    <RuntimeContext.Provider value={ctx}>
      <PopupShell settings={settings} mode={mode} open={open} onDismiss={onDismiss}>
        {children.map(renderNode)}
      </PopupShell>
    </RuntimeContext.Provider>
  );
}
