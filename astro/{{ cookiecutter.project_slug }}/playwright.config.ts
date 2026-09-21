import { defineConfig } from "@playwright/test";

// Use non-default port to avoid clashing with dev server
const port = 54321;

export default defineConfig({
  testDir: "tests/e2e",
  reporter: [["html", { open: "never" }]],
  webServer: {
    command: `pnpm run preview --port ${port} --ignore-lock`,
    port,
  },
});
