// File: src/lib/redis-client.ts
import { Logger } from '@/lib/logger';

// Only initialize Redis client on the server side and not during build
let redisClient: any = null;
let redisInitialized = false;

// Function to initialize Redis client lazily
const initializeRedis = async () => {
  // Skip Redis initialization during build process
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  
  if (redisInitialized) return redisClient;
  
  if (typeof window === 'undefined' && process.env.REDIS_URL) {
    try {
      const { createClient } = await import('redis');
      
      // Create a Redis client
      redisClient = createClient({ url: process.env.REDIS_URL });

      // Connect to Redis
      redisClient.on('error', (err: Error) => {
        Logger.error('Redis Client Error', err);
      });

      await redisClient.connect();
      redisInitialized = true;
      Logger.info('Redis client initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize Redis client', error as Error);
      redisClient = null;
    }
  }
  
  return redisClient;
};

// Export a getter function instead of the client directly
export { initializeRedis, redisClient };