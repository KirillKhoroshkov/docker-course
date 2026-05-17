const { createClient } = require('redis');
const fs = require('fs');
const { createLogger } = require('../utils/logger');

const logger = createLogger('redis-service');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;
      let redisPassword = process.env.REDIS_PASSWORD;

      // Try to read password from Docker secrets
      const passwordFile = process.env.REDIS_PASSWORD_FILE || '/run/secrets/redis_password';
      if (!redisPassword && fs.existsSync(passwordFile)) {
        try {
          redisPassword = fs.readFileSync(passwordFile, 'utf8').trim();
          logger.info('Redis password loaded from secrets file');
        } catch (error) {
          logger.warn('Could not read Redis password from secrets file:', error.message);
        }
      }

      // Create Redis client configuration
      const clientConfig = {
        socket: {
          host: redisHost,
          port: redisPort,
          connectTimeout: 10000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            logger.warn(`Redis reconnection attempt ${retries}`);
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      };

      if (redisPassword) {
        clientConfig.password = redisPassword;
      }

      this.client = createClient(clientConfig);

      // Event handlers
      this.client.on('error', (error) => {
        logger.error('Redis Client Error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis Client ready to serve requests');
      });

      this.client.on('end', () => {
        logger.info('Redis Client connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis Client reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();
      
      logger.info(`Connected to Redis at ${redisHost}:${redisPort}`);
      return true;

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
        logger.info('Redis client disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  async healthCheck() {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }
      
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async get(key) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping get operation');
        return null;
      }
      
      const result = await this.client.get(key);
      logger.debug(`Redis GET ${key}: ${result ? 'HIT' : 'MISS'}`);
      return result;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping set operation');
        return false;
      }
      
      await this.client.set(key, value);
      logger.debug(`Redis SET ${key}: SUCCESS`);
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async setex(key, seconds, value) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping setex operation');
        return false;
      }
      
      await this.client.setEx(key, seconds, value);
      logger.debug(`Redis SETEX ${key} (${seconds}s): SUCCESS`);
      return true;
    } catch (error) {
      logger.error(`Redis SETEX error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping del operation');
        return false;
      }
      
      const result = await this.client.del(key);
      logger.debug(`Redis DEL ${key}: ${result} keys deleted`);
      return result > 0;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping exists operation');
        return false;
      }
      
      const result = await this.client.exists(key);
      logger.debug(`Redis EXISTS ${key}: ${result}`);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async incr(key) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping incr operation');
        return null;
      }
      
      const result = await this.client.incr(key);
      logger.debug(`Redis INCR ${key}: ${result}`);
      return result;
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      return null;
    }
  }

  async expire(key, seconds) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping expire operation');
        return false;
      }
      
      const result = await this.client.expire(key, seconds);
      logger.debug(`Redis EXPIRE ${key} (${seconds}s): ${result}`);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern) {
    try {
      if (!this.client || !this.isConnected) {
        logger.warn('Redis not connected, skipping keys operation');
        return [];
      }
      
      const result = await this.client.keys(pattern);
      logger.debug(`Redis KEYS ${pattern}: ${result.length} keys found`);
      return result;
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  // Helper method to safely execute Redis operations
  async safeExecute(operation, defaultValue = null) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, returning default value');
        return defaultValue;
      }
      return await operation();
    } catch (error) {
      logger.error('Redis operation failed:', error);
      return defaultValue;
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

module.exports = redisService;
