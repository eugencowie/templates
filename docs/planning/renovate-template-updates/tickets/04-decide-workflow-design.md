# Decide the final Renovate + workflow design

Type: grilling
Status: resolved
Blocked by: 01, 02, 03

## Question

With the research in, settle the concrete design: the `renovate.json5` contents (custom manager, packageRules, self-hosted options), the workflow file (action version, schedule, token wiring with `RENOVATE_TOKEN` fallback to `GITHUB_TOKEN`), and how `mise run template:update` runs in the PR (postUpgradeTasks vs the companion-workflow fallback from the map's fog). Also settle any exclusions needed for this repo's self-hosting layout (ticket 03) and how `.rej` conflicts surface in the PR.

Resolve with the user (grilling + domain-modeling); the answer is the spec the implementation tickets execute.

## Answer

**Tracking model — tags, not `main`.** The biggest change from the research baseline: consumers (and this repo) follow tagged releases, not the branch tip. The custom manager tracks `.cruft.json`'s `checkout` field with the `github-tags` datasource and semver versioning; the template repo cuts manual, `v`-prefixed semver tags (`git tag vX.Y.Z && git push origin <tag>`), starting at `v1.0.0` once this effort lands. This supersedes [ticket 01's](01-research-cruft-json-custom-manager.md) `git-refs` branch-digest design (its regex-manager mechanics — `managerFilePatterns`, own-PR package rule, `template-update` label — carry over). Tag tracking also dissolves the self-update chase from [ticket 03](03-research-renovate-on-templates-repo.md): a repo tracking its own tags converges, so **no root-repo exclusion rule and no `template:restore` drift hazard**; this repo's root `.cruft.json` simply gets `checkout` set to the current release.

**Bootstrap matcher.** A second matcher treats `"checkout": null` as version `0.0.0` (`currentValueTemplate`) and rewrites it to the latest tag via `autoReplaceStringTemplate`, so projects created without `--checkout` get a one-time "adopt release tracking" PR. Needs dry-run validation during implementation.

**Update execution** (per [ticket 02](02-research-run-template-update-in-pr.md)): `renovatebot/github-action`, default image, `binarySource: 'install'`. The Cruft package rule carries `postUpgradeTasks` with `executionMode: 'branch'`, `fileFilters: ['**/*']`, `installTools` mise + uv, and commands:

1. `git restore --source=HEAD -- .cruft.json`
2. `mise run template:update -- -y --checkout {{{newValue}}}` (Handlebars-templated; the allow-list regex admits the tag)

Strict mode (cruft's default, no flag): a tag older than the project's recorded commit rolls the project back to the release — accepted, and it guarantees a real diff (no empty-PR edge). Verified locally: `cruft update` persists the `--checkout` value into `.cruft.json` on success (`update.py:143` in cruft 2.16.0), so the restore + templated-checkout flow leaves the file consistent.

**Global admin config as env vars in the workflow YAML** (not a config.js): `RENOVATE_ALLOWED_COMMANDS` (exact anchored regexes for the two commands), `RENOVATE_ALLOWED_UNSAFE_EXECUTIONS: ["mise"]`, `RENOVATE_REPOSITORIES`, onboarding off; shell executor stays disabled (default).

*Amendment (post-review)*: `RENOVATE_ALLOWED_UNSAFE_EXECUTIONS` was removed. The default image resolves mise to the latest stable release at runtime, which is past the 2026.7.12 `MISE_SAFE=1` threshold, so the allow-list only mattered for mise versions that no run will use; if version detection fails, Renovate skips lock maintenance rather than erroring.

**Lock-file maintenance enabled** in the shipped `renovate.json5` — all mise selectors are `latest`, which only moves via `mise lock --bump`.

**Workflow**: `.github/workflows/renovate.yml`, daily cron + `workflow_dispatch`, `token: ${{ secrets.RENOVATE_TOKEN || github.token }}`, permissions per Renovate's GitHub docs.

**Documentation** — templates repo README only: getting-started gains `--checkout <latest release>` (null degrades to the bootstrap PR), an "Automated updates" section covers the **Allow GitHub Actions to create and approve pull requests** setting, approval-required CI runs on `GITHUB_TOKEN` PRs, the `RENOVATE_TOKEN` upgrade path for workflow-file changes, and the release process.

Out of scope: GitHub Releases with notes and release automation (tags alone feed the datasource, so these bolt on later without breakage).
