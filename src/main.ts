import * as core from '@actions/core';
import * as github from '@actions/github';
import type { Context } from '@actions/github/lib/context';
import {
  getProvider,
  type Octokit,
  type PullRequestContext,
  type WorkItemProvider,
  type WorkItemReference,
} from './providers';

const DEPENDABOT_BOT = 'dependabot[bot]';

interface CommentInfo {
  code: string;
  id: number;
}

interface Comment {
  id: number;
  created_at: Date;
  body: string;
}

async function run(): Promise<void> {
  try {
    const context: Context = github.context;
    const githubToken = core.getInput('repo-token');
    const provider = getProvider(core.getInput('provider', { required: true }));
    const senderLogin: string = context.payload.sender?.login ?? '';

    console.log(senderLogin);

    if (senderLogin === DEPENDABOT_BOT) {
      console.log(`${DEPENDABOT_BOT} sender, exiting action.`);
      return;
    }

    if (
      context.eventName !== 'pull_request' &&
      context.eventName !== 'pull_request_target'
    ) {
      return;
    }

    const pullRequest: PullRequestContext = {
      number: context.payload.pull_request?.number ?? 0,
      description: context.payload.pull_request?.body ?? '',
      owner: context.payload.repository?.owner.login ?? '',
      repo: context.payload.repository?.name ?? '',
    };
    const octokit: Octokit = github.getOctokit(githubToken);
    const lastComment = await getLastComment(octokit, pullRequest, provider);
    console.log(`Last comment posted by action: ${lastComment.code}`);

    const reference = provider.findReference(
      pullRequest.description,
      pullRequest,
    );
    if (!reference) {
      await handleMissingWorkItem(octokit, pullRequest, provider, lastComment);
      return;
    }

    await handleWorkItemCheck(
      octokit,
      pullRequest,
      provider,
      reference,
      lastComment,
      senderLogin,
    );
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unexpected error while checking the linked work item.');
    }
  }
}

async function handleMissingWorkItem(
  octokit: Octokit,
  pullRequest: PullRequestContext,
  provider: WorkItemProvider,
  lastComment: CommentInfo,
): Promise<void> {
  const errorMessage = provider.getMissingMessage();
  console.log(errorMessage);

  if (lastComment.code !== provider.commentCodes.missing) {
    await createComment(
      octokit,
      pullRequest,
      `${errorMessage}\n\n[Click here](${provider.docsUrl}) to learn more.`,
      provider.commentCodes.missing,
    );
  }

  core.setFailed(errorMessage);
}

async function handleWorkItemCheck(
  octokit: Octokit,
  pullRequest: PullRequestContext,
  provider: WorkItemProvider,
  reference: WorkItemReference,
  lastComment: CommentInfo,
  senderLogin: string,
): Promise<void> {
  console.log(`${reference.display} found in pull request description.`);
  console.log('Checking whether the work item is linked ...');

  if (await provider.isLinked(octokit, pullRequest, reference)) {
    await handleSuccessfulLink(
      octokit,
      pullRequest,
      provider,
      reference,
      lastComment,
      senderLogin,
    );
    return;
  }

  await handleFailedLink(
    octokit,
    pullRequest,
    provider,
    reference,
    lastComment,
    senderLogin,
  );
}

async function handleSuccessfulLink(
  octokit: Octokit,
  pullRequest: PullRequestContext,
  provider: WorkItemProvider,
  reference: WorkItemReference,
  lastComment: CommentInfo,
  senderLogin: string,
): Promise<void> {
  console.log('Done.');

  if (
    lastComment.code === provider.commentCodes.unlinked &&
    provider.shouldDeleteFailureComment(senderLogin)
  ) {
    console.log(`Deleting last comment posted by action: ${lastComment.id}`);
    await octokit.rest.issues.deleteComment({
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      comment_id: lastComment.id,
    });
  }

  if (lastComment.code !== provider.commentCodes.success) {
    await createComment(
      octokit,
      pullRequest,
      `✅ ${provider.getSuccessMessage(reference)}`,
      provider.commentCodes.success,
    );
  }
}

async function handleFailedLink(
  octokit: Octokit,
  pullRequest: PullRequestContext,
  provider: WorkItemProvider,
  reference: WorkItemReference,
  lastComment: CommentInfo,
  senderLogin: string,
): Promise<void> {
  const errorMessage = provider.getUnlinkedMessage(reference);
  console.log(errorMessage);

  if (
    lastComment.code !== provider.commentCodes.unlinked &&
    !provider.shouldWaitForLink(senderLogin)
  ) {
    await createComment(
      octokit,
      pullRequest,
      `❌ Work item link check failed. ${errorMessage}\n\n[Click here](${provider.docsUrl}) to learn more.`,
      provider.commentCodes.unlinked,
    );
  }

  core.setFailed(errorMessage);
}

async function createComment(
  octokit: Octokit,
  pullRequest: PullRequestContext,
  body: string,
  code: string,
): Promise<void> {
  await octokit.rest.issues.createComment({
    owner: pullRequest.owner,
    repo: pullRequest.repo,
    issue_number: pullRequest.number,
    body: `${body}\n\n<!-- code: ${code} -->`,
  });
}

async function getLastComment(
  octokit: Octokit,
  pullRequest: PullRequestContext,
  provider: WorkItemProvider,
): Promise<CommentInfo> {
  try {
    const response = await octokit.rest.issues.listComments({
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      issue_number: pullRequest.number,
    });
    const comments: Comment[] = response.data.map((comment) => ({
      id: comment.id,
      created_at: new Date(comment.created_at),
      body: comment.body ?? '',
    }));

    comments.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    for (const comment of comments) {
      const code = Object.values(provider.commentCodes).find((commentCode) =>
        comment.body.includes(commentCode),
      );
      if (code) {
        return { code, id: comment.id };
      }
    }
  } catch (error) {
    console.log('Error fetching last comment:', error);
  }

  return { code: '', id: 0 };
}

run();
