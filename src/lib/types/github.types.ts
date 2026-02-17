// GitHub API関連の型定義

export interface GitHubFileTree {
  sha: string;
  tree: GitHubTreeItem[];
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface GitHubFileContent {
  path: string;
  content: string;
  sha: string;
  size: number;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
}

export interface GitHubRepositoryInfo {
  owner: string;
  repo: string;
  branch: string;
}
