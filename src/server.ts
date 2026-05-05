import 'source-map-support/register';
import app from './app';
import { env } from './config/env';
import { connectDatabase, syncDatabase } from './config/database';
import { logger } from './config/logger';

// Import models to register associations
import './models';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Sync models (creates tables if not exist)
    await syncDatabase();

    // Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📚 Swagger docs at http://localhost:${env.PORT}/api-docs`);
      logger.info(`🏥 Health check at http://localhost:${env.PORT}/health`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
