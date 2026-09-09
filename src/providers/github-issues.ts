import type {
  Octokit,
  PullRequestContext,
  WorkItemProvider,
  WorkItemReference,
} from './types';

const CLOSING_ISSUE_PATTERN =
  /\b(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+(?:([\w.-]+)\/([\w.-]+))?#([1-9]\d*)\b/gi;
const DOCS_URL =
  'https://docs.github.com/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue';

interface LinkedIssue {
  number: number;
  repository_url?: string;
  url?: string;
}

function isLinkedIssue(value: unknown): value is LinkedIssue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'number' in value &&
    typeof value.number === 'number'
  );
}

function belongsToRepository(
  issue: LinkedIssue,
  owner: string,
  repo: string,
): boolean {
  const repositoryPath = `/repos/${owner}/${repo}`.toLowerCase();
  const issueUrl = issue.repository_url ?? issue.url ?? '';
  const normalizedUrl = issueUrl.toLowerCase();
  return (
    normalizedUrl.endsWith(repositoryPath) ||
    normalizedUrl.includes(`${repositoryPath}/issues/`)
  );
}

export const githubIssuesProvider: WorkItemProvider = {
  name: 'github',
  commentCodes: {
    success: 'ghi-200',
    missing: 'ghi-404',
    unlinked: 'ghi-409',
  },
  docsUrl: DOCS_URL,
  findReference(description: string, pullRequest: PullRequestContext) {
    const match = CLOSING_ISSUE_PATTERN.exec(description);
    CLOSING_ISSUE_PATTERN.lastIndex = 0;

    const id = match?.[3];
    if (!id) {
      return undefined;
    }

    const owner = match[1] ?? pullRequest.owner;
    const repo = match[2] ?? pullRequest.repo;

    return {
      id,
      owner,
      repo,
      display: `${owner}/${repo}#${id}`,
    };
  },
  async isLinked(
    octokit: Octokit,
    pullRequest: PullRequestContext,
    reference: WorkItemReference,
  ) {
    for (let page = 1; ; page += 1) {
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}/issues',
        {
          owner: pullRequest.owner,
          repo: pullRequest.repo,
          pull_number: pullRequest.number,
          per_page: 100,
          page,
        },
      );
      const linkedIssues = Array.isArray(response.data)
        ? response.data.filter(isLinkedIssue)
        : [];

      if (
        linkedIssues.some(
          (issue) =>
            issue.number === Number(reference.id) &&
            belongsToRepository(issue, reference.owner, reference.repo),
        )
      ) {
        return true;
      }

      if (linkedIssues.length < 100) {
        return false;
      }
    }
  },
  getMissingMessage() {
    return 'Description does not contain a GitHub closing issue reference, such as Fixes #123';
  },
  getUnlinkedMessage(reference: WorkItemReference) {
    return `Description references ${reference.display}, but GitHub has not linked that issue to this pull request`;
  },
  getSuccessMessage(reference: WorkItemReference) {
    return `Work item link check complete. GitHub issue ${reference.display} is linked to this pull request.`;
  },
  shouldWaitForLink() {
    return false;
  },
  shouldDeleteFailureComment() {
    return false;
  },
};
