import { getViteConfig as defineConfig } from "astro/config";
import { configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
});
