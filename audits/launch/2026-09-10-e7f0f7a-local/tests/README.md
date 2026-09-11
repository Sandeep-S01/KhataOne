# Audit Test Harnesses

These scripts are intentionally fail-closed. They require explicit non-production targets and credentials before making authenticated, state-changing or load-generating requests.

Recommended next pass:

```text
node tests/staging-smoke-check.mjs
k6 run tests/illustrative-webhook-load.js
```

Do not run against production unless the target is explicitly authorized and allowlisted.
