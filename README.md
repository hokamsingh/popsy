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

## Scripts

`npm run dev` · `npm run build` · `npm test` · `npm run lint` · `npm run typecheck`

## Status

MVP (spec phases 1–4): layout, content, styling + responsive values, tokens, dismiss/navigate/
external URL/event actions, canonical schema + validation + versioning, Puck adapter, preview.
Not yet built: forms, variables/conditions/repeaters, CustomHTML, templates gallery, server storage
(the editor persists to `localStorage`).
