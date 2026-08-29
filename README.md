# Templates

A [mise](https://mise.jdx.dev)-managed, agent-ready starting point for a new project, in any language. Preconfigured for [Matt Pocock's skills](https://github.com/mattpocock/skills), tuned to my preferences so a fresh repo is ready for agentic work.

## Getting started

Create a new project from the template:

```bash
cruft create https://github.com/eugencowie/templates --directory <template>
```

Update the project to the latest template version, from inside the project:

```bash
cruft update
```

If you don't have [cruft](https://cruft.github.io/cruft/) installed, you can run it with `nix run nixpkgs#cruft --`, `pipx run cruft` or `uvx cruft`.

## Opinionated configuration

`/setup-matt-pocock-skills` normally asks you a series of questions and writes `docs/agents/` from its own defaults; here those answers are already baked in.

Tickets are tracked as local Markdown files in `docs/planning/`. Domain docs sit in `docs/context.md` and `docs/architecture/`. The template assumes a single domain context.

There is one behavioural change: `/wayfinder` never auto-runs research. Instead, it creates the ticket and leaves it unclaimed, so you can launch it yourself using the agent and model of your choice.

Setup is already done, so don't re-run `/setup-matt-pocock-skills` unless you specifically want to reset those modifications. To adjust anything, edit `docs/agents/*.md` directly.

[mise](https://mise.jdx.dev/getting-started.html) installs everything the project needs. Add your language toolchain to `[tools]` in `mise.toml`, add your build, test and lint commands to `[tasks]`.

## Templates

### `bare`

For when the skills are installed globally (e.g. in `~/.claude/skills` or `~/.codex/skills`) rather than managed by the project. This keeps the project much simpler: there is nothing to install and nothing to copy into new worktrees. The template ships `AGENTS.md`, a `CLAUDE.md` that points at it, and `docs/agents/`.

There is no setup step. `mise.toml` starts empty, so add your toolchain and tasks and go; mise will ask you to trust the config when it first needs to.

### `worktrunk`

Works with Claude Code and Codex with first-class worktree support.

Initialise the environment:

```bash
mise trust
mise run init
```

`init` installs the required tools ([skills](https://github.com/vercel-labs/skills) via Node.js), installs the configured skills into `.agents/`, copies them into `.claude/`, writes `CLAUDE.md`, and sets up Git hooks for worktree creation.

The `post-checkout` hook bootstraps newly created worktrees automatically using [worktrunk](https://github.com/max-sixty/worktrunk) to copy `init`'s output from the main worktree instead of downloading and installing everything again. Add files to be copied to new worktrees to `.worktreeinclude`.

No skills are committed by default, if you choose to commit them then you must adhere to the terms of the license they are distributed under. See https://github.com/mattpocock/skills/blob/main/LICENSE for details.

## Licence

The contents of this repository are dedicated to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.txt). See https://creativecommons.org/publicdomain/zero/1.0/ for details.
