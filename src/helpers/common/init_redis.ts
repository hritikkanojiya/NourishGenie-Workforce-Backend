// Import Packages
import * as redis from 'redis';
import { LOGGER } from './init_winston';
import { RedisConfig } from './environment';

const REDIS_URL = `redis://${RedisConfig.REDIS_HOST}:${RedisConfig.REDIS_PORT}`

// Establish Connection to Redis Server
const redisClient = redis.createClient({
  url: REDIS_URL,
  password: RedisConfig.REDIS_PASS,

});

redisClient.connect().catch((error: Error) => {
  LOGGER.error(`Error Connecting Redis Server.\n${error?.message}`);
  process.exit(0);
});

// Listen for Events
redisClient.on('connect', () => {
  LOGGER.info(`Application Connected to Redis Server.`);
});

redisClient.on('end', () => {
  LOGGER.info(`\nApplication Disconnected from Redis Server.`);
});

// Disconnect Redis Server before quitting Application
process.on('SIGINT', async () => {
  await redisClient.quit().catch((error: Error) => {
    LOGGER.error(error.message);
  });
});

// Export Connection
export { redisClient };
