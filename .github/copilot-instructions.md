# Copilot instructions for github-actions-pr-is-linked-to-work-item

This repository builds a TypeScript GitHub Action that requires a pull request to be linked to an Azure DevOps work item or GitHub issue.

## Delivery pipeline

- Treat `src/` as the source of truth. TypeScript compilation writes corresponding files to `lib/`.
- The action executes the NCC bundle at `dist/index.js`, configured in `action.yml` for the Node 24 runtime.
- When a change affects action behavior, run `npm run test`; it compiles, packages, then runs Vitest.
- Do not hand-edit generated `lib/` or `dist/` files. Regenerate them with `npm run build` and `npm run package` (or `npm run all`). Include generated output in a change only when the repository’s release process requires it.

## Architecture

- Keep `src/main.ts` focused on orchestration: event context, provider selection, comment lifecycle, and action failure reporting.
- Work-item-specific parsing and linked-state checks belong in `src/providers/` behind the `WorkItemProvider` interface.
- Register every supported provider in `src/providers/index.ts`; the `provider` action input and README must describe the same supported values.
- Preserve hidden comment markers and provider-specific comment codes: they prevent duplicate pull-request comments and identify comments that may be deleted after a successful validation.
- Use `@actions/core` for action logging, warnings, and failures, and `@actions/github`'s authenticated Octokit client for GitHub API calls.

## Safety and compatibility

- This action runs on pull-request events, including the central `pull_request_target` workflow. Never check out, execute, or trust pull-request code while changing validation behavior.
- Keep the early dependabot bypass unless the task explicitly changes bot handling.
- Preserve pagination for GitHub API list endpoints and compare both issue number and repository for cross-repository issue references.
- Prefer explicit validation failures with user-facing remediation messages over silently accepting an unverified reference.

## Style and testing

- Write strict TypeScript compatible with the `tsconfig.json` ES2022/bundler configuration; avoid `any` and unsafe casts.
- Follow Biome conventions: two spaces, single quotes, and LF line endings. Run `npm run lint` and `npm run format-check` for touched TypeScript files.
- Add or update focused Vitest coverage for behavior changes. Test reference parsing edge cases such as casing, boundaries, malformed references, zero identifiers, and cross-repository references.
- Mock Octokit requests in provider unit tests; use the existing subprocess-based integration test for action-level input/output behavior.
- Update `README.md`, `action.yml`, and `required-linked-github-issue.yml` when a public action input, provider, required permission, or workflow usage changes.
