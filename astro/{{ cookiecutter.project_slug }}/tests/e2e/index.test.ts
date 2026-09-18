import { test, expect } from "@playwright/test";

const describe = test.describe;
const it = test;

describe("index page", () => {
  it("has the correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Astro");
  });
});
