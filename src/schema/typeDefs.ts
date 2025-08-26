import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar DateTime

  # User type represents a GitHub user
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

  # Organization type represents a GitHub organization
  type Organization {
    id: ID!
    login: String!
    name: String
    description: String
    email: String
    websiteUrl: String
    avatarUrl: String
    url: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    repositories: OrganizationRepositoryConnection!
    members: MemberConnection!
  }

  # Repository type represents a GitHub repository
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

  # Language type represents a programming language
  type Language {
    name: String!
    color: String
  }

  # Ref type represents a git reference
  type Ref {
    name: String!
  }

  # Union type for repository owner (User or Organization)
  union RepositoryOwner = User | Organization

  # Issue type represents a GitHub issue
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

  # Issue state enumeration
  enum IssueState {
    OPEN
    CLOSED
  }

  # Label type represents an issue/PR label
  type Label {
    id: ID!
    name: String!
    color: String!
    description: String
  }

  # Pull request type represents a GitHub pull request
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

  # Pull request state enumeration
  enum PullRequestState {
    OPEN
    CLOSED
    MERGED
  }

  # Mergeable state enumeration
  enum MergeableState {
    MERGEABLE
    CONFLICTING
    UNKNOWN
  }

  # Commit type represents a git commit
  type Commit {
    id: ID!
    oid: String!
    message: String!
    messageHeadline: String!
    messageBody: String
    url: String!
    committedDate: DateTime!
    pushedDate: DateTime
    author: GitActor
    committer: GitActor
    additions: Int!
    deletions: Int!
    changedFiles: Int!
    repository: Repository!
  }

  # Git actor type represents commit author/committer
  type GitActor {
    name: String
    email: String
    date: DateTime!
    user: User
  }

  # Connection types for pagination
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type FollowerConnection {
    totalCount: Int!
  }

  type FollowingConnection {
    totalCount: Int!
  }

  type UserRepositoryConnection {
    totalCount: Int!
  }

  type OrganizationRepositoryConnection {
    totalCount: Int!
  }

  type MemberConnection {
    totalCount: Int!
  }

  type RepositoryConnection {
    totalCount: Int!
    pageInfo: PageInfo!
    nodes: [Repository!]!
    edges: [RepositoryEdge!]!
  }

  type RepositoryEdge {
    cursor: String!
    node: Repository!
  }

  type IssueConnection {
    totalCount: Int!
    pageInfo: PageInfo!
    nodes: [Issue!]!
    edges: [IssueEdge!]!
  }

  type IssueEdge {
    cursor: String!
    node: Issue!
  }

  type PullRequestConnection {
    totalCount: Int!
    pageInfo: PageInfo!
    nodes: [PullRequest!]!
    edges: [PullRequestEdge!]!
  }

  type PullRequestEdge {
    cursor: String!
    node: PullRequest!
  }

  type CommitConnection {
    totalCount: Int!
    pageInfo: PageInfo!
    nodes: [Commit!]!
    edges: [CommitEdge!]!
  }

  type CommitEdge {
    cursor: String!
    node: Commit!
  }

  type AssigneeConnection {
    totalCount: Int!
    nodes: [User!]!
  }

  type LabelConnection {
    totalCount: Int!
    nodes: [Label!]!
  }

  type ReviewRequestConnection {
    totalCount: Int!
  }

  type ReviewConnection {
    totalCount: Int!
  }

  # Order by enums
  enum RepositoryOrderField {
    CREATED_AT
    UPDATED_AT
    PUSHED_AT
    NAME
    STARGAZERS
  }

  enum IssueOrderField {
    CREATED_AT
    UPDATED_AT
    COMMENTS
  }

  enum OrderDirection {
    ASC
    DESC
  }

  # Input types for ordering
  input RepositoryOrder {
    field: RepositoryOrderField!
    direction: OrderDirection!
  }

  input IssueOrder {
    field: IssueOrderField!
    direction: OrderDirection!
  }

  # Health check type
  type HealthStatus {
    status: String!
    timestamp: DateTime!
    rateLimit: RateLimit
  }

  type RateLimit {
    limit: Int!
    remaining: Int!
    resetAt: DateTime!
    cost: Int
  }

  # Root Query type
  type Query {
    # Get user by login
    user(login: String!): User

    # Get organization by login
    organization(login: String!): Organization

    # Get repository by owner and name
    repository(owner: String!, name: String!): Repository

    # Get repositories for a user or organization
    repositories(
      owner: String!
      first: Int = 20
      after: String
      orderBy: RepositoryOrder
    ): RepositoryConnection

    # Get issues for a repository
    issues(
      owner: String!
      repo: String!
      first: Int = 20
      after: String
      states: [IssueState!]
      orderBy: IssueOrder
    ): IssueConnection

    # Get pull requests for a repository
    pullRequests(
      owner: String!
      repo: String!
      first: Int = 20
      after: String
      states: [PullRequestState!]
      orderBy: IssueOrder
    ): PullRequestConnection

    # Get commits for a repository
    commits(
      owner: String!
      repo: String!
      first: Int = 20
      after: String
    ): CommitConnection

    # Health check endpoint
    health: HealthStatus!
  }
`;