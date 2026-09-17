import { test, expect } from "@playwright/test";

test("index page has the correct title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Astro");
});
