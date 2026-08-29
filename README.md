# Templates

## Usage

Create a new project from the template:

```bash
nix run nixpkgs#cruft -- create https://github.com/eugencowie/templates --directory <template>
```

Update the project to the latest template version:

```bash
nix run nixpkgs#cruft -- update
```

# Old README

A [mise](https://mise.jdx.dev)-managed, agent-ready starting point for a new project, in any language. Preconfigured for [Matt Pocock's skills](https://github.com/mattpocock/skills), tuned to my preferences so a fresh repo is ready for agentic work. Works with Claude Code and Codex with first-class worktree support.

## Prerequisites

[mise](https://mise.jdx.dev/getting-started.html). Nothing else - it installs everything the template needs.

## Getting started

Create a repo from this template with the **Use this template** button on GitHub, or from the terminal:

```bash
gh repo create <name> --template eugencowie/template
```

Then clone it and initialise the environment:

```bash
mise trust
mise run init
```

Add your language toolchain to `[tools]` in `mise.toml`, add your build, test and lint commands to `[tasks]`, and add files to be copied to new worktrees to `.worktreeinclude`.

## How it fits together

`init` installs the required tools ([skills](https://github.com/vercel-labs/skills) via Node.js), installs the configured skills into `.agents/`, copies them into `.claude/`, writes `CLAUDE.md`, and sets up Git hooks for worktree creation.

The `post-checkout` hook bootstraps newly created worktrees automatically using [worktrunk](https://github.com/max-sixty/worktrunk) to copy `init`'s output from the main worktree instead of downloading and installing everything again.

## Opinionated configuration

`/setup-matt-pocock-skills` normally asks you a series of questions and writes `docs/agents/` from its own defaults; here those answers are already baked in.

Tickets are tracked as local Markdown files in `docs/planning/`. Domain docs sit in `docs/context.md` and `docs/architecture/`. The template assumes a single domain context.

There is one behavioural change: `/wayfinder` never auto-runs research. Instead, it creates the ticket and leaves it unclaimed, so you can launch it yourself using the agent and model of your choice.

Setup is already done, so don't re-run `/setup-matt-pocock-skills` unless you specifically want to reset those modifications. To adjust anything, edit `docs/agents/*.md` directly.

## Licence

The contents of this repository are dedicated to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt). See https://creativecommons.org/publicdomain/zero/1.0/ for details.

No skills are committed by default, if you choose to commit them then you must adhere to the terms of the license they are distributed under. See https://github.com/mattpocock/skills/blob/main/LICENSE for details.
