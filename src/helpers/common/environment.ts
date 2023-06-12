import * as dotEnvConfig from 'dotenv-defaults/config';
import * as dotenvExpand from 'dotenv-expand';

dotenvExpand.expand(dotEnvConfig);

class Environment {
  public getEnvironmentString = (key: string): string => {
    return process.env[String(key)] || '';
  };

  public getEnvironmentNumber = (key: string): number => {
    return Number(process.env[String(key)] || '');
  };

  public getEnvironmentBoolean = (key: string): boolean => {
    return Boolean(process.env[String(key)] || '');
  };

  public getEnvironmentObject = (key: string): object => {
    return JSON.parse(process.env[String(key)] || '{}');
  };

  public getEnvironmentArray = (key: string): Array<object> => {
    return JSON.parse(process.env[String(key)] || '[]');
  };
}

const environment = new Environment();

const GlobalConfig = {
  ENVIRONMENT: environment.getEnvironmentString('NODE_ENV'),
  APP_BASE_PATH: environment.getEnvironmentString('APP_BASE_PATH'),
  APP_COOKIE_SECRET: environment.getEnvironmentString('APP_COOKIE_SECRET'),
  APP_FRONTEND: environment.getEnvironmentString('APP_FRONTEND'),
  IS_TEST: environment.getEnvironmentString('NODE_ENV') === 'test',
  IS_DEVELOPMENT: environment.getEnvironmentString('NODE_ENV') === 'development',
  IS_PRODUCTION: environment.getEnvironmentString('NODE_ENV') === 'production',
  LOGS_FOLDER: environment.getEnvironmentString('APP_BASE_PATH') + environment.getEnvironmentString('LOGS_FOLDER'),
  WINSTON_MAX_LOG_FILE_IN_DAYS: environment.getEnvironmentNumber('WINSTON_MAX_LOG_FILE_IN_DAYS'),
  WINSTON_MAX_LOG_FILE_SIZE_IN_MB: environment.getEnvironmentNumber('WINSTON_MAX_LOG_FILE_SIZE_IN_MB'),
  EXPORT_ACCESS_LOG_NAME: environment.getEnvironmentNumber('EXPORT_ACCESS_LOG_NAME'),
  EXPORT_ACCESS_LOG_CRON: environment.getEnvironmentString('EXPORT_ACCESS_LOG_CRON'),
  CRYPTO_ALGORITHM: environment.getEnvironmentString('CRYPTO_ALGORITHM'),
  CRYPTO_SECRET: environment.getEnvironmentString('CRYPTO_SECRET'),
  JWT_ACCESS_TOKEN_EXP_MINS: environment.getEnvironmentNumber('JWT_ACCESS_TOKEN_EXP_MINS'),
  JWT_ISSUER: environment.getEnvironmentString('JWT_ISSUER'),
  JWT_ACCESS_TOKEN_SECRET: environment.getEnvironmentString('JWT_ACCESS_TOKEN_SECRET'),
  JWT_REFRESH_TOKEN_SECRET: environment.getEnvironmentString('JWT_REFRESH_TOKEN_SECRET'),
  JWT_ACCESS_TOKEN_HEADER: environment.getEnvironmentString('JWT_ACCESS_TOKEN_HEADER'),
  JWT_REFRESH_TOKEN_HEADER: environment.getEnvironmentString('JWT_REFRESH_TOKEN_HEADER'),
  JWT_EXPIRES_IN: environment.getEnvironmentString('JWT_EXPIRES_IN'),
  JWT_SECRET_KEY: environment.getEnvironmentString('JWT_SECRET_KEY')
};

const MongoDBConfig = {
  MONGODB_USER: environment.getEnvironmentString('MONGODB_USER'),
  MONGODB_PASS: environment.getEnvironmentString('MONGODB_PASS'),
  MONGODB_DB_HOST: environment.getEnvironmentString('MONGODB_DB_HOST'),
  MONGODB_DB_PORT: environment.getEnvironmentString('MONGODB_DB_PORT'),
  MONGODB_DB_NAME: environment.getEnvironmentString('MONGODB_DB_NAME')
};

const MySQLDBConfig = {
  MYSQL_HOST: environment.getEnvironmentString('MYSQL_HOST'),
  MYSQL_DB_NAME: environment.getEnvironmentString('MYSQL_DB_NAME'),
  MYSQL_USER: environment.getEnvironmentString('MYSQL_USER'),
  MYSQL_PASS: environment.getEnvironmentString('MYSQL_PASS'),
  MYSQL_CONNECTION_STR: environment.getEnvironmentString('MYSQL_CONNECTION_STR')
};

const RedisConfig = {
  REDIS_HOST: environment.getEnvironmentString('REDIS_HOST'),
  REDIS_PASS: environment.getEnvironmentString('REDIS_PASS'),
  REDIS_PORT: environment.getEnvironmentString('REDIS_PORT')
};

export { GlobalConfig, MongoDBConfig, MySQLDBConfig, RedisConfig };
