import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { createAuthHeader } from '../utils/auth';
import {
  GitHubResponse,
  GitHubUser,
  GitHubRepository,
  GitHubIssue,
  GitHubPullRequest,
  GitHubCommit,
  GitHubOrganization,
  Connection,
  UserQueryVariables,
  RepositoryQueryVariables,
  RepositoriesQueryVariables,
  IssuesQueryVariables,
  PullRequestsQueryVariables,
  CommitsQueryVariables,
  OrganizationQueryVariables
} from '../types/github';

/**
 * GitHub GraphQL API Service Client
 * Handles all interactions with the GitHub GraphQL API
 */
export class GitHubService {
  private client: AxiosInstance;
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.GITHUB_API_URL || 'https://api.github.com/graphql';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-GraphQL-API-Proxy/1.0.0'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.logRequest(
          config.method?.toUpperCase() || 'POST',
          config.url || '',
          config.headers,
          config.data
        );
        return config;
      },
      (error) => {
        logger.logError(error, 'Request interceptor');
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.logResponse(
          response.status,
          response.config.url || '',
          undefined,
          response.data
        );
        return response;
      },
      (error) => {
        if (error.response) {
          logger.logError(
            new Error(`HTTP ${error.response.status}: ${error.response.statusText}`),
            'API Response Error',
            {
              url: error.config?.url,
              status: error.response.status,
              data: error.response.data
            }
          );
        } else {
          logger.logError(error, 'Network Error');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute GraphQL query against GitHub API
   */
  private async executeQuery<T>(
    query: string,
    variables: any = {},
    token: string
  ): Promise<T> {
    try {
      const response: AxiosResponse<GitHubResponse<T>> = await this.client.post(
        '',
        {
          query,
          variables
        },
        {
          headers: createAuthHeader(token)
        }
      );

      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessage = response.data.errors
          .map(error => error.message)
          .join('; ');
        throw new Error(`GraphQL errors: ${errorMessage}`);
      }

      if (!response.data.data) {
        throw new Error('No data returned from GraphQL query');
      }

      return response.data.data;
    } catch (error) {
      logger.logError(
        error as Error,
        'GraphQL Query Execution',
        { query: query.substring(0, 200), variables }
      );
      throw error;
    }
  }

  /**
   * Get user by login
   */
  async getUser(variables: UserQueryVariables, token: string): Promise<GitHubUser> {
    const query = `
      query GetUser($login: String!) {
        user(login: $login) {
          id
          login
          name
          email
          bio
          avatarUrl
          url
          createdAt
          updatedAt
          followers {
            totalCount
          }
          following {
            totalCount
          }
          repositories {
            totalCount
          }
        }
      }
    `;

    const data = await this.executeQuery<{ user: GitHubUser }>(query, variables, token);
    return data.user;
  }

  /**
   * Get repository by owner and name
   */
  async getRepository(variables: RepositoryQueryVariables, token: string): Promise<GitHubRepository> {
    const query = `
      query GetRepository($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
          name
          nameWithOwner
          description
          url
          sshUrl
          cloneUrl
          homepageUrl
          isPrivate
          isFork
          isArchived
          isDisabled
          createdAt
          updatedAt
          pushedAt
          stargazerCount
          watcherCount
          forkCount
          primaryLanguage {
            name
            color
          }
          owner {
            id
            login
            ... on User {
              name
              email
              bio
              avatarUrl
              url
              createdAt
              updatedAt
            }
            ... on Organization {
              name
              description
              email
              websiteUrl
              avatarUrl
              url
              createdAt
              updatedAt
            }
          }
          defaultBranchRef {
            name
          }
        }
      }
    `;

    const data = await this.executeQuery<{ repository: GitHubRepository }>(query, variables, token);
    
    // Map nameWithOwner to fullName for consistency
    const repository = data.repository;
    if ('nameWithOwner' in repository) {
      (repository as any).fullName = (repository as any).nameWithOwner;
    }
    
    return repository;
  }

  /**
   * Get repositories for user or organization
   */
  async getRepositories(variables: RepositoriesQueryVariables, token: string): Promise<Connection<GitHubRepository>> {
    const query = `
      query GetRepositories($owner: String!, $first: Int!, $after: String, $orderBy: RepositoryOrder) {
        repositoryOwner(login: $owner) {
          repositories(first: $first, after: $after, orderBy: $orderBy) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            nodes {
              id
              name
              nameWithOwner
              description
              url
              sshUrl
              cloneUrl
              homepageUrl
              isPrivate
              isFork
              isArchived
              isDisabled
              createdAt
              updatedAt
              pushedAt
              stargazerCount
              watcherCount
              forkCount
              primaryLanguage {
                name
                color
              }
              owner {
                id
                login
                ... on User {
                  name
                  email
                  bio
                  avatarUrl
                  url
                  createdAt
                  updatedAt
                }
                ... on Organization {
                  name
                  description
                  email
                  websiteUrl
                  avatarUrl
                  url
                  createdAt
                  updatedAt
                }
              }
              defaultBranchRef {
                name
              }
            }
            edges {
              cursor
              node {
                id
                name
              }
            }
          }
        }
      }
    `;

    const data = await this.executeQuery<{ repositoryOwner: { repositories: Connection<GitHubRepository> } }>(
      query,
      variables,
      token
    );

    const repositories = data.repositoryOwner.repositories;
    
    // Map nameWithOwner to fullName for consistency
    repositories.nodes = repositories.nodes.map(repo => {
      if ('nameWithOwner' in repo) {
        (repo as any).fullName = (repo as any).nameWithOwner;
      }
      return repo;
    });

    return repositories;
  }

  /**
   * Get issues for a repository
   */
  async getIssues(variables: IssuesQueryVariables, token: string): Promise<Connection<GitHubIssue>> {
    const query = `
      query GetIssues($owner: String!, $repo: String!, $first: Int!, $after: String, $states: [IssueState!], $orderBy: IssueOrder) {
        repository(owner: $owner, name: $repo) {
          issues(first: $first, after: $after, states: $states, orderBy: $orderBy) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            nodes {
              id
              number
              title
              body
              state
              url
              createdAt
              updatedAt
              closedAt
              author {
                login
                ... on User {
                  id
                  name
                  email
                  bio
                  avatarUrl
                  url
                  createdAt
                  updatedAt
                }
              }
              assignees(first: 10) {
                totalCount
                nodes {
                  id
                  login
                  name
                  email
                  bio
                  avatarUrl
                  url
                  createdAt
                  updatedAt
                }
              }
              labels(first: 20) {
                totalCount
                nodes {
                  id
                  name
                  color
                  description
                }
              }
              repository {
                id
                name
                nameWithOwner
                url
                owner {
                  id
                  login
                }
              }
            }
            edges {
              cursor
              node {
                id
                number
              }
            }
          }
        }
      }
    `;

    const data = await this.executeQuery<{ repository: { issues: Connection<GitHubIssue> } }>(
      query,
      { ...variables, repo: variables.repo },
      token
    );

    return data.repository.issues;
  }

  /**
   * Get pull requests for a repository
   */
  async getPullRequests(variables: PullRequestsQueryVariables, token: string): Promise<Connection<GitHubPullRequest>> {
    const query = `
      query GetPullRequests($owner: String!, $repo: String!, $first: Int!, $after: String, $states: [PullRequestState!], $orderBy: IssueOrder) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: $first, after: $after, states: $states, orderBy: $orderBy) {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            nodes {
              id
              number
              title
              body
              state
              url
              createdAt
              updatedAt
              closedAt
              mergedAt
              isDraft
              mergeable
              author {
                login
                ... on User {
                  id
                  name
                  email
                  bio
                  avatarUrl
                  url
                  createdAt
                  updatedAt
                }
              }
              assignees(first: 10) {
                totalCount
                nodes {
                  id
                  login
                  name
                  email
                  bio
                  avatarUrl
                  url
                  createdAt
                  updatedAt
                }
              }
              reviewRequests(first: 10) {
                totalCount
              }
              reviews(first: 10) {
                totalCount
              }
              baseRef {
                name
              }
              headRef {
                name
              }
              repository {
                id
                name
                nameWithOwner
                url
                owner {
                  id
                  login
                }
              }
            }
            edges {
              cursor
              node {
                id
                number
              }
            }
          }
        }
      }
    `;

    const data = await this.executeQuery<{ repository: { pullRequests: Connection<GitHubPullRequest> } }>(
      query,
      { ...variables, repo: variables.repo },
      token
    );

    return data.repository.pullRequests;
  }

  /**
   * Get commits for a repository
   */
  async getCommits(variables: CommitsQueryVariables, token: string): Promise<Connection<GitHubCommit>> {
    const query = `
      query GetCommits($owner: String!, $repo: String!, $first: Int!, $after: String) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: $first, after: $after) {
                  totalCount
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                  nodes {
                    id
                    oid
                    message
                    messageHeadline
                    messageBody
                    url
                    committedDate
                    pushedDate
                    author {
                      name
                      email
                      date
                      user {
                        id
                        login
                        name
                        email
                        bio
                        avatarUrl
                        url
                        createdAt
                        updatedAt
                      }
                    }
                    committer {
                      name
                      email
                      date
                      user {
                        id
                        login
                        name
                        email
                        bio
                        avatarUrl
                        url
                        createdAt
                        updatedAt
                      }
                    }
                    additions
                    deletions
                    changedFiles
                  }
                  edges {
                    cursor
                    node {
                      id
                      oid
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.executeQuery<{
      repository: {
        defaultBranchRef: {
          target: {
            history: Connection<GitHubCommit>
          }
        }
      }
    }>(query, { ...variables, repo: variables.repo }, token);

    const commits = data.repository.defaultBranchRef.target.history;
    
    // Add repository reference to each commit
    commits.nodes = commits.nodes.map(commit => ({
      ...commit,
      repository: {
        id: '',
        name: variables.repo,
        fullName: `${variables.owner}/${variables.repo}`,
        url: `https://github.com/${variables.owner}/${variables.repo}`,
        owner: { login: variables.owner } as any
      } as any
    }));

    return commits;
  }

  /**
   * Get organization by login
   */
  async getOrganization(variables: OrganizationQueryVariables, token: string): Promise<GitHubOrganization> {
    const query = `
      query GetOrganization($login: String!) {
        organization(login: $login) {
          id
          login
          name
          description
          email
          websiteUrl
          avatarUrl
          url
          createdAt
          updatedAt
          repositories {
            totalCount
          }
          membersWithRole {
            totalCount
          }
        }
      }
    `;

    const data = await this.executeQuery<{ organization: GitHubOrganization }>(query, variables, token);
    
    // Map membersWithRole to members for consistency
    const organization = data.organization;
    if ('membersWithRole' in organization) {
      (organization as any).members = (organization as any).membersWithRole;
    }
    
    return organization;
  }

  /**
   * Health check - test API connectivity
   */
  async healthCheck(token: string): Promise<{ status: string; rateLimit?: any }> {
    const query = `
      query HealthCheck {
        rateLimit {
          limit
          remaining
          resetAt
          cost
        }
        viewer {
          login
        }
      }
    `;

    try {
      const data = await this.executeQuery<{ rateLimit: any; viewer: { login: string } }>(
        query,
        {},
        token
      );
      
      return {
        status: 'healthy',
        rateLimit: data.rateLimit
      };
    } catch (error) {
      logger.logError(error as Error, 'Health check failed');
      return {
        status: 'unhealthy'
      };
    }
  }
}