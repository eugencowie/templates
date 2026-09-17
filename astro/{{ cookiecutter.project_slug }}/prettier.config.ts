import type { Config } from "prettier";

const defineConfig = (config: Config): Config => config;

export default defineConfig({
  plugins: ["prettier-plugin-astro"],
});
