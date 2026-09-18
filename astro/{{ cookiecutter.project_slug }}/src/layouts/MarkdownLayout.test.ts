import { describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { ZodError } from "astro/zod";
import MarkdownLayout from "./MarkdownLayout.astro";

describe("MarkdownLayout", () => {
  it("renders the frontmatter title", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(MarkdownLayout, {
      props: { frontmatter: { title: "Astro" } },
    });
    expect(result).toContain("<title>Astro</title>");
  });

  it("throws when the frontmatter doesn't match the schema", async () => {
    const container = await AstroContainer.create();
    await expect(
      container.renderToString(MarkdownLayout, { props: { frontmatter: {} } }),
    ).rejects.toThrow(ZodError);
  });
});
