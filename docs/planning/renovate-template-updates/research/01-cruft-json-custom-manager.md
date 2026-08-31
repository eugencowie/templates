# Renovate custom manager for `.cruft.json`

Researched 2026-08-31 against the current Renovate documentation and source, Cruft source, and this repository's `.cruft.json`.

## Recommendation

Use the `git-refs` datasource and model `main` as the stable value whose digest is the template commit. The repository's default branch is currently `main`, and its `HEAD` and `refs/heads/main` both resolve to the SHA recorded in this project's `.cruft.json` ([GitHub repository metadata](https://api.github.com/repos/eugencowie/templates), [repository page](https://github.com/eugencowie/templates)).

```json5
{
  $schema: 'https://docs.renovatebot.com/renovate-schema.json',

  customManagers: [
    {
      customType: 'regex',
      description: 'Track the Cruft template commit',
      managerFilePatterns: ['/^\\.cruft\\.json$/'],
      matchStrings: [
        '"_?commit"\\s*:\\s*"(?<currentDigest>[0-9a-f]{40})"',
      ],
      datasourceTemplate: 'git-refs',
      depNameTemplate: 'eugencowie/templates',
      packageNameTemplate: 'https://github.com/eugencowie/templates',
      currentValueTemplate: 'main',
      versioningTemplate: 'exact',
    },
  ],

  packageRules: [
    {
      description: 'Keep Cruft template updates in their own PR',
      matchManagers: ['custom.regex'],
      matchDatasources: ['git-refs'],
      matchDepNames: ['eugencowie/templates'],
      matchUpdateTypes: ['digest'],
      groupName: 'template updates',
      groupSlug: 'template-updates',
      addLabels: ['template-update'],
    },
  ],
}
```

This rule deliberately follows `main`, regardless of the existing `.cruft.json` `checkout` value. That matches the ticket's requirement to follow the current default branch. If the template repository renames its default branch, change `currentValueTemplate` to the new branch name.

## Why this shape works

Renovate documents `git-refs` for git dependencies without a native manager. Its branch-digest recipe is to put the named branch in `currentValue` and capture the stored SHA as `currentDigest`; `packageName` is the fully qualified Git URL ([git-refs datasource](https://docs.renovatebot.com/modules/datasource/git-refs/)). In the config above:

- `currentValue` is the stable ref `main`.
- Each JSON SHA is a `currentDigest`.
- A move of `main` produces a `digest` update whose `newValue` remains `main` and whose `newDigest` is the new commit SHA.

The datasource has no default versioning scheme. `exact` accepts a non-empty branch name and only considers that exact value compatible, which prevents Renovate from treating other branches or tags as upgrades ([git-refs datasource table](https://docs.renovatebot.com/modules/datasource/git-refs/), [exact versioning implementation](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/versioning/exact/index.ts#L7-L63)). Do not use `versioningTemplate: 'git'` here. Renovate's `git` versioning accepts only 7-to-40-character hexadecimal commit strings, so it rejects `main` ([git versioning implementation](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/versioning/git/index.ts#L10-L20)).

The single match expression finds both `"commit"` and `"_commit"`. Renovate compiles every regex custom-manager expression with the global flag and turns every match into a dependency, so the expression yields two dependency records ([regex extraction strategy](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/custom/regex/strategies.ts#L16-L37)). The custom manager stores the full property match as `replaceString` ([same source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/manager/custom/regex/strategies.ts#L21-L32)); branch updating then replaces the captured old digest with `newDigest` inside that string ([replacement source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/auto-replace.ts#L319-L329)). Whitespace and the property name remain unchanged.

Cruft itself writes the top-level `commit` from the cloned repository's `HEAD` and adds the same SHA to `context.cookiecutter._commit` when it builds the Cookiecutter context ([Cruft create](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/create.py#L29-L71), [context construction](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/utils/cookiecutter.py#L79-L105)). Updating both occurrences keeps the metadata internally consistent.

The package rule matches only this regex-managed, `git-refs` digest. `matchDepNames` targets the short name supplied by `depNameTemplate`; `matchPackageNames` would instead need the full URL supplied by `packageNameTemplate` ([package-rule name matchers](https://docs.renovatebot.com/configuration-options/#packagerulesmatchdepnames)). It therefore does not collect Mise or GitHub Actions updates. `groupName` puts the two SHA replacements in one PR. `addLabels` appends the template label instead of replacing labels inherited from another rule or preset ([package grouping example](https://docs.renovatebot.com/presets-group/#groupalldigest), [`addLabels` semantics](https://docs.renovatebot.com/configuration-options/#addlabels)).

If `enabledManagers` is configured elsewhere, it must include `custom.regex`; Renovate calls this out in the regex-manager documentation ([regex manager](https://docs.renovatebot.com/modules/manager/regex/)).

## Datasource alternatives

There is no current `github-refs` datasource in Renovate's supported datasource list ([datasource index](https://docs.renovatebot.com/modules/datasource/)).

`github-digest` can also resolve a named GitHub branch to a commit. It defaults to `exact` versioning and supports digest pinning only, but it expects `packageName: 'eugencowie/templates'` and queries GitHub's API for tags and branches ([github-digest documentation](https://docs.renovatebot.com/modules/datasource/github-digest/), [implementation](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/datasource/github-digest/index.ts#L47-L133)). It is a valid GitHub-only alternative. `git-refs` is the better fit here because Renovate documents this exact `currentValue` plus `currentDigest` use case and it accepts the template URL already stored by Cruft.

Do not set `currentValueTemplate: 'HEAD'`. In the current `git-refs` source, a supplied value is searched only among named heads and tags. The datasource resolves symbolic `HEAD` only when no value is supplied ([git-refs `getDigest`](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/modules/datasource/git-refs/index.ts#L70-L95)). Omitting `currentValueTemplate` therefore resolves the remote's symbolic `HEAD` in the current implementation, but the published recipe says to supply a named ref. Hard-coding the verified branch name is the documented option.

## Prior art

The closest Renovate-owned prior art is its `git-refs` example, which tracks the digest of a branch with a regex manager ([official example](https://docs.renovatebot.com/modules/datasource/git-refs/)). A Renovate support discussion reached the same working pattern for a branch commit: capture `currentDigest`, set the branch through `currentValueTemplate`, and use `git-refs` ([discussion 19076](https://github.com/renovatebot/renovate/discussions/19076)).

Renovate discussion 24000 requested a native Cruft manager and supplied demonstration repositories and hand-built Cruft update PRs, but it did not produce a built-in manager or a reusable custom-manager preset ([discussion 24000](https://github.com/renovatebot/renovate/discussions/24000)). Renovate's current manager index lists custom regex and JSONata managers but no Cruft manager ([manager index](https://docs.renovatebot.com/modules/manager/)). I did not find a maintained first-party or community preset specific to `.cruft.json`; the generic branch-digest pattern above is the part worth copying.

## Validation

I validated the snippet with `renovate-config-validator` from Renovate 44.37.1. A local `--dry-run=lookup` against this repository matched only the root `.cruft.json`, extracted two `custom.regex` dependencies, and assigned both of them these fields:

```text
depName:       eugencowie/templates
packageName:   https://github.com/eugencowie/templates
currentValue:  main
currentDigest: dac7ca51bb2b061d95a45a0e65c734fe6cef79e0
datasource:    git-refs
versioning:    exact
```

The lookup returned no update because the recorded SHA was the current `main` tip at validation time. This also verified that the JSON5 escaping shown above gives Renovate the intended regex. A second dry run in a disposable worktree replaced the SHAs with a stale commit. Renovate then produced two digest updates in one `renovate/template-updates` branch and applied `addLabels: ['template-update']`, confirming that the package rule matches both extracted dependencies.

## Workflow caveat for the next research ticket

This configuration first changes both SHA fields. Running plain `cruft update` after those replacements will not apply the template diff. Cruft clones the template, compares its `HEAD` with `.cruft.json`'s top-level `commit`, and exits early when they match; only after applying a real update does Cruft write the new `commit` and regenerated context ([Cruft update](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L74-L133)).

The follow-up design must preserve or restore the old `.cruft.json` before invoking `cruft update`, or use another trigger file for Renovate and leave `.cruft.json` untouched until Cruft runs. Without that step, the Renovate PR is a metadata-only bump that tells Cruft the template has already been applied.
