# Template updates propagate via tagged releases and Renovate

This repo is itself an instance of its own `bare` template. Files derived from the template (such as `docs/agents/*.md`) are never hand-patched here: make the change in the template, tag a release, and Renovate applies it to every instance - including this repo - automatically. Editing instance files directly was rejected because it silently breaks the mirror between template and instances and hides the change from every other instance; the cost is release latency for non-urgent fixes.
