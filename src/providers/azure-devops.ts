import type {
  Octokit,
  PullRequestContext,
  WorkItemProvider,
  WorkItemReference,
} from './types';

const AB_PATTERN = /AB#(\d+)/g;
const AZURE_BOARDS_BOT = 'azure-boards[bot]';
const DOCS_URL =
  'https://learn.microsoft.com/en-us/azure/devops/boards/github/link-to-from-github?view=azure-devops#use-ab-mention-to-link-from-github-to-azure-boards-work-items';

export const azureDevOpsProvider: WorkItemProvider = {
  name: 'azuredevops',
  commentCodes: {
    success: 'lcc-200',
    missing: 'lcc-404',
    unlinked: 'lcc-416',
  },
  docsUrl: DOCS_URL,
  findReference(description: string, pullRequest: PullRequestContext) {
    const match = description.match(AB_PATTERN)?.[0];

    if (!match) {
      return undefined;
    }

    const id = match.substring(3);
    return {
      id,
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      display: `AB#${id}`,
    };
  },
  async isLinked(
    _octokit: Octokit,
    pullRequest: PullRequestContext,
    _reference: WorkItemReference,
  ) {
    return (
      pullRequest.description.includes('[AB#') &&
      pullRequest.description.includes('/_workitems/edit/')
    );
  },
  getMissingMessage() {
    return 'Description does not contain AB#{ID}';
  },
  getUnlinkedMessage(reference: WorkItemReference) {
    return `Description contains ${reference.display} but the Bot could not link it to an Azure Boards work item`;
  },
  getSuccessMessage(reference: WorkItemReference) {
    return `Work item link check complete. Description contains link ${reference.display} to an Azure Boards work item.`;
  },
  shouldWaitForLink(senderLogin: string) {
    return senderLogin === AZURE_BOARDS_BOT;
  },
  shouldDeleteFailureComment(senderLogin: string) {
    return senderLogin === AZURE_BOARDS_BOT;
  },
};
