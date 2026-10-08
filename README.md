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

## Lists and the Repeater

A variable can be a **List**: give it sample items (JSON) in the editor, and the host sends the
real list the same way as any other variable. A **Repeater** block repeats its contents once per
item; inside it, `{{item.title}}` reads the current item and `{{index}}` is its position (1, 2, 3…).
Anywhere else, `{{items.0.title}}` picks one item. Popsy never knows what the items are.

## App actions that wait for an answer

"Tell your app" sends a named action with data (values can use variables, e.g. `{ "id": "{{item.id}}" }`
inside a repeater). The host handles it, and may take as long as it needs:

```tsx
<PopupRenderer
  popup={popup}
  variables={{ items: offers }}
  actions={{ handlers: {
    avail: async ({ id }) => openCheckout(id),   // resolve: success; reject/throw: failure; return false: backed out
  } }}
/>
```

While the promise is pending the button shows a spinner and is disabled. The designer chooses what
happens next: close the popup or keep it open, and the messages shown on success or failure.

Tick **Close this popup first** on a button when your app opens its own page or popup (a checkout,
say): the popup closes immediately, then your handler runs, so two popups never stack. The button shows
no progress in that case.

Optionally, list the actions your app handles so designers pick from a menu instead of typing:
`NEXT_PUBLIC_POPSY_APP_ACTIONS='[{"name":"avail","label":"Avail offer","fields":["id"]}]'`.

## Scripts

`npm run dev` · `npm run build` · `npm test` · `npm run lint` · `npm run typecheck`

## Status

MVP (spec phases 1–4): layout, content, styling + responsive values, tokens, dismiss/navigate/
external URL/event actions, canonical schema + validation + versioning, Puck adapter, preview.
Variables (`{{name}}`) are supported. Not yet built: forms, conditions/repeaters, CustomHTML, templates gallery, server storage
(the editor persists to `localStorage`).
