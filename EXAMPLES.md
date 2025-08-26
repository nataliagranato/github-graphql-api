# GraphQL Query Examples

This document provides example queries for the GitHub GraphQL API proxy.

## Authentication

All queries require authentication via one of these methods:

### Environment Variable
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

### HTTP Header
```http
Authorization: Bearer ghp_your_token_here
```

## Basic Queries

### Health Check
```graphql
query HealthCheck {
  health {
    status
    timestamp
    rateLimit {
      limit
      remaining
      resetAt
      cost
    }
  }
}
```

### Get User Information
```graphql
query GetUser {
  user(login: "octocat") {
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
```

### Get Organization
```graphql
query GetOrganization {
  organization(login: "github") {
    id
    login
    name
    description
    email
    websiteUrl
    avatarUrl
    url
    createdAt
    repositories {
      totalCount
    }
    members {
      totalCount
    }
  }
}
```

## Repository Queries

### Get Single Repository
```graphql
query GetRepository {
  repository(owner: "github", name: "docs") {
    id
    name
    fullName
    description
    url
    sshUrl
    cloneUrl
    homepageUrl
    isPrivate
    isFork
    isArchived
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
      ... on User {
        login
        name
        email
      }
      ... on Organization {
        login
        name
        description
      }
    }
    defaultBranchRef {
      name
    }
  }
}
```

### Get User Repositories (with pagination)
```graphql
query GetUserRepositories {
  repositories(
    owner: "octocat"
    first: 10
    orderBy: { field: UPDATED_AT, direction: DESC }
  ) {
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
      fullName
      description
      url
      stargazerCount
      forkCount
      isPrivate
      updatedAt
      primaryLanguage {
        name
        color
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
```

### Get Organization Repositories
```graphql
query GetOrgRepositories {
  repositories(
    owner: "github"
    first: 20
    orderBy: { field: STARGAZERS, direction: DESC }
  ) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      name
      description
      stargazerCount
      forkCount
      primaryLanguage {
        name
      }
      updatedAt
    }
  }
}
```

## Issue Queries

### Get Repository Issues
```graphql
query GetRepositoryIssues {
  issues(
    owner: "github"
    repo: "docs"
    first: 10
    states: [OPEN]
    orderBy: { field: CREATED_AT, direction: DESC }
  ) {
    totalCount
    pageInfo {
      hasNextPage
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
          name
          email
          avatarUrl
        }
      }
      assignees {
        totalCount
        nodes {
          login
          name
        }
      }
      labels {
        totalCount
        nodes {
          id
          name
          color
          description
        }
      }
    }
  }
}
```

### Get All Issues (Open and Closed)
```graphql
query GetAllIssues {
  issues(
    owner: "microsoft"
    repo: "vscode"
    first: 5
    states: [OPEN, CLOSED]
  ) {
    totalCount
    nodes {
      number
      title
      state
      createdAt
      author {
        login
      }
    }
  }
}
```

## Pull Request Queries

### Get Repository Pull Requests
```graphql
query GetRepositoryPullRequests {
  pullRequests(
    owner: "facebook"
    repo: "react"
    first: 10
    states: [OPEN]
    orderBy: { field: CREATED_AT, direction: DESC }
  ) {
    totalCount
    pageInfo {
      hasNextPage
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
          name
          avatarUrl
        }
      }
      assignees {
        totalCount
        nodes {
          login
          name
        }
      }
      reviewRequests {
        totalCount
      }
      reviews {
        totalCount
      }
      baseRef {
        name
      }
      headRef {
        name
      }
    }
  }
}
```

### Get Merged Pull Requests
```graphql
query GetMergedPullRequests {
  pullRequests(
    owner: "vercel"
    repo: "next.js"
    first: 5
    states: [MERGED]
  ) {
    totalCount
    nodes {
      number
      title
      mergedAt
      author {
        login
      }
    }
  }
}
```

## Commit Queries

### Get Repository Commits
```graphql
query GetRepositoryCommits {
  commits(
    owner: "nodejs"
    repo: "node"
    first: 10
  ) {
    totalCount
    pageInfo {
      hasNextPage
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
          login
          name
          avatarUrl
        }
      }
      committer {
        name
        email
        date
        user {
          login
        }
      }
      additions
      deletions
      changedFiles
    }
  }
}
```

## Complex Queries

### Repository with Issues and PRs
```graphql
query GetRepositoryOverview {
  repository(owner: "microsoft", name: "TypeScript") {
    name
    description
    stargazerCount
    forkCount
    
    # Recent issues
    recentIssues: issues(first: 5, states: [OPEN]) {
      totalCount
      nodes {
        number
        title
        createdAt
        author {
          login
        }
      }
    }
    
    # Recent pull requests
    recentPRs: pullRequests(first: 5, states: [OPEN]) {
      totalCount
      nodes {
        number
        title
        createdAt
        author {
          login
        }
      }
    }
    
    # Recent commits
    recentCommits: commits(first: 5) {
      nodes {
        oid
        messageHeadline
        committedDate
        author {
          name
          user {
            login
          }
        }
      }
    }
  }
}
```

### User Profile with Repositories
```graphql
query GetUserProfile {
  user(login: "gaearon") {
    login
    name
    bio
    avatarUrl
    followers {
      totalCount
    }
    following {
      totalCount
    }
    
    # Popular repositories
    popularRepos: repositories(
      first: 5
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      nodes {
        name
        description
        stargazerCount
        primaryLanguage {
          name
        }
      }
    }
    
    # Recent repositories
    recentRepos: repositories(
      first: 5
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        name
        updatedAt
        pushedAt
      }
    }
  }
}
```

## Error Handling Examples

### Query with Variables
```graphql
query GetUserRepositories($login: String!, $first: Int = 10) {
  repositories(owner: $login, first: $first) {
    totalCount
    nodes {
      name
      stargazerCount
    }
  }
}
```

Variables:
```json
{
  "login": "octocat",
  "first": 5
}
```

### Handling Non-existent Resources
```graphql
query GetNonExistentUser {
  user(login: "this-user-does-not-exist-123456") {
    login
    name
  }
}
```

This will return `null` for the user field.

## Pagination Examples

### Forward Pagination
```graphql
query GetRepositoriesWithPagination($after: String) {
  repositories(
    owner: "facebook"
    first: 10
    after: $after
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      name
      updatedAt
    }
  }
}
```

For the next page, use the `endCursor` value as the `after` variable.

## Best Practices

1. **Use pagination** for large datasets
2. **Request only needed fields** to minimize response size
3. **Handle authentication errors** gracefully
4. **Check rate limits** in health queries
5. **Use variables** for dynamic queries
6. **Implement caching** for frequently accessed data

## Rate Limiting

Monitor your rate limit usage:

```graphql
query CheckRateLimit {
  health {
    rateLimit {
      limit
      remaining
      resetAt
      cost
    }
  }
}
```