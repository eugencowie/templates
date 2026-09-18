import { expect, test } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Index from "./index.md";

test("index page renders the heading", async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Index);
  expect(result).toContain('<h1 id="astro">Astro</h1>');
});
