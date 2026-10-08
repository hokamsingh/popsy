"use client";
import { memo, useEffect, useId, useMemo, type ReactNode } from "react";
import { Badge, Button, Icon, Image, RichText, Text, Video } from "@/components/content";
import { Countdown } from "@/components/content/Countdown";
import { Container, Divider, Flex, Grid, Layers, Section, Spacer, Stack } from "@/components/layout";
import { Repeater } from "@/components/layout/Repeater";
import { PopupShell, type ShellMode } from "@/components/popup/PopupShell";
import type { Action } from "@/schema/actions";
import { parsePopup, type PopupNode } from "@/schema/popup";
import { createActionRuntime, type ActionRuntimeOptions } from "./actions";
import { RuntimeContext } from "./context";
import { createTemplater, fillAction } from "./variables";

/* eslint-disable @typescript-eslint/no-explicit-any */
const COMPONENT_BY_TYPE: Record<string, (props: any) => ReactNode> = {
  section: Section,
  container: Container,
  stack: Stack,
  layers: Layers,
  repeater: Repeater,
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
  countdown: Countdown,
};

export function renderNode(node: PopupNode): ReactNode {
  const Component = COMPONENT_BY_TYPE[node.type];
  if (!Component) return null;
  return (
    <Component key={node.id} id={node.id} style={node.style} {...node.props}>
      {node.children?.map(renderNode)}
    </Component>
  );
}

export interface PopupRendererProps {
  popup: unknown;
  mode?: ShellMode;
  open?: boolean;
  onDismiss?: () => void;
  actions?: Omit<ActionRuntimeOptions, "onDismiss">;
  editing?: boolean;
  /** Values for the popup's `{{variables}}`, e.g. `{ title: "Summer Sale", user: { firstName: "Asha" } }`. */
  variables?: Record<string, unknown>;
  onInvalid?: (errors: { path: string; message: string }[]) => void;
}

export const PopupRenderer = memo(function PopupRenderer({
  popup,
  mode = "overlay",
  open = true,
  onDismiss,
  actions,
  editing = false,
  variables,
  onInvalid,
}: PopupRendererProps) {
  const parsed = useMemo(() => parsePopup(popup), [popup]);

  const scope = useId();

  const declared = parsed.success ? parsed.data.variables : undefined;
  const vars = useMemo(() => createTemplater({ values: variables, declared }), [variables, declared]);

  const contextValue = useMemo(() => {
    const runtime = createActionRuntime({ ...actions, onDismiss });
    return { run: (action: Action | undefined) => runtime.run(fillAction(action, vars)), perform: runtime.run, editing, scope, vars };
  }, [actions, onDismiss, editing, scope, vars]);

  const content = useMemo(() => (parsed.success ? parsed.data.children.map(renderNode) : null), [parsed]);

  useEffect(() => {
    if (!parsed.success) onInvalid?.(parsed.errors);
  }, [parsed, onInvalid]);

  if (!parsed.success) return null;

  return (
    <RuntimeContext.Provider value={contextValue}>
      <PopupShell settings={parsed.data.settings} mode={mode} open={open} onDismiss={onDismiss}>
        {content}
      </PopupShell>
    </RuntimeContext.Provider>
  );
});
