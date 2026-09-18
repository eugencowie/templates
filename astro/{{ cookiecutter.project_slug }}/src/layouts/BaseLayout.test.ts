import { describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import BaseLayout from "./BaseLayout.astro";

describe("BaseLayout", () => {
  it("renders the title", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(BaseLayout, {
      props: { title: "Astro" },
    });
    expect(result).toContain("<title>Astro</title>");
  });
});
