---
name: add-work-item-provider
description: "Add or modify a traceability provider for this GitHub Action. Use when adding Jira, Azure DevOps, GitHub Issues, another work-item system, provider reference parsing, provider registration, or provider-specific linked-state verification."
argument-hint: "Describe the provider, reference syntax, and how its link should be verified"
---

# Add a work-item provider

Extend the existing provider abstraction without putting provider-specific rules into the main action flow.

## Procedure

1. Read `src/providers/types.ts`, `src/providers/index.ts`, both existing providers, and their tests before choosing the implementation shape.
2. Define the user-facing reference grammar, including accepted examples, malformed examples, case rules, cross-repository behavior, and whether multiple references are supported.
3. Implement the provider in `src/providers/<provider-name>.ts` as a `WorkItemProvider`:
   - Give it a unique `name` and three unique comment codes.
   - Implement `findReference()` to return `undefined` unless the reference is valid and actionable.
   - Implement `isLinked()` as an independent verification of the actual relationship, not merely a text search.
   - Provide clear remediation messages and choose bot wait/delete behavior deliberately.
4. Register and re-export the provider in `src/providers/index.ts`. Update the `WorkItemProvider['name']` union if the type remains closed.
5. Update `action.yml`'s provider-input description and all relevant README usage, syntax, permission, and security notes.
6. Add Vitest coverage for positive parsing, malformed/casual references, boundary and casing cases, and linked/unlinked API responses. Mock Octokit calls and cover pagination if the API lists relationships.
7. Run `npm run lint`, `npm run format-check`, and `npm run test`. If the change is intended for publication, regenerate the bundle with `npm run all` and inspect the generated diff.

## Guardrails

- Do not weaken existing providers to make a new provider fit.
- Preserve cross-repository identity checks: compare repository as well as work-item identifier.
- Do not execute or check out pull-request code in workflows that use `pull_request_target`.
- Avoid accepting a text reference unless the configured provider can verify the matching link.
