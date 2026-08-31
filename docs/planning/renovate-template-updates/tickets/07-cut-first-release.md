# Cut the first release (v1.0.0)

Type: task
Status: open
Blocked by: 06

## Question

Once the implementation has landed on `main`, tag it: `git tag v1.0.0 && git push origin v1.0.0`. This is the tag the shipped Renovate config and the repo's own `.cruft.json` `checkout` value point at; without it the `github-tags` datasource has nothing to resolve. Record the tagged commit here on resolution.

Reconciliation needed (found during ticket 06): the root `.cruft.json` has `"checkout": "v1.1.0"`, committed before this effort. Either tag `v1.1.0` instead of `v1.0.0`, or lower the `checkout` value to match the tag — otherwise the repo reads as ahead of the only release and Renovate proposes nothing.

Per research ticket 02's rollout note, watch the first scheduled workflow run with debug logging: the auto-replace branch content and the live post-upgrade task (mise/uv bootstrap, cruft run, PR creation) could not be verified offline.
