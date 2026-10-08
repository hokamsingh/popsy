# Popsy

A generic no-code popup builder built on **Next.js + Puck**. Popups are compositions of
layout, content, style and action primitives — never business-specific components.

## Architecture

```
Puck editor ⇄ editor adapter ⇄ canonical popup JSON (versioned, validated) → runtime renderer
```

| Path | Responsibility |
| --- | --- |
| `src/schema` | Canonical Zod schema, component registry, actions, migrations, URL/CSS validators |
| `src/design-system` | Shared style model, tokens, responsive breakpoints, CSS generation |
| `src/components` | Layout and content primitives, `PopupShell` (dialog a11y, overlay, animation) |
| `src/runtime` | Renderer, action registry, safe rich-text parser |
| `src/editor` | Puck config, custom fields, and the adapter (the only code that knows Puck's shape) |
| `src/templates` | Benchmark popups (generic-primitive compositions used as fixtures) |

Domain behavior is registered by the host app, not the builder:

```tsx
<PopupRenderer popup={popup} actions={{ handlers: { claim_bonus: () => api.claim() } }} />
```

## Variables

Write `{{name}}` in any text, button label, badge, image/video link, link action, event payload or
the popup title. Use `{{name|fallback}}` for a per-use fallback and dotted names
(`{{user.firstName}}`) to reach nested values. The host page supplies values:

```tsx
<PopupRenderer popup={popup} variables={{ title: "Summer Sale", user: { firstName: "Asha" } }} />
```

A value is chosen in this order: the host's value → the inline fallback → the default declared in the
popup's **Variables** list (editor → popup settings) → blank. Values are always plain text: in rich
text they are filled in after formatting is parsed, inside URLs they are URL-encoded (unless the whole
URL is one variable), and every URL is safety-checked again after filling.

## Scripts

`npm run dev` · `npm run build` · `npm test` · `npm run lint` · `npm run typecheck`

## Status

MVP (spec phases 1–4): layout, content, styling + responsive values, tokens, dismiss/navigate/
external URL/event actions, canonical schema + validation + versioning, Puck adapter, preview.
Variables (`{{name}}`) are supported. Not yet built: forms, conditions/repeaters, CustomHTML, templates gallery, server storage
(the editor persists to `localStorage`).
