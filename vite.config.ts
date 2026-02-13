import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig(({ command }) => {
  if (command === "build") {
    return {
      plugins: [react(), dts({ tsconfigPath: "./tsconfig.build.json" })],
      build: {
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "InfiniteSlider",
          fileName: "infinite-slider",
          formats: ["es", "cjs"],
        },
        rollupOptions: {
          external: ["react", "react-dom", "react/jsx-runtime"],
        },
      },
    };
  }

  // dev mode — serve demo
  return {
    plugins: [react()],
    root: "demo",
  };
});
