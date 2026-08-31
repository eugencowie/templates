# Renovate behavior in the templates repository

Researched 2026-08-31 against Renovate 44.52.0, current Renovate source at commit [`7c351d2`](https://github.com/renovatebot/renovate/tree/7c351d208eac493997d2580cbecdf509ee5796e2), and this repository's checked-out files.

## Answer

- Keep all three `mise.toml` and `mise.lock` pairs in scope. Renovate matches and parses the copies beneath the literal Jinja directory names. It recognizes both `pipx` and `pipx:cruft`. Updating the nested locks is how new projects receive newer tool versions.
- Enable lock-file maintenance. Every selector in these files is `latest`, which Renovate does not treat as an ordinary version update. Lock-file maintenance is the path that advances the concrete versions in `mise.lock`.
- Keep the nested template workflows in scope. The `github-actions` manager matches `.github/workflows/*.yml` at any depth, not only at the repository root.
- Exclude only this repository's root `.cruft.json` from the Cruft custom manager. Tracking the digest of this repository's own moving `main` branch cannot converge. The exclusion must be added only to the root `renovate.json5` used by `eugencowie/templates`; copying it into the templates would disable the intended updates in every generated project.

## What is in this repository

The root and `bare` template each declare `pipx = "latest"` and `"pipx:cruft" = "latest"`. Their lock files pin `pipx` 1.16.7 and Cruft 2.16.0. The `bare-with-skills` copy declares the same tools plus Node, Skills, and Worktrunk, all with `latest` selectors, and has a lock file beside it. See the [root mise configuration](../../../../mise.toml), [root lock](../../../../mise.lock), [bare configuration](<../../../../bare/{{ cookiecutter.project_slug }}/mise.toml>), [bare lock](<../../../../bare/{{ cookiecutter.project_slug }}/mise.lock>), [bare-with-skills configuration](<../../../../bare-with-skills/{{ cookiecutter.project_slug }}/mise.toml>), and [bare-with-skills lock](<../../../../bare-with-skills/{{ cookiecutter.project_slug }}/mise.lock>).

There are no workflow files in any `.github/workflows` directory yet. Ticket 05 will add them. The workflow conclusion below therefore comes from Renovate's matcher and a minimal reproduction using the exact future path shape.

The root [`.cruft.json`](../../../../.cruft.json) names `https://github.com/eugencowie/templates`, records commit `dac7ca5`, and says the generated directory is `bare`. The remote's symbolic `HEAD` currently points to `refs/heads/main`.

## Mise files

### Matching and parsing

Renovate documents support for `mise.toml` and its standard variants at any directory depth. Its actual default is the glob `**/{,.}mise{,.*}.toml`, and the source tests include `subdir/mise.toml` and deeper paths as positive cases. A literal `{{ cookiecutter.project_slug }}` directory has no special meaning to the glob engine. It is just another directory name. [Official mise manager documentation](https://docs.renovatebot.com/modules/manager/mise/#file-matching), [manager defaults](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/index.ts#L23-L39), [path tests](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/index.spec.ts#L4-L48).

The manager parses each matched TOML file, walks its `[tools]` entries, derives a sibling lock-file path, and reads locked versions from that file. For `subdir/mise.toml`, the derived lock path is `subdir/mise.lock`. The Jinja text appears only in the parent path, so it does not reach the TOML parser. [Extraction source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/extract.ts#L42-L102), [lock path and key lookup](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/lockfile.ts#L35-L94), [lock extraction tests](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/extract.spec.ts#L1163-L1205).

Renovate lists `pipx` as a supported mise backend. A backend-qualified tool without a slash, such as `pipx:cruft`, maps to the PyPI datasource and normalizes the package name to `cruft`. The plain `pipx` short name has a built-in mapping to `pypa/pipx` through GitHub releases. [Supported backends](https://docs.renovatebot.com/modules/manager/mise/#backends-support), [pipx backend implementation](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/backends.ts#L162-L202), [plain pipx mapping](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/upgradeable-tooling.ts#L397-L403), [pipx extraction tests](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/extract.spec.ts#L629-L658).

### `latest` and lock-file maintenance

There is an important split between dependency extraction and useful updates. Renovate extracts the concrete versions from `mise.lock`, but all current selectors in `mise.toml` are `latest`. A local lookup classified `latest` as an invalid ordinary value and proposed no normal version update for Node, Skills, or Cruft. The locks will not move through ordinary dependency PRs.

Renovate supports mise lock-file maintenance, but that feature is disabled by default. When enabled and run with a recent mise, Renovate invokes `mise lock --bump`; `--bump` advances fuzzy selectors such as `latest`, while plain `mise lock` only refreshes metadata for existing locked versions. [Mise lock-file documentation](https://docs.renovatebot.com/modules/manager/mise/#lock-file-support), [lock-file maintenance default](https://docs.renovatebot.com/configuration-options/#lockfilemaintenance), [artifact update source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/artifacts.ts#L105-L174).

The practical configuration requirement is:

```json5
{
  lockFileMaintenance: {
    enabled: true,
  },
}
```

Keep the nested mise files enabled. Their locks are source assets, not duplicate build output. A lock maintenance PR that updates them changes what Cruft copies into newly generated repositories.

### Self-hosted execution requirement

Renovate's published self-hosted contract says administrators must add `mise` to the global `allowedUnsafeExecutions` list before Renovate may run `mise lock`. This is a runner-level option, not repository configuration. [Mise trust documentation](https://docs.renovatebot.com/modules/manager/mise/#trust-model-for-lock-file-updates), [`allowedUnsafeExecutions`](https://docs.renovatebot.com/self-hosted-configuration/#allowedunsafeexecutions).

Current source has a newer exception that the prose has not fully incorporated. If the mise binary Renovate will run is at least 2026.7.12, Renovate can set `MISE_SAFE=1` and update locks without the allowlist. If detection fails or mise is older, it refuses the operation unless `mise` is allowlisted. The predictable template design is still to configure `allowedUnsafeExecutions: ["mise"]` in the self-hosted runner and ensure its mise is at least 2026.7.12 so lock maintenance uses `--bump`. [Safe-mode threshold and detection](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/artifacts.ts#L22-L68), [allowlist and fallback logic](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/mise/artifacts.ts#L120-L164).

## Nested GitHub Actions workflows

The `github-actions` manager's default regular expression starts with `(^|/)`, then looks for `.github/workflows`, and accepts one or more path characters before a `.yml` or `.yaml` suffix. It therefore matches both of these future files:

```text
bare/{{ cookiecutter.project_slug }}/.github/workflows/renovate.yml
bare-with-skills/{{ cookiecutter.project_slug }}/.github/workflows/renovate.yml
```

The matcher is not restricted to root `.github/workflows`. [Official file-matching documentation](https://docs.renovatebot.com/modules/manager/github-actions/#file-matching), [manager default source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/github-actions/index.ts#L11-L20).

A minimal repository containing `bare/{{ cookiecutter.project_slug }}/.github/workflows/renovate.yml` with `uses: renovatebot/github-action@v44.2.1` confirmed the full extraction path. Renovate matched that nested file and extracted `renovatebot/github-action` through `github-tags`. The Jinja directory name did not affect matching or YAML parsing.

Keep these workflow files enabled. Updating an action reference in the template source is what gives future generated projects the new reference. The nested workflow does not have to be executable in this repository for Renovate to scan it.

## The root `.cruft.json` self-reference

### Renovate's documented behavior

Ticket 01's design puts `main` in `currentValue` and captures each Cruft SHA as `currentDigest`. Renovate documents that exact `git-refs` pattern for following the digest of a named branch. Its datasource resolves the named head and returns that head's commit hash as `newDigest`. [Ticket 01 research](01-cruft-json-custom-manager.md), [`git-refs` documentation](https://docs.renovatebot.com/modules/datasource/git-refs/), [`git-refs` source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/datasource/git-refs/index.ts#L25-L59), [digest lookup source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/datasource/git-refs/index.ts#L75-L100).

This behavior is sane for a consumer repository because a template commit can advance without changing the consumer's own default branch. It is not sane when the dependency and consumer are the same moving branch.

### Why it cannot settle

The following lifecycle is an inference from the documented digest behavior and Git commit identity:

1. The templates repository's default branch is at commit `C1`. Its root `.cruft.json` records an older template commit `C0`.
2. Renovate resolves `main` to `C1` and opens a PR that records `C1`.
3. Merging that PR advances `main` to a new commit `C2`. The merged file still records `C1`.
4. The next Renovate run resolves `main` to `C2` and opens the same kind of digest PR again.

The merge method does not rescue this design. A merge commit creates `C2`; a squash creates a different `C2`; and a fast-forward makes Renovate's update commit the new tip. In every case the file records the tip that existed before the update commit. A commit cannot normally contain its own hash because changing the stored hash changes the commit hash.

The current branch already shows the first step concretely. Commit `586f0b3` introduced the root `.cruft.json` with `dac7ca5`, its parent and the current remote `main` tip, as the recorded template commit. Once that branch lands, the file will be behind the new default-branch tip immediately.

This is a perpetual self-update chase, not a useful propagation loop. Exclude the root file.

### Narrow exclusion

Use a package rule in this repository's root `renovate.json5`:

```json5
{
  description: 'Do not track this repository as its own Cruft dependency',
  matchManagers: ['custom.regex'],
  matchFileNames: ['.cruft.json'],
  enabled: false,
}
```

`matchFileNames` accepts an exact root filename, and `enabled: false` disables the matched dependency. [File matcher documentation](https://docs.renovatebot.com/configuration-options/#packagerulesmatchfilenames), [dependency disabling example](https://docs.renovatebot.com/configuration-options/#ignoredeps).

Do not put this rule in the `bare` or `bare-with-skills` Renovate config. A generated project's intended Cruft metadata is also a root `.cruft.json`; the same rule would switch off template updates everywhere. Ticket 06 should keep this as a repository-local difference after copying the shared config into the repository root.

## Local verification

I ran the released Renovate CLI at version 44.52.0 with Node 24.11.1.

The repository extraction command was:

```sh
LOG_LEVEL=debug mise exec node@24.11 -- npx --yes renovate@44.52.0 \
  --platform=local --dry-run=extract \
  --enabled-managers=mise,github-actions --onboarding=false
```

It matched these three files and reported nine dependencies:

```text
bare-with-skills/{{ cookiecutter.project_slug }}/mise.toml
bare/{{ cookiecutter.project_slug }}/mise.toml
mise.toml
```

For each relevant file, it extracted `pipx` as `pypa/pipx` via `github-releases`, extracted `pipx:cruft` as `cruft` via `pypi`, and attached the sibling `mise.lock`. A `--dry-run=lookup` run reported `latest` as an unsupported ordinary value and returned zero branches.

For the Actions reproduction, I created a temporary Git repository with the exact nested Jinja path shown above and one `renovatebot/github-action@v44.2.1` reference. The same CLI with `--enabled-managers=github-actions` matched one workflow file and extracted the action.

For the self-reference reproduction, I used the Ticket 01 manager shape against a temporary root `.cruft.json` containing an all-zero digest. `--dry-run=lookup` returned one `digest` update whose `newValue` was `main` and whose `newDigest` was the live `dac7ca5` tip. Adding the exact package rule above returned zero updates and `skipReason: disabled`.
