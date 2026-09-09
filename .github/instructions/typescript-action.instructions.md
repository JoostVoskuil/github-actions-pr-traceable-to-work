---
name: TypeScript GitHub Action conventions
description: "Use when creating or modifying TypeScript source or Vitest tests for this pull-request work-item traceability GitHub Action. Covers providers, comment lifecycle, API checks, and generated artifacts."
applyTo: "{src,test}/**/*.ts"
---

# TypeScript GitHub Action conventions

- Make behavioral changes in `src/`; `lib/` and `dist/` are generated output.
- Keep provider-specific rules in `src/providers/`. A provider must implement `WorkItemProvider`, be registered in `src/providers/index.ts`, and use unique success, missing, and unlinked comment codes.
- `findReference()` should return `undefined` for malformed or non-qualifying text. `isLinked()` must independently verify the provider-side relationship; detecting a textual reference alone is insufficient.
- Preserve provider behavior for bot events. In particular, Azure Boards link rendering is asynchronous and GitHub API list calls need pagination.
- Test parsing through provider unit tests and keep Octokit mocks scoped to the endpoint behavior being verified. Use a real provider instance rather than duplicating its regex in tests.
- For action-level behavior, extend `test/main.test.ts`, which runs the packaged action through GitHub Actions-style `INPUT_*` and event environment variables.
- Before completing a source or test change, run `npm run lint`, `npm run format-check`, and `npm run test` when feasible.
