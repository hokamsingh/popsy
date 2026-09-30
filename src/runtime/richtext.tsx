import { Fragment, type ReactNode } from "react";
import { isSafeLinkUrl } from "@/schema/validation";

/**
 * Safe rich text. The source is a tiny markup language that is parsed into React
 * elements, so no HTML string is ever injected into the DOM.
 *
 *   **bold**  *italic*  __underline__  [label](https://url)
 *   lines starting with "- " form a list; blank lines separate paragraphs.
 */

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
    else out.push({ kind: "text", text: m[4] }); // unsafe link degrades to plain text
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

function renderInline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.kind) {
      case "text":
        return <Fragment key={i}>{n.text}</Fragment>;
      case "br":
        return <br key={i} />;
      case "bold":
        return <strong key={i}>{renderInline(n.children)}</strong>;
      case "italic":
        return <em key={i}>{renderInline(n.children)}</em>;
      case "underline":
        return <u key={i}>{renderInline(n.children)}</u>;
      case "link":
        return (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer">
            {renderInline(n.children)}
          </a>
        );
    }
  });
}

export function renderRichText(src: string): ReactNode {
  return parseRichText(src).map((b, i) =>
    b.kind === "paragraph" ? (
      <p key={i}>{renderInline(b.children)}</p>
    ) : (
      <ul key={i}>
        {b.items.map((item, j) => (
          <li key={j}>{renderInline(item)}</li>
        ))}
      </ul>
    ),
  );
}
