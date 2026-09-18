import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

type PrettierConfig = Config & PluginOptions;
const defineConfig = (config: PrettierConfig): PrettierConfig => config;

export default defineConfig({
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  tailwindStylesheet: "src/styles/global.css",
});
