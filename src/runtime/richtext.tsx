import { Fragment, type ReactNode } from "react";
import { isSafeLinkUrl } from "@/schema/validation";
import { createTemplater, protectTokens, type Templater } from "./variables";

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold" | "italic" | "underline"; children: Inline[] }
  | { kind: "link"; href: string; children: Inline[] }
  | { kind: "br" };

export type Block =
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "list"; items: Inline[][] };

const INLINE = /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push({ kind: "text", text: rest });
      break;
    }
    if (m.index > 0) out.push({ kind: "text", text: rest.slice(0, m.index) });
    if (m[1] !== undefined) out.push({ kind: "bold", children: parseInline(m[1]) });
    else if (m[2] !== undefined) out.push({ kind: "underline", children: parseInline(m[2]) });
    else if (m[3] !== undefined) out.push({ kind: "italic", children: parseInline(m[3]) });
    else if (isSafeLinkUrl(m[5])) out.push({ kind: "link", href: m[5], children: parseInline(m[4]) });
    else out.push({ kind: "text", text: m[4] });
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

export function parseRichText(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: Inline[][] | null = null;

  const flushPara = () => {
    if (!para.length) return;
    const children: Inline[] = [];
    para.forEach((line, i) => {
      if (i > 0) children.push({ kind: "br" });
      children.push(...parseInline(line));
    });
    blocks.push({ kind: "paragraph", children });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: "list", items: list });
    list = null;
  };

  for (const raw of src.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (item && !/^\s*\*\*/.test(line)) {
      flushPara();
      (list ??= []).push(parseInline(item[1]));
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

const PLAIN: Templater = createTemplater({ keepMissing: true });

/** Fills variables after parsing, so a value can only ever be plain text and never adds formatting or links. */
function renderInline(nodes: Inline[], fill: Templater): ReactNode {
  return nodes.map((n, i) => {
    switch (n.kind) {
      case "text":
        return <Fragment key={i}>{fill.text(n.text)}</Fragment>;
      case "br":
        return <br key={i} />;
      case "bold":
        return <strong key={i}>{renderInline(n.children, fill)}</strong>;
      case "italic":
        return <em key={i}>{renderInline(n.children, fill)}</em>;
      case "underline":
        return <u key={i}>{renderInline(n.children, fill)}</u>;
      case "link": {
        const href = fill.url(n.href);
        if (!isSafeLinkUrl(href)) return <Fragment key={i}>{renderInline(n.children, fill)}</Fragment>;
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer">
            {renderInline(n.children, fill)}
          </a>
        );
      }
    }
  });
}

export function renderRichText(src: string, vars: Templater = PLAIN): ReactNode {
  const { masked, restore } = protectTokens(src);
  const fill: Templater = { ...vars, text: (s) => vars.text(restore(s)), url: (s) => vars.url(restore(s)) };
  return parseRichText(masked).map((b, i) =>
    b.kind === "paragraph" ? (
      <p key={i}>{renderInline(b.children, fill)}</p>
    ) : (
      <ul key={i}>
        {b.items.map((item, j) => (
          <li key={j}>{renderInline(item, fill)}</li>
        ))}
      </ul>
    ),
  );
}
