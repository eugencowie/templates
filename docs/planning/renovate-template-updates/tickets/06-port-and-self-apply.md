# Port to bare-with-skills, self-apply, document

Type: task
Status: resolved
Blocked by: 05

## Question

Copy the finished config into `bare-with-skills/{{ cookiecutter.project_slug }}/` (including the `_copy_without_render` entries in `bare-with-skills/cookiecutter.json` — see ticket 05's answer), apply the change to this repo itself (root `renovate.json5` + workflow; set root `.cruft.json`'s `checkout` to `"v1.0.0"` in anticipation of [ticket 07](07-cut-first-release.md) — no exclusion rule needed under tag tracking), and update the templates repo README:

- Getting started: add `--checkout <latest release>` to the `cruft create` command; note that omitting it degrades to a one-time Renovate bootstrap PR that may roll the project back to the latest release (strict mode).
- New "Automated updates" section: what the workflow does, the **Allow GitHub Actions to create and approve pull requests** repo setting, approval-required CI runs on `GITHUB_TOKEN` PRs, the optional `RENOVATE_TOKEN` for template updates touching `.github/workflows/`, and the release process (manual `v`-prefixed semver tags).

## Answer

Done, with one deviation: the root `.cruft.json` already had `"checkout": "v1.1.0"` committed in 586f0b3, predating this effort, so it was left untouched instead of being set to `"v1.0.0"`. Ticket 07 must reconcile the tag name with that value.

- `renovate.json5` and `.github/workflows/renovate.yml` copied unchanged into `bare-with-skills/{{ cookiecutter.project_slug }}/`; its `cookiecutter.json` gained the `_copy_without_render` entries. Cookiecutter generation verified both files land verbatim; `template:update`/`template:restore` tasks already existed in its `mise.toml`.
- Both files also copied to the repo root (the self-application — no exclusions needed under tag tracking).
- README: getting-started now uses `--checkout <latest release>` with the bootstrap/rollback caveat, and a new "Automated updates" section covers the workflow's behaviour, the PR-creation setting, `GITHUB_TOKEN` CI-approval friction, the optional `RENOVATE_TOKEN`, and the manual tag release process.
