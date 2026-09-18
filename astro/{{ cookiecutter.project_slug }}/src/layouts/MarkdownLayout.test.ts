import { describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import MarkdownLayout from "./MarkdownLayout.astro";

describe("MarkdownLayout", () => {
  it("renders the frontmatter title", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(MarkdownLayout, {
      props: { frontmatter: { title: "Astro" } },
    });
    expect(result).toContain("<title>Astro</title>");
  });

  it("throws when the frontmatter has no title", async () => {
    const container = await AstroContainer.create();
    await expect(
      container.renderToString(MarkdownLayout, { props: { frontmatter: {} } }),
    ).rejects.toThrow("has no title");
  });
});
