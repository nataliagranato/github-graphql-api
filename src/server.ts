import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLFormattedError, GraphQLError } from 'graphql';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { logger } from './utils/logger';

export interface ServerContext {
  req?: Request;
  res?: Response;
  token?: string;
}

/**
 * Create and configure Apollo Server
 */
export async function createApolloServer(): Promise<ApolloServer<ServerContext>> {
  const server = new ApolloServer<ServerContext>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
    formatError: (formattedError: GraphQLFormattedError, error: unknown) => {
      // Log the error
      logger.logError(error as Error, 'GraphQL Error', {
        operationName: formattedError.extensions?.operationName,
        variables: formattedError.extensions?.variables
      });

      // Return sanitized error in production
      if (process.env.NODE_ENV === 'production') {
        return {
          message: formattedError.message,
          locations: formattedError.locations,
          path: formattedError.path,
          extensions: {
            code: formattedError.extensions?.code || 'INTERNAL_ERROR'
          }
        };
      }

      return formattedError;
    },
    plugins: [
      // Request logging plugin
      {
        async requestDidStart() {
          return {
            async didReceiveRequest(requestContext: any) {
              logger.info('GraphQL Request', {
                query: requestContext.request.query?.substring(0, 200),
                variables: requestContext.request.variables,
                operationName: requestContext.request.operationName
              });
            },
            async didResolveOperation(requestContext: any) {
              logger.debug('GraphQL Operation', {
                operationName: requestContext.operationName,
                operation: requestContext.operation?.operation
              });
            },
            async didSendResponse(requestContext: any) {
              const response = requestContext.response;
              logger.info('GraphQL Response', {
                operationName: requestContext.operationName,
                errors: response.body.kind === 'single' ? response.body.singleResult.errors?.length : 0,
                hasData: response.body.kind === 'single' ? !!response.body.singleResult.data : false
              });
            },
            async didEncounterErrors(requestContext: any) {
              logger.error('GraphQL Errors', {
                operationName: requestContext.operationName,
                errors: requestContext.errors.map((error: any) => ({
                  message: error.message,
                  path: error.path,
                  locations: error.locations
                }))
              });
            }
          };
        }
      }
    ]
  });

  return server;
}

/**
 * Create Express application with middleware
 */
export function createExpressApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));

  // Basic middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint (REST)
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'github-graphql-api',
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API info endpoint
  app.get('/api/info', (req, res) => {
    res.json({
      name: 'GitHub GraphQL API Proxy',
      version: process.env.npm_package_version || '1.0.0',
      description: 'A GraphQL API proxy for GitHub GraphQL API',
      endpoints: {
        graphql: '/graphql',
        playground: process.env.NODE_ENV !== 'production' ? '/graphql' : null,
        health: '/health'
      },
      documentation: {
        schema: 'Available via GraphQL introspection',
        examples: 'See README.md for query examples'
      }
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'GitHub GraphQL API Proxy',
      version: process.env.npm_package_version || '1.0.0',
      endpoints: {
        graphql: '/graphql',
        health: '/health',
        info: '/api/info'
      }
    });
  });

  return app;
}

/**
 * Start Apollo Server with standalone setup
 */
export async function startApolloServer(): Promise<{ url: string; server: ApolloServer<ServerContext> }> {
  const server = await createApolloServer();
  
  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.PORT) || 4000 },
    context: async ({ req }): Promise<ServerContext> => {
      return {
        req: req as Request,
        token: req?.headers?.authorization?.replace('Bearer ', '')
      };
    },
  });

  return { url, server };
}