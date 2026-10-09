import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "emit-brand-logo",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "logo.jpeg",
          source: readFileSync(new URL("./src/assests/logo.jpeg", import.meta.url)),
        });
      },
    },
  ],
  assetsInclude: ["**/*.PNG"],
  server: {
    port: 5173,
  },
});
