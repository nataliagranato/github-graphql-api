import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';
import { GitHubService } from '../services/githubService';
import { getGitHubToken } from '../utils/auth';
import { logger } from '../utils/logger';

// GitHub service instance
const githubService = new GitHubService();

// DateTime scalar resolver
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date and time represented as ISO 8601 string',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      return value;
    }
    throw new Error('DateTime must be a Date object or ISO string');
  },
  parseValue(value: any) {
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new Error('DateTime must be a string');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error('DateTime must be a string');
  }
});

// Helper function to validate pagination parameters
function validatePagination(first?: number, after?: string) {
  if (first !== undefined) {
    if (first < 1 || first > 100) {
      throw new GraphQLError('first must be between 1 and 100', {
        extensions: { code: 'BAD_USER_INPUT' }
      });
    }
  }
}

// Helper function to get token from context
function getTokenFromContext(context: any): string {
  try {
    return getGitHubToken(context);
  } catch (error) {
    logger.logError(error as Error, 'Token extraction failed');
    throw new GraphQLError('Authentication required. Please provide a valid GitHub token.', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}

export const resolvers = {
  DateTime: DateTimeScalar,

  // Union type resolvers
  RepositoryOwner: {
    __resolveType(obj: any) {
      // Check if the object has organization-specific fields
      if (obj.membersWithRole || obj.members || obj.websiteUrl) {
        return 'Organization';
      }
      return 'User';
    }
  },

  Query: {
    // Get user by login
    async user(_: any, { login }: { login: string }, context: any) {
      const token = getTokenFromContext(context);
      
      try {
        logger.info('Fetching user', { login });
        const user = await githubService.getUser({ login }, token);
        logger.info('User fetched successfully', { login, userId: user.id });
        return user;
      } catch (error) {
        logger.logError(error as Error, 'Failed to fetch user', { login });
        throw error;
      }
    },

    // Get organization by login
    async organization(_: any, { login }: { login: string }, context: any) {
      const token = getTokenFromContext(context);
      
      try {
        logger.info('Fetching organization', { login });
        const organization = await githubService.getOrganization({ login }, token);
        logger.info('Organization fetched successfully', { login, orgId: organization.id });
        return organization;
      } catch (error) {
        logger.logError(error as Error, 'Failed to fetch organization', { login });
        throw error;
      }
    },

    // Get repository by owner and name
    async repository(_: any, { owner, name }: { owner: string; name: string }, context: any) {
      const token = getTokenFromContext(context);
      
      try {
        logger.info('Fetching repository', { owner, name });
        const repository = await githubService.getRepository({ owner, name }, token);
        logger.info('Repository fetched successfully', { owner, name, repoId: repository.id });
        return repository;
      } catch (error) {
        logger.logError(error as Error, 'Failed to fetch repository', { owner, name });
        throw error;
      }
    },

    // Get repositories for user or organization
    async repositories(
      _: any,
      { 
        owner,
        first = 20,
        after,
        orderBy
      }: {
        owner: string;
        first?: number;
        after?: string;
        orderBy?: any;
      },
      context: any
    ) {
      const token = getTokenFromContext(context);
      validatePagination(first, after);
      
      try {
        logger.info('Fetching repositories', { owner, first, after, orderBy });
        const repositories = await githubService.getRepositories(
          { owner, first, after, orderBy: orderBy as any },
          token
        );
        logger.info('Repositories fetched successfully', { 
          owner, 
          count: repositories.nodes.length,
          totalCount: repositories.totalCount 
        });
        return repositories;
      } catch (error) {
        logger.logError(error as Error, 'Failed to fetch repositories', { owner, first, after });
        throw error;
      }
    },

    // Get issues for repository
    async issues(
      _: any,
      {
        owner,
        repo,
        first = 20,
        after,
        states,
        orderBy
      }: {
        owner: string;
        repo: string;
        first?: number;
        after?: string;
        states?: any[];
        orderBy?: any;
      },
      context: any
    ) {
      const token = getTokenFromContext(context);
      validatePagination(first, after);
      
      try {
        logger.info('Fetching issues', { owner, repo, first, after, states, orderBy });
        const issues = await githubService.getIssues(
          { owner, repo, first, after, states: states as any, orderBy: orderBy as any },
          token
        );
        logger.info('Issues fetched successfully', { 
          owner, 
          repo,
          count: issues.nodes.length,
          totalCount: issues.totalCount 
        });
        return issues;
      } catch (error) {
        logger.logError(error as Error, 'Failed to fetch issues', { owner, repo, first, after });
        throw error;
      }
    },

    // Get pull requests for repository
    async pullRequests(
      _: any,
      {
        owner,
        repo,
        first = 20,
        after,
        states,
        orderBy
      }: {
        owner: string;
        repo: string;
        first?: number;
        after?: string;
        states?: any[];
        orderBy?: any;
      },
      context: any
    ) {
      const token = getTokenFromContext(context);
      validatePagination(first, after);
      
      try {
        logger.info('Fetching pull requests', { owner, repo, first, after, states, orderBy });
        const pullRequests = await githubService.getPullRequests(
          { owner, repo, first, after, states: states as any, orderBy: orderBy as any },
          token
        );
        logger.info('Pull requests fetched successfully', { 
          owner, 
          repo,
          count: pullRequests.nodes.length,
          totalCount: pullRequests.totalCount 
        });
        return pullRequests;
      } catch (error) {
        logger.logError(error as Error, 'Failed to fetch pull requests', { owner, repo, first, after });
        throw error;
      }
    },

    // Get commits for repository
    async commits(
      _: any,
      {
        owner,
        repo,
        first = 20,
        after
      }: {
        owner: string;
        repo: string;
        first?: number;
        after?: string;
      },
      context: any
    ) {
      const token = getTokenFromContext(context);
      validatePagination(first, after);
      
      try {
        logger.info('Fetching commits', { owner, repo, first, after });
        const commits = await githubService.getCommits(
          { owner, repo, first, after },
          token
        );
        logger.info('Commits fetched successfully', { 
          owner, 
          repo,
          count: commits.nodes.length,
          totalCount: commits.totalCount 
        });
        return commits;
      } catch (error) {
        logger.logError(error as Error, 'Failed to fetch commits', { owner, repo, first, after });
        throw error;
      }
    },

    // Health check
    async health(_: any, __: any, context: any) {
      try {
        const token = getTokenFromContext(context);
        const healthResult = await githubService.healthCheck(token);
        
        return {
          status: healthResult.status,
          timestamp: new Date().toISOString(),
          rateLimit: healthResult.rateLimit
        };
      } catch (error) {
        logger.logError(error as Error, 'Health check failed');
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          rateLimit: null
        };
      }
    }
  }
};