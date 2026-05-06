import 'source-map-support/register';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

// Import models to register associations
import './models';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📚 Swagger docs at http://localhost:${env.PORT}/api-docs`);
      logger.info(`🏥 Health check at http://localhost:${env.PORT}/health`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });

    const exitGracefully = () => {
      logger.info('Shutting down server...');
      server.closeAllConnections();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      // Force exit after a very short timeout to ensure the port is freed
      setTimeout(() => process.exit(0), 100).unref();
    };

    process.on('SIGTERM', exitGracefully);
    process.on('SIGINT', exitGracefully);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
