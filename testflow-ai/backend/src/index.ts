import { createApp } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './db/pool.js';
import { startJobWorker } from './lib/jobs.js';
import { logger } from './lib/logger.js';

async function main(): Promise<void> {
  try {
    await checkDatabaseConnection();
    logger.info('database_connected');
  } catch (error) {
    logger.error('database_connection_failed', { message: (error as Error).message });
    process.exit(1);
  }

  startJobWorker();

  const app = createApp();
  app.listen(env.port, () => {
    logger.info('server_started', { port: env.port, nodeEnv: env.nodeEnv });
  });
}

main().catch((error) => {
  logger.error('startup_failed', { message: (error as Error).message });
  process.exit(1);
});
