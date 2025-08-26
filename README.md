# GitHub GraphQL API

A GraphQL API proxy for GitHub GraphQL API built with Node.js, TypeScript, and Apollo Server. This service provides a customized GraphQL interface to interact with GitHub's data while maintaining authentication, rate limiting, and structured logging.

## Features

- 🚀 **GraphQL API** - Apollo Server with complete GitHub schema
- 🔐 **Authentication** - GitHub Personal Access Token support
- 📊 **Rate Limiting** - Respects GitHub API rate limits
- 🐳 **Docker Support** - Complete containerization setup
- 📈 **Logging** - Structured logging with development/production modes
- 🛡️ **Security** - CORS, Helmet, and input validation
- 🎭 **GraphQL Playground** - Interactive API explorer (development only)
- ✅ **Health Checks** - Built-in health monitoring

## API Schema

### Core Types

#### User
```graphql
type User {
  id: ID!
  login: String!
  name: String
  email: String
  bio: String
  avatarUrl: String
  url: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  followers: FollowerConnection!
  following: FollowingConnection!
  repositories: UserRepositoryConnection!
}
```

#### Repository
```graphql
type Repository {
  id: ID!
  name: String!
  fullName: String!
  description: String
  url: String!
  sshUrl: String!
  cloneUrl: String!
  homepageUrl: String
  isPrivate: Boolean!
  isFork: Boolean!
  isArchived: Boolean!
  isDisabled: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  pushedAt: DateTime
  stargazerCount: Int!
  watcherCount: Int!
  forkCount: Int!
  primaryLanguage: Language
  owner: RepositoryOwner!
  defaultBranchRef: Ref
}
```

#### Issue
```graphql
type Issue {
  id: ID!
  number: Int!
  title: String!
  body: String
  state: IssueState!
  url: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  closedAt: DateTime
  author: User
  assignees: AssigneeConnection!
  labels: LabelConnection!
  repository: Repository!
}
```

#### PullRequest
```graphql
type PullRequest {
  id: ID!
  number: Int!
  title: String!
  body: String
  state: PullRequestState!
  url: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  closedAt: DateTime
  mergedAt: DateTime
  isDraft: Boolean!
  mergeable: MergeableState!
  author: User
  assignees: AssigneeConnection!
  reviewRequests: ReviewRequestConnection!
  reviews: ReviewConnection!
  baseRef: Ref!
  headRef: Ref!
  repository: Repository!
}
```

### Available Queries

#### Get User
```graphql
query GetUser($login: String!) {
  user(login: $login) {
    id
    login
    name
    email
    bio
    avatarUrl
    followers {
      totalCount
    }
    repositories {
      totalCount
    }
  }
}
```

#### Get Repository
```graphql
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    fullName
    description
    url
    stargazerCount
    forkCount
    primaryLanguage {
      name
      color
    }
    owner {
      ... on User {
        login
        name
      }
      ... on Organization {
        login
        name
      }
    }
  }
}
```

#### Get Repositories
```graphql
query GetRepositories($owner: String!, $first: Int, $after: String) {
  repositories(owner: $owner, first: $first, after: $after) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      name
      description
      stargazerCount
      updatedAt
    }
  }
}
```

#### Get Issues
```graphql
query GetIssues($owner: String!, $repo: String!, $first: Int, $states: [IssueState!]) {
  issues(owner: $owner, repo: $repo, first: $first, states: $states) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
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

#### Get Pull Requests
```graphql
query GetPullRequests($owner: String!, $repo: String!, $first: Int) {
  pullRequests(owner: $owner, repo: $repo, first: $first) {
    totalCount
    nodes {
      id
      number
      title
      state
      isDraft
      createdAt
      author {
        login
      }
    }
  }
}
```

#### Get Commits
```graphql
query GetCommits($owner: String!, $repo: String!, $first: Int) {
  commits(owner: $owner, repo: $repo, first: $first) {
    totalCount
    nodes {
      id
      oid
      messageHeadline
      committedDate
      author {
        name
        email
        user {
          login
        }
      }
    }
  }
}
```

#### Health Check
```graphql
query HealthCheck {
  health {
    status
    timestamp
    rateLimit {
      limit
      remaining
      resetAt
    }
  }
}
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- GitHub Personal Access Token
- Docker (optional)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/nataliagranato/github-graphql-api.git
cd github-graphql-api
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Edit `.env` with your GitHub token:
```env
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_API_URL=https://api.github.com/graphql
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open GraphQL Playground: http://localhost:4000/graphql

### Production Build

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

### Docker Deployment

#### Development
```bash
docker-compose --profile dev up github-graphql-api-dev
```

#### Production
```bash
docker-compose up github-graphql-api
```

### Docker Build
```bash
# Build production image
docker build -t github-graphql-api .

# Run container
docker run -d \
  -p 4000:4000 \
  -e GITHUB_TOKEN=your_token_here \
  -e NODE_ENV=production \
  --name github-graphql-api \
  github-graphql-api
```

## Authentication

The API supports two authentication methods:

### 1. Environment Variable (Recommended for development)
Set the `GITHUB_TOKEN` environment variable:
```env
GITHUB_TOKEN=ghp_your_token_here
```

### 2. Authorization Header (Recommended for clients)
Include the token in the request header:
```http
Authorization: Bearer ghp_your_token_here
```

### Creating a GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with appropriate scopes:
   - `repo` (for private repositories)
   - `user` (for user information)
   - `read:org` (for organization data)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/graphql` | POST | Main GraphQL endpoint |
| `/graphql` | GET | GraphQL Playground (dev only) |
| `/health` | GET | Health check (REST) |
| `/api/info` | GET | API information |
| `/` | GET | API overview |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | - | **Required** GitHub Personal Access Token |
| `GITHUB_API_URL` | `https://api.github.com/graphql` | GitHub GraphQL API URL |
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:3000` | CORS allowed origins (comma-separated) |

### Pagination

All list queries support pagination with these parameters:
- `first`: Number of items to fetch (1-100, default: 20)
- `after`: Cursor for pagination

### Rate Limiting

The API respects GitHub's rate limiting:
- **Authenticated requests**: 5,000 requests per hour
- **GraphQL specific**: Complex queries consume more points

## Logging

The application uses structured logging:

- **Development**: Human-readable console output
- **Production**: JSON formatted logs

Log levels: `ERROR`, `WARN`, `INFO`, `DEBUG`

## Security Features

- **CORS**: Configurable origin restrictions
- **Helmet**: Security headers middleware
- **Input Validation**: GraphQL schema validation
- **Token Validation**: GitHub token format verification
- **Error Sanitization**: Production error filtering

## Health Monitoring

### Health Check Endpoint
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-26T13:30:00.000Z",
  "service": "github-graphql-api",
  "version": "1.0.0"
}
```

### GraphQL Health Query
```graphql
query {
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

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run linting (when configured)
- `npm test` - Run tests (when configured)

### Project Structure

```
src/
├── schema/
│   ├── typeDefs.ts      # GraphQL type definitions
│   └── resolvers.ts     # GraphQL resolvers
├── services/
│   └── githubService.ts # GitHub API client
├── types/
│   └── github.ts        # TypeScript type definitions
├── utils/
│   ├── auth.ts          # Authentication utilities
│   └── logger.ts        # Logging utilities
├── server.ts            # Apollo Server setup
└── index.ts             # Application entry point
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify GitHub token is valid
   - Check token permissions/scopes
   - Ensure token format is correct

2. **Rate Limiting**
   - Monitor rate limit in health check
   - Implement client-side caching
   - Use pagination for large datasets

3. **GraphQL Errors**
   - Check query syntax
   - Verify field availability
   - Review error messages in logs

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Submit a Pull Request

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- Create an [Issue](https://github.com/nataliagranato/github-graphql-api/issues) for bug reports
- Contribute via [Pull Requests](https://github.com/nataliagranato/github-graphql-api/pulls)
- Contact: [contato@nataliagranato.xyz](mailto:contato@nataliagranato.xyz)

---

Made with ❤️ by [Natália Granato](https://github.com/nataliagranato)
