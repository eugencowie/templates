# Research: Renovate behaviour on the templates repo itself

Type: research
Status: resolved

## Question

The templates repo is generated from its own `bare` template, so it will carry the same `renovate.json5` and workflow. What does Renovate do with this repo's unusual layout, and does anything need excluding?

Specifics to pin down:

- Does Renovate's mise manager pick up `mise.toml`/`mise.lock`, including the `pipx:cruft` backend and `pipx` tool used here? Does it also match the copies under `bare/{{ cookiecutter.project_slug }}/` and `bare-with-skills/{{ cookiecutter.project_slug }}/` (Jinja-templated paths), and is updating those copies desirable (probably yes — that's how template consumers get tool bumps) or does the templating break parsing?
- Does the actions manager update workflow files that live inside template output dirs (not under the repo root `.github/workflows/`)?
- The self-tracking `.cruft.json` at the repo root points at this repo itself: does the custom manager from ticket 01 behave sanely here (PR bumping the repo to its own latest commit), and should it be excluded or is it the intended self-update loop?

Record findings per the research skill (Markdown in the repo, `research/` branch), and link them here.

## Answer

Renovate matches and parses all three mise configuration and lock-file pairs, including both copies under literal Jinja directory names. It supports `pipx` and `pipx:cruft`, but the current `latest` selectors require enabled lock-file maintenance to move the locked versions. The GitHub Actions manager also matches workflows under the nested template output directories.

The root `.cruft.json` must be excluded from the custom manager only in this repository. A PR can record the current `main` tip, but merging that PR creates a newer tip, so the self-reference can never settle. The source evidence, lifecycle analysis, exact root-only package rule, and Renovate 44.52.0 reproductions are in [the research note](../research/03-renovate-on-templates-repo.md).
