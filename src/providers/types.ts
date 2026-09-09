import type { GitHub } from '@actions/github/lib/utils';

export type Octokit = InstanceType<typeof GitHub>;

export interface PullRequestContext {
  number: number;
  description: string;
  owner: string;
  repo: string;
}

export interface WorkItemReference {
  id: string;
  owner: string;
  repo: string;
  display: string;
}

export interface CommentCodes {
  success: string;
  missing: string;
  unlinked: string;
}

export interface WorkItemProvider {
  readonly name: 'azuredevops' | 'github';
  readonly commentCodes: CommentCodes;
  readonly docsUrl: string;
  findReference(
    description: string,
    pullRequest: PullRequestContext,
  ): WorkItemReference | undefined;
  isLinked(
    octokit: Octokit,
    pullRequest: PullRequestContext,
    reference: WorkItemReference,
  ): Promise<boolean>;
  getMissingMessage(): string;
  getUnlinkedMessage(reference: WorkItemReference): string;
  getSuccessMessage(reference: WorkItemReference): string;
  shouldWaitForLink(senderLogin: string): boolean;
  shouldDeleteFailureComment(senderLogin: string): boolean;
}
