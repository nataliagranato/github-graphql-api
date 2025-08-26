// GitHub GraphQL API Types
export interface GitHubUser {
  id: string;
  login: string;
  name?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  followers: {
    totalCount: number;
  };
  following: {
    totalCount: number;
  };
  repositories: {
    totalCount: number;
  };
}

export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  sshUrl: string;
  cloneUrl: string;
  homepageUrl?: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
  stargazerCount: number;
  watcherCount: number;
  forkCount: number;
  primaryLanguage?: {
    name: string;
    color?: string;
  };
  owner: GitHubUser;
  defaultBranchRef?: {
    name: string;
  };
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  body?: string;
  state: 'OPEN' | 'CLOSED';
  url: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  author?: GitHubUser;
  assignees: {
    totalCount: number;
    nodes: GitHubUser[];
  };
  labels: {
    totalCount: number;
    nodes: Array<{
      id: string;
      name: string;
      color: string;
      description?: string;
    }>;
  };
  repository: GitHubRepository;
}

export interface GitHubPullRequest {
  id: string;
  number: number;
  title: string;
  body?: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  url: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
  isDraft: boolean;
  mergeable: 'MERGEABLE' | 'CONFLICTING' | 'UNKNOWN';
  author?: GitHubUser;
  assignees: {
    totalCount: number;
    nodes: GitHubUser[];
  };
  reviewRequests: {
    totalCount: number;
  };
  reviews: {
    totalCount: number;
  };
  baseRef: {
    name: string;
  };
  headRef: {
    name: string;
  };
  repository: GitHubRepository;
}

export interface GitHubCommit {
  id: string;
  oid: string;
  message: string;
  messageHeadline: string;
  messageBody?: string;
  url: string;
  committedDate: string;
  pushedDate?: string;
  author?: {
    name?: string;
    email?: string;
    date: string;
    user?: GitHubUser;
  };
  committer?: {
    name?: string;
    email?: string;
    date: string;
    user?: GitHubUser;
  };
  additions: number;
  deletions: number;
  changedFiles: number;
  repository: GitHubRepository;
}

export interface GitHubOrganization {
  id: string;
  login: string;
  name?: string;
  description?: string;
  email?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  repositories: {
    totalCount: number;
  };
  members: {
    totalCount: number;
  };
}

// Pagination types
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Connection<T> {
  totalCount: number;
  pageInfo: PageInfo;
  nodes: T[];
  edges: Array<{
    cursor: string;
    node: T;
  }>;
}

// API Response types
export interface GitHubResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    type?: string;
    path?: string[];
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

// Query variables types
export interface UserQueryVariables {
  login: string;
}

export interface RepositoryQueryVariables {
  owner: string;
  name: string;
}

export interface RepositoriesQueryVariables {
  owner: string;
  first: number;
  after?: string;
  orderBy?: {
    field: 'CREATED_AT' | 'UPDATED_AT' | 'PUSHED_AT' | 'NAME' | 'STARGAZERS';
    direction: 'ASC' | 'DESC';
  };
}

export interface IssuesQueryVariables {
  owner: string;
  repo: string;
  first: number;
  after?: string;
  states?: Array<'OPEN' | 'CLOSED'>;
  orderBy?: {
    field: 'CREATED_AT' | 'UPDATED_AT' | 'COMMENTS';
    direction: 'ASC' | 'DESC';
  };
}

export interface PullRequestsQueryVariables {
  owner: string;
  repo: string;
  first: number;
  after?: string;
  states?: Array<'OPEN' | 'CLOSED' | 'MERGED'>;
  orderBy?: {
    field: 'CREATED_AT' | 'UPDATED_AT';
    direction: 'ASC' | 'DESC';
  };
}

export interface CommitsQueryVariables {
  owner: string;
  repo: string;
  first: number;
  after?: string;
}

export interface OrganizationQueryVariables {
  login: string;
}