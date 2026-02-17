// GitHubService - GitHub API連携

import { Octokit } from '@octokit/rest';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants';
import type {
  GitHubFileTree,
  GitHubFileContent,
  GitHubRateLimit,
  GitHubTreeItem,
} from '../types/github.types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    if (!token) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'GitHub token is required',
        400
      );
    }
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * リポジトリのツリー構造を再帰的に取得
   */
  async getRepositoryTree(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<GitHubFileTree> {
    try {
      // ブランチのSHAを取得
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const sha = refData.object.sha;

      // ツリー構造を再帰的に取得
      const { data: treeData } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: sha,
        recursive: 'true', // 再帰的に全ファイルを取得
      });

      const tree: GitHubTreeItem[] = treeData.tree.map((item) => ({
        path: item.path || '',
        mode: item.mode || '',
        type: (item.type as 'blob' | 'tree') || 'blob',
        sha: item.sha || '',
        size: item.size,
      }));

      return {
        sha,
        tree,
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new AppError(
          ERROR_CODES.GITHUB_API_ERROR,
          `Repository or branch not found: ${owner}/${repo}@${branch}`,
          404,
          error.message
        );
      }
      if (error.status === 403) {
        throw new AppError(
          ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'GitHub API rate limit exceeded',
          429,
          error.message
        );
      }
      throw new AppError(
        ERROR_CODES.GITHUB_API_ERROR,
        `Failed to fetch repository tree: ${error.message}`,
        502,
        error
      );
    }
  }

  /**
   * 特定ファイルの内容を取得
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref: string = 'main'
  ): Promise<GitHubFileContent> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new AppError(
          ERROR_CODES.GITHUB_API_ERROR,
          `Path is not a file: ${path}`,
          400
        );
      }

      // Base64デコード
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      return {
        path: data.path,
        content,
        sha: data.sha,
        size: data.size,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error.status === 404) {
        throw new AppError(
          ERROR_CODES.GITHUB_API_ERROR,
          `File not found: ${path}`,
          404,
          error.message
        );
      }
      throw new AppError(
        ERROR_CODES.GITHUB_API_ERROR,
        `Failed to fetch file content: ${error.message}`,
        502,
        error
      );
    }
  }

  /**
   * Rate Limit情報を取得
   */
  async getRateLimit(): Promise<GitHubRateLimit> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: data.rate.reset,
        used: data.rate.used,
      };
    } catch (error: any) {
      throw new AppError(
        ERROR_CODES.GITHUB_API_ERROR,
        `Failed to fetch rate limit: ${error.message}`,
        502,
        error
      );
    }
  }

  /**
   * リポジトリの存在確認
   */
  async checkRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo });
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw new AppError(
        ERROR_CODES.GITHUB_API_ERROR,
        `Failed to check repository: ${error.message}`,
        502,
        error
      );
    }
  }

  /**
   * ブランチの存在確認
   */
  async checkBranch(owner: string, repo: string, branch: string): Promise<boolean> {
    try {
      await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw new AppError(
        ERROR_CODES.GITHUB_API_ERROR,
        `Failed to check branch: ${error.message}`,
        502,
        error
      );
    }
  }
}

/**
 * GitHubServiceのシングルトンインスタンスを取得
 */
export function getGitHubService(): GitHubService {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'GITHUB_TOKEN environment variable is not set',
      500
    );
  }
  return new GitHubService(token);
}
