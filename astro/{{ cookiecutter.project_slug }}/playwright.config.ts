import { defineConfig } from "@playwright/test";

// Use non-default port to avoid clashing with dev server
const port = 54321;

export default defineConfig({
  testDir: "tests/e2e",
  reporter: [["html", { open: "never" }]],
  webServer: {
    command: `pnpm run build && pnpm run preview --port ${port} --ignore-lock`,
    // Disable running in background to avoid exiting before the preview server is ready
    env: { ASTRO_PREVIEW_BACKGROUND: "1" },
    port,
  },
});
