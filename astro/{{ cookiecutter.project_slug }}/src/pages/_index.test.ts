import { describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Index from "./index.md";

describe("Index", () => {
  it("renders the heading", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Index);
    expect(result).toContain('<h1 id="astro">Astro</h1>');
  });
});
