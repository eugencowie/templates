import { expect, test } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Layout from "./Layout.astro";

test("layout renders the title", async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Layout);
  expect(result).toContain("<title>Astro</title>");
});
