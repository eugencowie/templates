import { describe, expect, it } from "./playwright";

describe("Index", () => {
  it("has the correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Astro");
  });
});
