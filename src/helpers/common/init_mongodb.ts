// Import Packages
import mongoose from 'mongoose';
import { LOGGER } from './init_winston';
import { MongoDBConfig } from './environment';

// Establish Connection to MongoDB Server
mongoose
  .set('strictQuery', false)
  .connect(`mongodb://${MongoDBConfig.MONGODB_DB_HOST}:${MongoDBConfig.MONGODB_DB_PORT}`, {
    dbName: MongoDBConfig.MONGODB_DB_NAME,
    user: MongoDBConfig.MONGODB_USER,
    pass: MongoDBConfig.MONGODB_PASS
  })
  .catch((error: Error) => {
    LOGGER.error(error.message);
    process.exit(0);
  });

// mongoose
//   .set('strictQuery', false)
//   .connect('mongodb://localhost:27017/test')
//   .catch((error: Error) => {
//     LOGGER.error(error.message);
//     process.exit(0);
//   });

// Create connection Object & Listen for Events
const mongoConnection = mongoose.connection;

mongoConnection.on('connected', () => {
  LOGGER.info('Application Connected to MongoDB Server.');
});

mongoConnection.on('disconnected', () => {
  LOGGER.info('Application Disconnected from MongoDB Server.');
});

// Disconnect MongoDB Server before quitting Application
process.on('SIGINT', async () => {
  await mongoConnection.close().catch(error => {
    LOGGER.error(error.message);
  });
});

// Export Connection
export { mongoConnection };
