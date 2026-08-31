# Research: running mise run template:update inside the Renovate PR

Type: research
Status: resolved

## Question

Can self-hosted Renovate (`renovatebot/github-action`) run `mise run template:update` as part of the update PR via `postUpgradeTasks`, and what does it take?

Specifics to pin down:

- The execution environment of `postUpgradeTasks` under `renovatebot/github-action`: does the command run inside the Renovate Docker image, and can mise + cruft (pipx) be made available there (`binarySource=install`, tool presets, custom image, or running Renovate as a CLI on the runner instead)?
- Required self-hosted config: `allowedCommands`/`allowedPostUpgradeCommands`, `postUpgradeTasks.commands`/`fileFilters`/`executionMode`, and any security caveats.
- Token behaviour: how the action consumes `GITHUB_TOKEN` vs a `RENOVATE_TOKEN` secret, and whether `GITHUB_TOKEN` can push commits touching `.github/workflows/` files in the PR branch (workflow-file permission restriction). If not, what the least-hassle mitigation is.
- Whether `cruft update`'s interactive prompt can be suppressed (`-y`) and how `.rej` conflict files survive into the committed PR (map decision: commit them).

Record findings per the research skill (Markdown in the repo, `research/` branch), and link them here.

## Answer

Yes. The action runs the commands inside Renovate's container. The default image can install Mise and uv at runtime, then Mise can install Cruft from this repository's tool configuration. The post-upgrade task must first restore `.cruft.json` from `HEAD`, because Renovate writes the new digest before invoking the task and Cruft needs the old digest as its baseline. Exact global command allow-lists, a template-only branch, `fileFilters: ["**/*"]`, and `executionMode: "branch"` complete the setup.

`GITHUB_TOKEN` cannot push changes under `.github/workflows/`; the low-friction upgrade is an optional `RENOVATE_TOKEN` with workflow write permission and a fallback to `github.token`. Cruft's `-y` flag suppresses its prompt, and Renovate commits non-ignored `.rej` files selected by the file filter.

[Full research and configuration](../research/02-run-template-update-in-pr.md)
