# Map: Renovate-driven template updates

Label: wayfinder:map

## Destination

Both template outputs (`bare` and `bare-with-skills`) ship a Renovate config and a self-hosted Renovate CI workflow, pre-configured to track the generated `.cruft.json` and run `mise run template:update` as part of the template update PR. Implemented in this repo (execution is in scope, per Notes), with this repo itself picking the files up via its own `.cruft.json` self-tracking.

## Notes

- Execution override: this effort carries implementation into the map. The final tickets make the change in place, not just decide it.
- Settled in the charting session (no tickets behind these):
  - Self-hosted Renovate via a scheduled GitHub Actions workflow (`renovatebot/github-action`), not the hosted Mend app. Rationale: least hassle for consumers — create project, push, it works.
  - Token: default `GITHUB_TOKEN` out of the box; prefer a `RENOVATE_TOKEN` secret when present, with the upgrade path documented in the README. Known limitation: `GITHUB_TOKEN`-created PRs don't trigger other workflows.
  - Schedule: daily cron + `workflow_dispatch`.
  - Conflict behaviour: when `cruft update` can't apply cleanly, commit the `.rej` files so the PR shows the conflicts for human resolution.
  - Workflow scope: the Renovate runner only; no PR-triggered `cruft check` or other CI.
  - Template bump gets its own PR, not grouped with mise/actions dependency updates. Config file is `renovate.json5` at the repo root.
  - GitHub-only; no forge abstraction.
- Skills for sessions working this map: grilling + domain-modeling for the decision ticket; research tickets are created but never auto-run (tracker override — the user launches them).

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- Ticket 01: Track `main` with `git-refs`, treating both Cruft SHAs as digests and grouping them in a template-only PR. Because replacing the SHAs before running Cruft makes `cruft update` exit early, the workflow must preserve the old state or use a separate trigger. Superseded by the design ticket: tracking switched from `main` digests to release tags; the regex-manager mechanics carry over. [Research and validated configuration](research/01-cruft-json-custom-manager.md)
- Ticket 02: Run the update inside the Renovate container with `binarySource=install` and `installTools` for Mise and uv. Restore `.cruft.json` from `HEAD` before running the task, allow-list both commands globally, collect all non-ignored changes including `.rej` files, and use a workflow-capable `RENOVATE_TOKEN` when template updates can touch `.github/workflows/`. [Research and configuration](research/02-run-template-update-in-pr.md)
- Ticket 03: Renovate scans nested mise and workflow template files, but this repository's root `.cruft.json` must be disabled because tracking its own moving `main` tip creates a perpetual digest chase. The chase (and its exclusion rule) was mooted by the design ticket's switch to tag tracking. [Research and local reproductions](research/03-renovate-on-templates-repo.md)
- [Port to bare-with-skills, self-apply, document](tickets/06-port-and-self-apply.md): config and workflow ported to `bare-with-skills` and the repo root, README updated (checkout-pinned create command, "Automated updates" section). The root `.cruft.json` already recorded `checkout: v1.1.0` from before this effort; the release ticket must reconcile the tag name with it.
- [Implement Renovate config + workflow in the bare template](tickets/05-implement-in-bare-template.md): shipped `renovate.json5` and `.github/workflows/renovate.yml` in `bare`, validated with `renovate-config-validator`, dry runs (including the null bootstrap against a tagged stand-in repo), and a cookiecutter generation check; both files need `_copy_without_render` in `cookiecutter.json` to survive Jinja.
- [Decide the final Renovate + workflow design](tickets/04-decide-workflow-design.md): track `v`-prefixed release tags in `.cruft.json`'s `checkout` field (`github-tags` datasource, `null` bootstraps as `0.0.0`), run `mise run template:update -- -y --checkout <tag>` via `postUpgradeTasks` after restoring `.cruft.json` (strict mode, downgrades accepted), admin config as `RENOVATE_*` env vars in the workflow, lock-file maintenance on, docs in the templates README only. No self-tracking exclusion needed. Releases are manual tags starting at `v1.0.0`.

## Not yet specified

<!-- empty: the way to the destination is clear; only implementation tickets remain -->

## Out of scope

- Tracking `skills-lock.json` (bare-with-skills): Renovate has no manager for the skills CLI lockfile; ruled out during charting.
- Drift-check CI (`cruft check` on PRs): a separate concern consumers can add themselves.
- Non-GitHub forges.
- GitHub Releases with notes and release automation (e.g. release-please): only tags feed the datasource, so these can bolt on later without breakage.
