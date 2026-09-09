# Check for a linked work item

> This action is a pre-release

## Usage

Run the action when a pull request is opened, reopened, or edited. It needs permission to read pull requests and write issue comments.

```yml
name: Validate linked work item

on:
  pull_request:
    types: [opened, reopened, edited]
    branches: [main]

permissions:
  pull-requests: read
  issues: write

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: JoostVoskuil/github-actions-pr-traceable-to-work@main
        with:
          provider: azuredevops
```

### Azure DevOps

Set `provider: azuredevops`. The action requires an `AB#` reference in the pull request description and verifies that the Azure Boards integration created the matching link.

Make sure the GitHub repository is connected to Azure Boards:

- [Azure Boards and GitHub integration](https://learn.microsoft.com/en-us/azure/devops/boards/github/?view=azure-devops)
- [Install the Azure Boards app](https://github.com/marketplace/azure-boards)
- [Link GitHub pull requests to Azure Boards work items](https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops)

### GitHub Issues

Set `provider: github`. The pull request description must use a GitHub closing keyword and the referenced issue must appear in GitHub's linked-issues relationship for the pull request.

```text
Fixes #123
Resolves octo-org/other-repository#456
```

The supported keywords are `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, and `resolved`, without regard to case. Casual references such as `Related to #123` do not pass the check.

For a private issue in another repository, provide `repo-token` with access to both repositories. The default `GITHUB_TOKEN` commonly has access only to the repository running the workflow.

## Central required workflow

For an organization or enterprise ruleset, use the example workflow at [`./required-linked-github-issue.yml`](./required-linked-github-issue.yml) from a central repository. Configure the ruleset's **Require workflows to pass before merging** rule to use that repository and workflow.

The example uses `pull_request_target`, which ruleset workflows support and which lets the action comment on the pull request. It does not check out the repository or run pull-request code, so it is safe for forked pull requests. It also uses `ubuntu-slim`, GitHub's single-CPU runner optimized for short automation tasks, and cancels obsolete runs for the same pull request.

See GitHub's documentation for [Require workflows to pass before merging](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-workflows-to-pass-before-merging). This lets one workflow enforce the requirement globally across all repositories targeted by an organization or enterprise ruleset.

The central workflow repository must have a visibility compatible with the repositories covered by the ruleset. If it is internal or private, enable access to its actions and workflows from the applicable organization or enterprise repositories in the central repository's **Actions** settings.

This repository is a fork and rebrand maintained by [Joost Voskuil](https://github.com/JoostVoskuil). The original action was created by [DanHellem](https://github.com/danhellem) in [`danhellem/github-actions-pr-is-linked-to-work-item`](https://github.com/danhellem/github-actions-pr-is-linked-to-work-item). Credit is retained in appreciation of that work.

## Comment codes

The action adds hidden markers to its comments to avoid posting duplicates. Azure DevOps uses `lcc-200` (success), `lcc-404` (missing reference), and `lcc-416` (unlinked reference). GitHub Issues uses `ghi-200` (success), `ghi-404` (missing closing reference), and `ghi-409` (reference not linked by GitHub).

If you see `Resource not accessible by integration`, grant the workflow token the permissions shown above in the workflow or in the repository's **Actions** settings.

> The required `provider` input supports exactly `azuredevops` and `github`. The action ignores pull requests sent by `dependabot[bot]`.

## Maintainer release process

To create a release, add exactly one release label to the pull request: `release:patch`, `release:minor`, or `release:major`. After the pull request merges into `main`, the release workflow rebuilds and tests the action, commits any updated `dist/` files, and calculates the next version from the latest `vMAJOR.MINOR.PATCH` tag:

- a patch release increments only the patch number, such as `0.0.1` to `0.0.2`;
- a minor release increments the minor number and resets patch to zero, such as `0.0.2` to `0.1.0`;
- a major release increments the major number and resets minor and patch to zero, such as `0.1.0` to `1.0.0`.

The workflow rejects pull requests with multiple release labels. A merge without a release label still synchronizes the generated bundle, but does not create a tag or GitHub Release. The `version` fields in `package.json` and `package-lock.json` are not release inputs and do not need to change for a GitHub Action release.

Use this action to require a pull request to link to either an Azure DevOps work item or a GitHub issue before it can merge.
