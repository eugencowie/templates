# Agent Instructions

## Agent skills

### Issue tracker

Tickets live as local Markdown files in `docs/planning/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `docs/context.md` and ADRs in `docs/architecture/`. See `docs/agents/domain.md`.

## Development environment

This project uses mise to manage the development environment.

- Run `mise tasks` to see the available tasks.
- Use `mise run <task>` for standard operations.
- Run `mise ls -l` to see the managed tools.
- When invoking a managed tool directly, use `mise exec -- <command> [args]` rather than invoking the tool by its bare name.

Node.js is managed by pnpm. To invoke it, use `mise run node [args]`.

When starting the dev server, use background mode:

```
mise run astro dev --background
```

Manage the background server with `mise run astro dev stop`, `mise run astro dev status`, and `mise run astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
