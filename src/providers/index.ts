import { azureDevOpsProvider } from './azure-devops';
import { githubIssuesProvider } from './github-issues';
import type { WorkItemProvider } from './types';

export { azureDevOpsProvider } from './azure-devops';
export { githubIssuesProvider } from './github-issues';

export type ProviderName = WorkItemProvider['name'];

const providers: Record<ProviderName, WorkItemProvider> = {
  azuredevops: azureDevOpsProvider,
  github: githubIssuesProvider,
};

export function getProvider(input: string): WorkItemProvider {
  const provider = providers[input.toLowerCase() as ProviderName];

  if (!provider) {
    throw new Error(
      `Invalid provider '${input}'. Supported providers are: azuredevops, github.`,
    );
  }

  return provider;
}

export type {
  CommentCodes,
  Octokit,
  PullRequestContext,
  WorkItemProvider,
  WorkItemReference,
} from './types';
