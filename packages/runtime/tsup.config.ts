import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "../../src/runtime/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2020",
    tsconfig: "./tsconfig.json",
    minify: true,
    // React comes from the host app and zod is a regular dependency it can share; the icons are bundled.
    external: ["react", "react-dom", "react/jsx-runtime", "zod"],
    noExternal: ["lucide-react"],
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
