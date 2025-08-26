import 'dotenv/config';
import { startApolloServer, createExpressApp } from './server';
import { logger } from './utils/logger';

// Validate required environment variables
function validateEnvironment(): void {
  const requiredEnvVars = ['GITHUB_TOKEN'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables', { missingVars });
    process.exit(1);
  }

  logger.info('Environment validation passed');
}

// Graceful shutdown handler
function setupGracefulShutdown(server: any): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    if (server?.stop) {
      await server.stop();
      logger.info('Apollo Server stopped');
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.logError(error, 'Uncaught Exception');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
  });
}

async function startServer(): Promise<void> {
  try {
    // Validate environment
    validateEnvironment();

    // Start Apollo Server
    logger.info('Starting Apollo Server...');
    const { url, server } = await startApolloServer();
    
    logger.info('Server started successfully', {
      url,
      environment: process.env.NODE_ENV || 'development',
      introspectionEnabled: process.env.NODE_ENV !== 'production'
    });

    // Log configuration
    logger.info('Server configuration', {
      githubApiUrl: process.env.GITHUB_API_URL || 'https://api.github.com/graphql',
      port: process.env.PORT || 4000
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    return new Promise(() => {}); // Keep the process running
  } catch (error) {
    logger.logError(error as Error, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.logError(error, 'Startup error');
    process.exit(1);
  });
}