import { expect, test } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import MarkdownLayout from "./MarkdownLayout.astro";

test("layout renders the title", async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(MarkdownLayout, {
    props: { frontmatter: { title: "Astro" } },
  });
  expect(result).toContain("<title>Astro</title>");
});
