import { GraphQLError } from 'graphql';

/**
 * Validates GitHub token format
 */
export function validateGitHubToken(token: string): boolean {
  if (!token) {
    return false;
  }

  // GitHub personal access tokens start with 'ghp_' (new format) or are 40 characters alphanumeric (classic)
  const newTokenPattern = /^ghp_[a-zA-Z0-9]{36}$/;
  const classicTokenPattern = /^[a-f0-9]{40}$/;
  
  return newTokenPattern.test(token) || classicTokenPattern.test(token);
}

/**
 * Creates authorization header for GitHub API requests
 */
export function createAuthHeader(token: string): { Authorization: string } {
  if (!validateGitHubToken(token)) {
    throw new GraphQLError('Invalid GitHub token format', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Extracts token from Authorization header
 */
export function extractTokenFromHeader(authorization?: string): string {
  if (!authorization) {
    throw new GraphQLError('Authorization header required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) {
    throw new GraphQLError('Invalid authorization header format. Expected: Bearer <token>', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  const token = match[1];
  if (!validateGitHubToken(token)) {
    throw new GraphQLError('Invalid GitHub token format', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  return token;
}

/**
 * Gets GitHub token from environment or context
 */
export function getGitHubToken(context?: { req?: { headers?: { authorization?: string } } }): string {
  // First try to get token from request headers
  if (context?.req?.headers?.authorization) {
    try {
      return extractTokenFromHeader(context.req.headers.authorization);
    } catch {
      // Fall back to environment variable if header token is invalid
    }
  }

  // Fall back to environment variable
  const envToken = process.env.GITHUB_TOKEN;
  if (!envToken) {
    throw new GraphQLError('GitHub token not provided. Set GITHUB_TOKEN environment variable or include Authorization header', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  if (!validateGitHubToken(envToken)) {
    throw new GraphQLError('Invalid GitHub token in environment variable', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  return envToken;
}