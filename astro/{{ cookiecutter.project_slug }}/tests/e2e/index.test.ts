import { describe, expect, it } from "./playwright";

describe("index page", () => {
  it("has the correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Astro");
  });
});
