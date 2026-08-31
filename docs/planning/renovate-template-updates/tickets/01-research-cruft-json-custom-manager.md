# Research: Renovate custom manager for .cruft.json

Type: research
Status: resolved

## Question

What is the exact `renovate.json5` configuration to make Renovate track the `commit` field of a generated `.cruft.json` against the template repo (`https://github.com/eugencowie/templates`), so a new template commit produces an update PR?

Specifics to pin down against Renovate's own docs:

- The `customManagers` (regex) definition: matching the `"commit"` (and `_commit`) fields in `.cruft.json`, which datasource fits (`git-refs` / `github-refs` / other) for following the tip of the template's default branch by commit SHA, and how `currentDigest`-style updating works for a branch ref.
- How to give the template bump its own PR (packageRules grouping/label) separate from mise and GitHub Actions updates.
- Any prior art: existing community configs or presets for cruft/cookiecutter tracking worth copying.

Record findings per the research skill (Markdown in the repo, `research/` branch), and link them here.

## Answer

Use Renovate's `git-refs` datasource with `main` as `currentValue` and both Cruft SHA fields as `currentDigest`. A scoped digest package rule keeps the two replacements in one template-update PR without grouping Mise or GitHub Actions updates.

The exact validated configuration, source-backed rationale, alternatives, prior art, and workflow caveat are in [the research note](../research/01-cruft-json-custom-manager.md).
