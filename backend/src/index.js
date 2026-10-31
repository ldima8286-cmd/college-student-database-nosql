import { env } from './env.js';
import { logger } from './logger.js';
import { initDb, disconnectDb } from './db.js';
import { seedUsers } from './seed.js';
import { app } from './app.js';

async function start() {
  try {
    await initDb();
    await seedUsers();
    logger.info(`MongoDB connected: ${env.MONGO_URI}`);

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDb().catch(() => {});
        logger.info('Server closed');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
