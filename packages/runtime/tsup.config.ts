import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "../../src/runtime/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    target: "es2020",
    tsconfig: "./tsconfig.json",
    minify: true,
    // React comes from the host app. Validation (zod/mini, tree-shaken) and the icons are bundled,
    // so hosts install nothing else.
    external: ["react", "react-dom", "react/jsx-runtime"],
    noExternal: ["zod", "lucide-react"],
    // Marks the bundle as a client module for the Next.js App Router.
    banner: { js: '"use client";' },
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
  {
    entry: { fonts: "fonts.css" },
    loader: { ".woff2": "file", ".woff": "file" },
  },
]);
