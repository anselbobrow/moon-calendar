import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import eslint from "@nabla/vite-plugin-eslint";

export default defineConfig({
  plugins: [devtools(), solidPlugin(), eslint()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
