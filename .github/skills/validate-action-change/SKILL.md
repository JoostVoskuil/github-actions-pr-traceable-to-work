---
name: validate-action-change
description: "Validate a change to this TypeScript GitHub Action before release or pull request. Use when testing action behavior, packaging NCC output, checking generated lib or dist artifacts, reviewing workflow safety, or troubleshooting a failed action test."
argument-hint: "Describe the changed behavior or failing test"
---

# Validate an action change

Verify source behavior, bundled delivery artifacts, and pull-request workflow safety for this action.

## Procedure

1. Identify whether the change affects source behavior, action metadata, workflow examples, public documentation, or only generated output.
2. Review the relevant contract:
   - `action.yml` for runtime, entry point, and inputs.
   - `src/main.ts` for event handling and comment lifecycle.
   - `src/providers/types.ts` and `src/providers/` for provider behavior.
   - `README.md` and `required-linked-github-issue.yml` for the public workflow contract.
3. Add or update focused Vitest tests before validation:
   - Provider changes: parsing and linked-state tests with Octokit mocks.
   - Main-flow changes: subprocess integration tests using GitHub Actions environment variables.
   - Regex changes: accepted, rejected, boundary, casing, zero-ID, and cross-repository cases.
4. Run validation in this order:
   - `npm run lint`
   - `npm run format-check`
   - `npm run test`
5. When a production artifact is needed, run `npm run all`. Confirm that `lib/` mirrors TypeScript output and `dist/index.js` is the bundled Node 24 action entry point; do not manually edit either generated directory.
6. Review every workflow change for `pull_request_target` safety: it must not check out or execute pull-request code. Confirm the minimum required token permissions remain documented.
7. Summarize the commands run, their results, any generated files changed, and any checks that could not be run.

## Failure triage

- A TypeScript failure usually indicates a source contract or strict-type mismatch; fix `src/`, not `lib/`.
- A package failure points to the compiled `lib/` entry or NCC configuration; run `npm run build` before retrying packaging.
- A provider test failure should distinguish reference parsing from link verification and inspect the Octokit mock's route, parameters, pagination, and returned repository identity.
- A subprocess integration failure should verify its `INPUT_*` values and event payload shape before changing application logic.
