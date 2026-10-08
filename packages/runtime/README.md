# @popsy-render/runtime

Renders Popsy popups (the JSON the Popsy editor exports) in any React 18 or 19 app, including the
Next.js App Router. The editor is not included. About 31 KB gzipped in total, with no dependencies
besides React: validation (slim `zod/mini`) and icons are bundled in.

```bash
npm i @popsy-render/runtime   # peer deps: react, react-dom (18.2+ or 19)
```

```tsx
// app/layout.tsx: load the fonts the editor offers (optional, once)
import "@popsy-render/runtime/fonts.css";

// any page or component; the package is already a client module, so server pages can import it
import { PopupRenderer, parsePopup } from "@popsy-render/runtime";

<PopupRenderer
  popup={popupJson}                              // from your backend
  variables={{ user: { firstName: "Asha" }, items: offers }}
  actions={{ handlers: {
    avail: async ({ id }) => openCheckout(id),   // resolve = success, throw = failure, return false = backed out
  } }}
  onDismiss={() => setOpen(false)}
/>
```

- **Validate on upload:** `parsePopup(json)` returns `{ success, data }` or `{ success: false, errors }`
  with paths and messages. Older popup versions are upgraded automatically.
- **Variables:** `{{name}}`, `{{name|fallback}}`, `{{user.firstName}}`, `{{items.0.title}}`; lists feed
  Repeater blocks, where `{{item.*}}` and `{{index}}` refer to the current item.
- **Actions:** `dismiss`, `navigate`, `external_url` and named app actions (`handlers`). App actions can
  return a promise; the button shows a spinner meanwhile and then does what the designer chose.
- **Modes:** `mode="overlay"` (default; a modal dialog with focus trap) or `mode="inline"`.

## Build and check

```bash
npm run build:runtime              # from the repo root; outputs packages/runtime/dist
cd packages/runtime && npm pack    # a tarball any app can install
```

`test/consumer-check.mjs` server-renders every example and clicks through the multi-offer popup in a
DOM. Run it from a scratch project that installed the tarball, `react`, `react-dom` and `jsdom`:
`node consumer-check.mjs fixtures.json`.

## Publishing

The `@popsy-render` npm scope is unclaimed. To publish:

1. On npmjs.com, create the organization `popsy-render` (free for public packages; private packages need a paid org).
2. `npm run build:runtime`, then from `packages/runtime`: `npm publish --access public`
   (or `--access restricted` for a private package).
