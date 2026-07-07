import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "api/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  platform: "node",
  target: "node20",
  outDir: "dist",
  splitting: false,
});
