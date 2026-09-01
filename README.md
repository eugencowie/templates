# Templates

A [mise](https://mise.jdx.dev)-managed, agent-ready starting point for a new project, in any language. Preconfigured for [Matt Pocock's skills](https://github.com/mattpocock/skills), tuned to my preferences so a fresh repo is ready for agentic work.

## Getting started

Create a new project from the template using [cruft](https://cruft.github.io/cruft/) (without installing: `pipx run cruft` or `uvx cruft` or `nix run nixpkgs#cruft --`):

```bash
cruft create https://github.com/eugencowie/templates --directory <template>
```

Append `-c <tag>` to the command to use a specific release (e.g. `-c v1.2.0`). If you omit it, the included GitHub Actions workflow will open a bootstrap PR on first run to adopt the latest release.

For automated updates, enable "Allow GitHub Actions to create and approve pull requests" or add `RENOVATE_TOKEN` to secrets with a personal access token (preferred). [Create a personal access token](https://github.com/settings/personal-access-tokens/new) with read and write access to contents, pull requests, issues, commit statuses and workflows, and set it using:

```bash
gh secret set RENOVATE_TOKEN
```

## Opinionated configuration

`/setup-matt-pocock-skills` normally asks you a series of questions and writes `docs/agents/` from its own defaults; here those answers are already baked in.

Tickets are tracked as local Markdown files in `docs/planning/`. Domain docs sit in `docs/context.md` and `docs/architecture/`. The templates assume a single domain context.

There are two behavioural changes to the skills:

- `/wayfinder` never auto-runs research. Instead, it creates the ticket and leaves it unclaimed, so you can launch it yourself using the agent and model of your choice.
- `/improve-codebase-architecture` serves HTML reports over Tailscale if available, otherwise the report is served locally.

Setup is already done, so don't re-run `/setup-matt-pocock-skills` unless you specifically want to reset those modifications. To adjust anything, edit `docs/agents/*.md` directly.

[mise](https://mise.jdx.dev/getting-started.html) installs everything the project needs. Add your language toolchain to `[tools]` in `mise.toml`, add your build, test and lint commands to `[tasks]`.

[Renovate](https://docs.renovatebot.com) runs on a daily schedule. Enable "Allow GitHub Actions to create and approve pull requests" or add `RENOVATE_TOKEN`. To customise, edit the configuration in `.github/renovate.json5`.

## Maintenance tasks

Update the project to a specifc template version, from inside the project:

```bash
mise run template:update -c <tag>
```

Revert template-managed files that have drifted from the template:

```bash
mise run template:restore
```

## Available templates

### `bare`

For when skills are installed globally (e.g. in `~/.claude/skills` or `~/.codex/skills`) rather than managed by the project.

This keeps the project much simpler: there is nothing to initialise and nothing to copy into new worktrees. `mise.toml` ships only cruft and template maintenance tasks, so add your toolchain and tasks and go.

### `bare-with-skills`

Project-managed skills for Claude Code and Codex, with first-class worktree support.

Initialise the environment with `mise run init`. This installs the required tools ([skills](https://github.com/vercel-labs/skills) via Node.js), installs the configured skills into `.agents/`, copies them into `.claude/`, writes `CLAUDE.md`, and sets up Git hooks for worktree creation.

The `post-checkout` hook bootstraps newly created worktrees automatically using [worktrunk](https://github.com/max-sixty/worktrunk) to copy `init`'s output from the main worktree instead of downloading and installing everything again. Add files to be copied to new worktrees to `.worktreeinclude`.

Skills are restored from `skills-lock.json`, not committed. If you choose to commit them then you must adhere to the terms of the licence they are distributed under. See https://github.com/mattpocock/skills/blob/main/LICENSE for details.

## Licence

The contents of this repository are dedicated to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt). See https://creativecommons.org/publicdomain/zero/1.0/ for details.
