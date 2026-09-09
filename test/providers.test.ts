import { describe, expect, test, vi } from 'vitest';
import {
  azureDevOpsProvider,
  githubIssuesProvider,
  type Octokit,
  type PullRequestContext,
} from '../src/providers';

const pullRequest: PullRequestContext = {
  number: 99,
  description: '',
  owner: 'octo-org',
  repo: 'project',
};

function createOctokit(pages: unknown[][]): Octokit {
  const request = vi.fn(
    async (_route: string, parameters: { page: number }) => ({
      data: pages[parameters.page - 1] ?? [],
    }),
  );

  return { request } as unknown as Octokit;
}

describe('Azure DevOps provider', () => {
  test('finds an AB work item reference', () => {
    expect(
      azureDevOpsProvider.findReference('Implements AB#123', pullRequest),
    ).toMatchObject({
      id: '123',
      display: 'AB#123',
      owner: 'octo-org',
      repo: 'project',
    });
  });

  test('requires Azure Boards rendered link evidence', async () => {
    const reference = azureDevOpsProvider.findReference(
      'Implements AB#123',
      pullRequest,
    );
    expect(reference).toBeDefined();
    if (!reference) throw new Error('Expected an Azure DevOps reference');
    await expect(
      azureDevOpsProvider.isLinked(createOctokit([]), pullRequest, reference),
    ).resolves.toBe(false);
  });
});

describe('GitHub Issues provider', () => {
  test('normalizes a same-repository closing reference', () => {
    expect(
      githubIssuesProvider.findReference('Fixes #123', pullRequest),
    ).toMatchObject({
      id: '123',
      display: 'octo-org/project#123',
      owner: 'octo-org',
      repo: 'project',
    });
  });

  test('recognizes closing keywords without regard to case', () => {
    expect(
      githubIssuesProvider.findReference('RESOLVED #123', pullRequest),
    ).toBeDefined();
  });

  test('recognizes a cross-repository closing reference', () => {
    expect(
      githubIssuesProvider.findReference(
        'Closes other-org/other-project#456',
        pullRequest,
      ),
    ).toMatchObject({
      id: '456',
      owner: 'other-org',
      repo: 'other-project',
      display: 'other-org/other-project#456',
    });
  });

  test('rejects a casual issue reference and zero issue number', () => {
    expect(
      githubIssuesProvider.findReference('Related to #123', pullRequest),
    ).toBeUndefined();
    expect(
      githubIssuesProvider.findReference('Fixes #0', pullRequest),
    ).toBeUndefined();
  });

  test('matches a linked issue from the pull request repository', async () => {
    const reference = githubIssuesProvider.findReference(
      'Fixes #123',
      pullRequest,
    );
    const octokit = createOctokit([
      [
        {
          number: 123,
          repository_url: 'https://api.github.com/repos/octo-org/project',
        },
      ],
    ]);

    if (!reference) throw new Error('Expected a GitHub issue reference');
    await expect(
      githubIssuesProvider.isLinked(octokit, pullRequest, reference),
    ).resolves.toBe(true);
  });

  test('requires both the issue number and target repository to match', async () => {
    const reference = githubIssuesProvider.findReference(
      'Fixes other-org/other-project#123',
      pullRequest,
    );
    const octokit = createOctokit([
      [
        {
          number: 123,
          repository_url: 'https://api.github.com/repos/octo-org/project',
        },
      ],
    ]);

    if (!reference) throw new Error('Expected a GitHub issue reference');
    await expect(
      githubIssuesProvider.isLinked(octokit, pullRequest, reference),
    ).resolves.toBe(false);
  });

  test('checks subsequent linked-issue pages', async () => {
    const reference = githubIssuesProvider.findReference(
      'Fixes #123',
      pullRequest,
    );
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      number: index + 1000,
      repository_url: 'https://api.github.com/repos/octo-org/project',
    }));
    const octokit = createOctokit([
      firstPage,
      [
        {
          number: 123,
          repository_url: 'https://api.github.com/repos/octo-org/project',
        },
      ],
    ]);

    if (!reference) throw new Error('Expected a GitHub issue reference');
    await expect(
      githubIssuesProvider.isLinked(octokit, pullRequest, reference),
    ).resolves.toBe(true);
  });
});
