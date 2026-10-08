"use client";
import { useMemo, type ReactNode } from "react";
import { Frame, nodeClass, type NodeBaseProps } from "../frame";
import { mapResponsive, type Responsive } from "@/design-system/responsive";
import { buildCss } from "@/design-system/styles";
import { RuntimeContext, useRuntime, type RuntimeContextValue } from "@/runtime/context";
import { fillAction } from "@/runtime/variables";

type Css = Responsive<string>;

const tracks = (v: string) => (/^\d+$/.test(v.trim()) ? `repeat(${v.trim()}, minmax(0, 1fr))` : v);

export interface RepeaterProps extends NodeBaseProps {
  source?: string;
  columns?: Responsive<string>;
  gap?: Css;
  limit?: number;
  emptyText?: string;
  /** Editor only: renders the template for the copies after the first, which the editor can't edit in place. */
  renderCopy?: () => ReactNode;
}

/** Gives one copy its own `{{item.*}}` and `{{index}}`, for text and for the actions its buttons run. */
function useItemContext(parent: RuntimeContextValue, item: unknown, index: number): RuntimeContextValue {
  return useMemo(() => {
    const vars = parent.vars.scope({ item, index: index + 1 });
    return { ...parent, vars, run: (action) => parent.perform(fillAction(action, vars)) };
  }, [parent, item, index]);
}

function RepeaterItem({ item, index, className, children }: { item: unknown; index: number; className: string; children: ReactNode }) {
  const value = useItemContext(useRuntime(), item, index);
  return (
    <RuntimeContext.Provider value={value}>
      <div className={className} role="listitem">
        {children}
      </div>
    </RuntimeContext.Provider>
  );
}

/** Repeats its contents once for each item in a list variable. */
export function Repeater({ source = "items", columns, gap = "16px", limit, emptyText, renderCopy, children, slot, ...p }: RepeaterProps) {
  const runtime = useRuntime();
  const items = runtime.vars.list(source).slice(0, limit ?? undefined);
  const cls = nodeClass(p.id, runtime.scope);
  const itemCls = `${cls}-item`;
  const layout = { display: "grid", "grid-template-columns": mapResponsive(columns, tracks), gap, "box-sizing": "border-box", width: "100%" };
  const itemCss = buildCss(`.${itemCls}`, { display: "grid", gap, "min-width": "0", "align-content": "start" });

  if (slot) {
    // Editing: the first copy is the editable template; the rest are previews of it with their own item.
    return (
      <>
        <style>{itemCss}</style>
        <Frame {...p} kind="repeater" attrs={{ role: "list" }} cssProps={layout}>
          <RepeaterItem item={items[0] ?? {}} index={0} className={itemCls}>
            {slot({ minEmptyHeight: 80 })}
          </RepeaterItem>
          {items.slice(1).map((item, i) => (
            <RepeaterItem key={i + 1} item={item} index={i + 1} className={itemCls}>
              <div aria-hidden style={{ display: "contents", pointerEvents: "none" }}>
                {renderCopy?.()}
              </div>
            </RepeaterItem>
          ))}
        </Frame>
      </>
    );
  }

  if (!items.length) {
    return emptyText ? (
      <Frame {...p} kind="repeater" cssProps={{ width: "100%" }}>
        {runtime.vars.text(emptyText)}
      </Frame>
    ) : null;
  }

  return (
    <>
      <style>{itemCss}</style>
      <Frame {...p} kind="repeater" attrs={{ role: "list" }} cssProps={layout}>
        {items.map((item, i) => (
          <RepeaterItem key={i} item={item} index={i} className={itemCls}>
            {children}
          </RepeaterItem>
        ))}
      </Frame>
    </>
  );
}
