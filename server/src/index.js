/**
 * GraphQL Server Entry Point
 */

import dotenv from 'dotenv';
import { startGraphQLServer } from './graphql/server.js';
import { validateEnvironment } from './config/validateEnv.js';
import { logger } from './shared/utils/utilities/Logger.js';
import { initializeFirebase } from './config/firebase.js';

// Load environment variables
dotenv.config({ override: true });

// Prevent EventEmitter memory leak warnings
process.setMaxListeners(20);

// Validate environment variables
validateEnvironment();

// Server configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main() {
  console.log('🚀 Starting server...');
  logger.info('Startup', {
    service: 'graphql-server',
    environment: NODE_ENV,
    port: PORT,
    timestamp: new Date().toISOString(),
  });

  try {
    // Initialize Firebase Admin SDK for FCM push notifications
    console.log('🔥 Initializing Firebase Admin SDK...');
    initializeFirebase();

    console.log('📦 Initializing GraphQL server...');
    await startGraphQLServer(PORT);

    // Process cleanup handlers
    process.on('SIGTERM', () => {
      logger.warn('Signal', { type: 'SIGTERM', ts: new Date().toISOString() });
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      logger.warn('Signal', { type: 'SIGINT', ts: new Date().toISOString() });
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('ServerStartupFailed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('UncaughtException', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UnhandledRejection', { reason: String(reason) });
  process.exit(1);
});

// Start server
main();
