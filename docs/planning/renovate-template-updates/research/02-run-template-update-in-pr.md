# Running the template update inside a Renovate PR

Researched 2026-08-31 against the current Renovate, `renovatebot/github-action`, Mise, Cruft, and GitHub documentation and source.

## Recommendation

Use `renovatebot/github-action` with Renovate's default image and `binarySource: 'install'`. Give the Cruft package rule a branch-level `postUpgradeTasks` that asks Containerbase to install Mise and uv, restores the base branch's `.cruft.json`, and then runs `mise run template:update -- -y`. This avoids a custom image and keeps the normal local task as the one source of truth. Renovate recommends its default image for most users, that image installs tools at runtime, `install` is the default `binarySource`, and `mise` and `uv` are both supported `installTools` names ([Renovate runtime distributions](https://docs.renovatebot.com/getting-started/running/#the-default-image-formerly-slim), [`binarySource`](https://docs.renovatebot.com/self-hosted-configuration/#binarysource), [`postUpgradeTasks.installTools`](https://docs.renovatebot.com/configuration-options/#postupgradetasksinstalltools)).

The restore is essential. Renovate writes its proposed package-file changes into the worktree before it starts post-upgrade commands ([Renovate executor source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/execute-post-upgrade-commands.ts#L83-L102)). Cruft refuses to update a dirty Git worktree, then reads the current `.cruft.json` and exits early when its `commit` already equals the template's target commit ([Cruft update source](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L52-L92)). A plain `cruft update -y` therefore fails on Renovate's uncommitted `.cruft.json`; if the cleanliness check were bypassed, it would see the new hash as the baseline and report that there is nothing to do.

The recommended repository configuration is:

```json5
{
  packageRules: [
    {
      // Use the same narrow match as the Cruft custom-manager rule.
      matchManagers: ['custom.regex'],
      matchDatasources: ['git-refs'],
      matchPackageNames: ['eugencowie/templates'],
      matchUpdateTypes: ['digest'],

      postUpgradeTasks: {
        commands: [
          'git restore --source=HEAD -- .cruft.json',
          'mise run template:update -- -y',
        ],
        executionMode: 'branch',
        fileFilters: ['**/*'],
        installTools: {
          mise: {},
          uv: {},
        },
      },
    },
  ],
}
```

Renovate checks out the base branch before calculating the changed package files, runs post-upgrade tasks, and commits only afterwards. At command time, `HEAD` is therefore the base branch commit and Renovate's `.cruft.json` replacement is only a worktree change, so `git restore --source=HEAD -- .cruft.json` recovers the real old Cruft state without needing a Handlebars `currentValue` or `currentDigest` ([Renovate branch sequence](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/index.ts#L603-L681), [commit step](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/index.ts#L734-L771)). Cruft then generates the old template at the restored commit, generates the new template at the remote head, applies their diff, and writes the new commit and context back to `.cruft.json` ([Cruft update source](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L94-L150)).

Keep this update in its own branch and PR. Cruft's cleanliness check rejects any other tracked worktree change, so grouping the Cruft digest with another dependency update would make the command fail even after `.cruft.json` is restored ([Cruft cleanliness check](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L52-L60), [clean-tree implementation](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L180-L191)). `executionMode: 'branch'` runs the task once for the whole branch rather than once for each of the two digest matches in `.cruft.json` ([Renovate execution-mode documentation](https://docs.renovatebot.com/configuration-options/#postupgradetasksexecutionmode), [branch-mode implementation](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/execute-post-upgrade-commands.ts#L371-L409)).

## Global and repository configuration

`postUpgradeTasks` belongs in repository configuration, usually on the narrow package rule above. `allowedCommands`, `binarySource`, and `allowShellExecutorForPostUpgradeCommands` are administrator-controlled, global-only settings. Renovate ignores self-hosted options placed in `renovate.json` and expects them in the bot configuration file, environment, or CLI arguments ([self-hosted configuration boundary](https://docs.renovatebot.com/self-hosted-configuration/)).

The action's administrator config should include exact, anchored allow-list expressions:

```js
module.exports = {
  platform: 'github',
  binarySource: 'install',
  allowedCommands: [
    '^git restore --source=HEAD -- \\.cruft\\.json$',
    '^mise run template:update -- -y$',
  ],
  allowShellExecutorForPostUpgradeCommands: false,
};
```

`allowedCommands` is an array of regular expressions, defaults to an empty list that blocks every post-upgrade command, and was formerly named `allowedPostUpgradeCommands`. Renovate compares the final templated command against the expressions ([`allowedCommands`](https://docs.renovatebot.com/self-hosted-configuration/#allowedcommands), [`postUpgradeTasks.commands`](https://docs.renovatebot.com/configuration-options/#postupgradetaskscommands)). These two commands need no pipe, redirection, variable expansion, or other shell feature, so leave the shell executor disabled. Renovate warns that enabling it permits additional command execution and environment-variable access that are difficult to constrain with regular expressions ([shell-executor warning](https://docs.renovatebot.com/self-hosted-configuration/#allowshellexecutorforpostupgradecommands)).

An exact allow-list does not make `mise run template:update` intrinsically safe: the command executes the repository-owned task body. Enabling it delegates code execution to the repositories that this bot processes. Use it only for repositories whose default-branch configuration is trusted, and keep the bot token and repository list narrowly scoped. This is an inference from Mise executing the configured task and Renovate's warning that post-upgrade commands are blocked by default for security reasons ([Mise task overview](https://mise.jdx.dev/tasks/), [Renovate post-upgrade security model](https://docs.renovatebot.com/configuration-options/#postupgradetasks)).

`fileFilters: ['**/*']` tells Renovate to include every non-ignored file changed by the task, including dotfiles. There is no need to run `git add`; Renovate specifically tells post-upgrade tasks to use `fileFilters` instead ([`fileFilters`](https://docs.renovatebot.com/configuration-options/#postupgradetasksfilefilters), [`commands` note](https://docs.renovatebot.com/configuration-options/#postupgradetaskscommands)).

## Where the command runs and how tools get there

The GitHub Action is a Docker launcher. Its source builds and executes `docker run` for the chosen Renovate image, passing selected environment variables and mounts into that container ([action execution source](https://github.com/renovatebot/github-action/blob/92becf504eb8a283372f335f55711c7cbbf3a77a/src/renovate.ts#L28-L95)). Because the Renovate process that invokes `postUpgradeTasks` is that containerized process, the commands also run inside the Renovate container ([post-upgrade invocation](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/execute-post-upgrade-commands.ts#L149-L203)). It follows that installing Mise in an earlier host-runner step does not put it on the container's `PATH`.

With `binarySource: 'install'` in a Containerbase image, Renovate prepends dynamically generated `install-tool` commands for the requested constraints before the post-upgrade command ([Renovate execution source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/util/exec/index.ts#L80-L132)). `postUpgradeTasks.installTools` includes `mise` and `uv`; it cannot directly install Cruft because `cruft` is not a Containerbase tool name ([supported tool list](https://docs.renovatebot.com/configuration-options/#postupgradetasksinstalltools)).

Once Mise is present, `mise run` automatically installs missing tool versions required by the task because task auto-install is enabled by default ([Mise auto-install documentation](https://mise.jdx.dev/dev-tools/#auto-install-mechanisms)). That covers this repository's [`pipx` and `pipx:cruft` declarations](../../../../mise.toml). Supplying uv as well makes the Python CLI bootstrap explicit: Mise's pipx backend requires either uv or pipx and uses `uv tool install` when uv is on `PATH` ([Mise pipx dependencies](https://mise.jdx.dev/dev-tools/backends/pipx.html#dependencies)). Mise's documented task syntax forwards arguments after the task name, and `--` bypasses its argument parser, so `mise run template:update -- -y` passes `-y` through to [`cruft update`](../../../../mise.toml) ([Mise task arguments](https://mise.jdx.dev/tasks/running-tasks.html)).

The alternatives all work, but add more maintenance:

- `binarySource: 'global'` uses only preinstalled tools and makes `postUpgradeTasks.installTools` ineffective. It is appropriate only when a custom image or native installation already supplies every binary ([`binarySource`](https://docs.renovatebot.com/self-hosted-configuration/#binarysource), [`installTools` limitation](https://docs.renovatebot.com/configuration-options/#postupgradetasksinstalltools)).
- The `-full` Renovate image carries recent versions of most supported package managers, but weighs several gigabytes and still does not guarantee every manager. Runtime installation in the default image is the documented default ([full-image trade-offs](https://docs.renovatebot.com/getting-started/running/#the-full-image)).
- A custom image can preinstall Mise and Cruft. The action exposes `renovate-image` for this purpose, but then the project must build, publish, patch, and version that image ([action image option](https://github.com/renovatebot/github-action/blob/92becf504eb8a283372f335f55711c7cbbf3a77a/README.md#renovate-image)).
- Running the Renovate npm CLI directly on the runner makes post-upgrade commands share the runner's installed tools, but the operator becomes responsible for installing every language and third-party tool Renovate needs ([Renovate CLI distribution](https://docs.renovatebot.com/getting-started/running/#npm-package-cli-command-line-interface)).
- `binarySource: 'docker'` and Docker sidecars should not be chosen for a new setup because Renovate has deprecated that mode ([`binarySource` deprecation](https://docs.renovatebot.com/self-hosted-configuration/#binarysource)).

## Token behavior and workflow files

The action's required input is named `token`. Its implementation maps that input to `RENOVATE_TOKEN`; if the input is empty it falls back to an existing `RENOVATE_TOKEN` environment variable, and an explicit input wins ([action input source](https://github.com/renovatebot/github-action/blob/92becf504eb8a283372f335f55711c7cbbf3a77a/src/input.ts#L9-L22), [input precedence](https://github.com/renovatebot/github-action/blob/92becf504eb8a283372f335f55711c7cbbf3a77a/src/input.ts#L113-L134)). The action does not automatically select `github.token`; pass the desired credential explicitly:

```yaml
with:
  token: ${{ secrets.RENOVATE_TOKEN || github.token }}
```

An unset secret evaluates to an empty string, empty strings are false in expressions, and `||` is the logical-or operator, so this uses the optional secret when present and otherwise the job's `GITHUB_TOKEN` ([GitHub secrets behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#using-secrets-in-a-workflow), [GitHub expression operators](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#operators)). Give the job's `GITHUB_TOKEN` the ordinary permissions Renovate needs, including `contents: write`, `pull-requests: write`, `issues: write`, and `statuses: write` ([Renovate GitHub permissions](https://docs.renovatebot.com/modules/platform/github/#permissions)). GitHub documents that a workflow can adjust only the permission keys in its supported `permissions` list ([workflow token permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)). The repository or organization setting **Allow GitHub Actions to create and approve pull requests** must also be enabled for `GITHUB_TOKEN` to create the PR ([action token note](https://github.com/renovatebot/github-action/blob/92becf504eb8a283372f335f55711c7cbbf3a77a/README.md#token)).

`GITHUB_TOKEN` is not sufficient when Cruft's generated diff changes `.github/workflows/**`. GitHub requires classic PATs to have the `workflow` scope, or fine-grained tokens to have both Contents and Workflows write permission, to modify that directory ([GitHub contents API permissions](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)). The workflow `permissions` syntax has no `workflows` grant for `GITHUB_TOKEN`, while the Renovate action also states that a token without `workflow` scope cannot create update PRs for workflow files ([workflow permission keys](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions), [Renovate action token requirement](https://github.com/renovatebot/github-action/blob/92becf504eb8a283372f335f55711c7cbbf3a77a/README.md#special-token-requirements-when-using-the-github-actions-manager)). The same restriction applies whether Renovate's GitHub Actions manager edits the workflow directly or Cruft generates the edit; this is an inference from GitHub enforcing the permission on the path being pushed.

The least-hassle mitigation is the optional `RENOVATE_TOKEN` fallback above. Ordinary repositories can start with `GITHUB_TOKEN`; a repository whose template updates can touch workflows must define `RENOVATE_TOKEN` as either a classic PAT with `repo` and `workflow`, a fine-grained PAT with Renovate's listed repository permissions including Workflows read/write, or a GitHub App installation token with Workflows read/write ([Renovate GitHub authentication](https://docs.renovatebot.com/modules/platform/github/#authentication), [fine-grained and App permissions](https://docs.renovatebot.com/modules/platform/github/#running-using-a-fine-grained-token)).

There is a separate event behavior to account for. Pull requests created or updated with `GITHUB_TOKEN` now create `pull_request` workflow runs in an approval-required state; a PAT or GitHub App token avoids that manual approval. Other events caused by `GITHUB_TOKEN`, including `push`, do not create a new workflow run ([GitHub token event behavior](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs)).

## Cruft prompts and rejected patches

Cruft defines `-y` as the short form of `--skip-apply-ask`, which skips the apply prompt and directly applies the update ([Cruft CLI source](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_cli.py#L218-L224)). This suppresses the interactive `Apply diff and update?` loop but does not mean that every hunk applied cleanly ([Cruft prompt and apply source](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L281-L318)).

Cruft first tries `git apply -3`. If that attempt fails without dirtying the repository, it retries with `git apply --reject`; rejected hunks can become `*.rej` files, and Cruft warns that they may need manual resolution ([Cruft patch strategies](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L194-L244)). Cruft still returns success from the apply helper and updates `.cruft.json` after this path, so the PR contents, not only the command exit code, must signal that manual resolution is required ([Cruft update completion](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L132-L150), [apply helper return](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L281-L318)).

Renovate reads Git status after the commands and records untracked and modified files that match `fileFilters`, so `['**/*']` captures non-ignored `.rej` files in the PR ([Renovate status collection](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/execute-post-upgrade-commands.ts#L231-L332), [`fileFilters`](https://docs.renovatebot.com/configuration-options/#postupgradetasksfilefilters)). Do not add `*.rej` to `.gitignore`: Renovate's default filter only includes non-ignored files, and `fileFilters` cannot override Git ignores ([`fileFilters` ignored-file rule](https://docs.renovatebot.com/configuration-options/#postupgradetasksfilefilters)). Not every three-way conflict is guaranteed to produce a `.rej`; Cruft only enters the reject fallback when the failed three-way attempt leaves the tree clean ([Cruft fallback condition](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L221-L244)).

## Remaining gotchas

- The `postUpgradeTasks` rule must match only the Cruft digest updates and those updates must remain isolated. Otherwise Cruft's clean-tree precondition breaks the design ([Cruft clean-tree check](https://github.com/cruft/cruft/blob/33f6b722fc6fe4b5d26a351e487372e5e4375ab2/cruft/_commands/update.py#L52-L60)).
- Keep the two commands as separate array entries. They run sequentially, and each resolved command is checked separately against `allowedCommands` ([Renovate executor source](https://github.com/renovatebot/renovate/blob/7c351d208eac493997d2580cbecdf509ee5796e2/lib/workers/repository/update/branch/execute-post-upgrade-commands.ts#L149-L228)).
- The repository currently asks Mise for `latest` pipx and Cruft versions and records resolved versions in [`mise.lock`](../../../../mise.lock). The first live rollout should use Renovate debug logging and a test repository because this exact Containerbase, Mise, uv, and pipx bootstrap chain is composed from supported pieces rather than documented by Renovate as a single Cruft recipe ([Renovate debug logging example](https://github.com/renovatebot/github-action/blob/92becf504eb8a283372f335f55711c7cbbf3a77a/README.md#debug-logging)).
- A workflow-capable PAT is a materially stronger credential than `GITHUB_TOKEN`. Scope it to the intended repositories and expose it only to this trusted workflow; GitHub recommends minimum token permissions and a GitHub App or PAT only when `GITHUB_TOKEN` lacks the required permission ([GitHub token guidance](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token#granting-additional-permissions)).
