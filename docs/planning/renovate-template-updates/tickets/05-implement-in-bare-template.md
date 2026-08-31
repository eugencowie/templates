# Implement Renovate config + workflow in the bare template

Type: task
Status: resolved
Blocked by: 04

## Question

Execute the design from [ticket 04](04-decide-workflow-design.md) in `bare/{{ cookiecutter.project_slug }}/`:

- `renovate.json5`: custom regex manager tracking `.cruft.json`'s `checkout` field via `github-tags` (semver, `v`-prefixed), plus the `"checkout": null` → `0.0.0` bootstrap matcher with `autoReplaceStringTemplate`; the template-only package rule (`template-update` label, own PR) carrying `postUpgradeTasks` (`git restore --source=HEAD -- .cruft.json`, then `mise run template:update -- -y --checkout {{{newValue}}}`, `executionMode: 'branch'`, `fileFilters: ['**/*']`, `installTools` mise + uv); `lockFileMaintenance` enabled.
- `.github/workflows/renovate.yml`: daily cron + `workflow_dispatch`, `renovatebot/github-action`, `token: ${{ secrets.RENOVATE_TOKEN || github.token }}`, permissions per Renovate's GitHub docs, admin config as `RENOVATE_*` env vars (`RENOVATE_ALLOWED_COMMANDS` with exact anchored regexes, `RENOVATE_ALLOWED_UNSAFE_EXECUTIONS: ["mise"]`, `RENOVATE_REPOSITORIES`, onboarding off).

Verify with `renovate-config-validator` and local dry runs: tag extraction from a populated `checkout`, the null-bootstrap replacement (the point flagged for validation in ticket 04), and the package rule keeping template bumps in their own PR. Generate a project with `cruft create --directory bare` and inspect the output.

## Answer

Implemented as specified, with one addition the spec missed: both new files contain `{{ }}` sequences (GitHub `${{ }}` expressions, Handlebars `{{{newValue}}}`) that cookiecutter's Jinja would mangle, so `bare/cookiecutter.json` gained `_copy_without_render` for `renovate.json5` and `.github/workflows/renovate.yml`. Any template gaining these files needs the same entry.

Files:

- `bare/{{ cookiecutter.project_slug }}/renovate.json5` — two custom regex managers (populated `checkout` tracked via `github-tags` + `semver-coerced`; `null` bootstrapped as `v0.0.0` with `autoReplaceStringTemplate`), the template-only package rule with `postUpgradeTasks` (restore `.cruft.json`, `mise run template:update -- -y --checkout {{{newValue}}}`, branch mode, `fileFilters: ['**/*']`, `installTools` mise + uv), `lockFileMaintenance` enabled. The populated matcher accepts any non-empty string; non-semver values (branches, SHAs) are skipped gracefully by the versioning.
- `bare/{{ cookiecutter.project_slug }}/.github/workflows/renovate.yml` — daily cron + `workflow_dispatch`, `renovatebot/github-action@v44.2.1`, `token: ${{ secrets.RENOVATE_TOKEN || github.token }}`, permissions (contents, pull-requests, issues, statuses: write), env vars `RENOVATE_REPOSITORIES`, `RENOVATE_ONBOARDING: 'false'`, `RENOVATE_ALLOWED_COMMANDS` (exact anchored regexes for the two task commands), `RENOVATE_ALLOWED_UNSAFE_EXECUTIONS: ["mise"]`.

Verification (Renovate 44.52.0, Node 24.11):

- `renovate-config-validator`: repo config and the global env-var options both pass.
- Dry-run extract: the populated-`checkout` matcher extracts `eugencowie/templates` / `github-tags` with the right `replaceString`.
- Dry-run full with `checkout: null` against a `v`-tagged stand-in repo (`renovatebot/github-action`, since our template has no tags yet): bootstrap matcher fires, `currentVersion: v0.0.0` → `newValue: v46.2.4`, single grouped `renovate/major-template-updates` branch. Branch names carry Renovate's default major/minor prefix — accepted.
- `cookiecutter` generation of `bare`: both files land verbatim; the rest of the template renders normally.

Not verifiable offline: the written branch content of the auto-replace and the live `postUpgradeTasks` run (tool bootstrap, PR creation). Per research ticket 02's rollout note, watch the first real workflow run after the v1.0.0 tag with debug logging.
