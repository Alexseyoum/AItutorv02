import { PrismaClient } from "@/generated/prisma";
import { Logger } from "@/lib/logger";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Flag to track if we're currently connecting
let isConnecting = false;
// Flag to track if we're connected
let isConnected = false;

// Create Prisma client with enhanced connection settings
export const prisma =
  globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pooling settings for better stability
    transactionOptions: {
      isolationLevel: 'ReadCommitted',
    }
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Enhanced connection function with retry logic and connection validation
async function connectWithRetry(retries = 5, delay = 3000): Promise<void> {
  // If already connected, return immediately
  if (isConnected) {
    return;
  }
  
  // If already connecting, wait a bit and try again
  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return connectWithRetry(retries, delay);
  }
  
  isConnecting = true;
  
  try {
    for (let i = 0; i < retries; i++) {
      try {
        // Disconnect first to ensure clean state
        await prisma.$disconnect();
        await prisma.$connect();
        
        // Test the connection with a simple query
        await prisma.$queryRaw`SELECT 1`;
        
        isConnected = true;
        Logger.info("✅ Database connected successfully");
        return;
      } catch (error) {
        Logger.error(`❌ Database connection attempt ${i + 1} failed`, error as Error);
        
        if (i === retries - 1) {
          Logger.error("🚫 All database connection attempts failed", error as Error);
          throw error;
        }
        
        Logger.info(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } finally {
    isConnecting = false;
  }
}

// Initialize connection with retry logic
// Use immediate invocation but also handle async initialization
(async () => {
  try {
    await connectWithRetry();
  } catch (error) {
    Logger.error("Failed to establish database connection", error as Error);
  }
})();

// Add a helper function for executing queries with retry and connection validation
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 5,
  delay = 3000
): Promise<T> {
  // Ensure we're connected before executing any operations
  await ensureConnected();
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      // Check if it's a connection error
      const isConnectionError = 
        (error instanceof Error && (error?.message?.includes("Can't reach database server") ||
                                   error?.message?.includes("An existing connection was forcibly closed by the remote host") ||
                                   error?.message?.includes("Connection terminated") ||
                                   error?.message?.includes("timeout expired") ||
                                   error?.message?.includes("Engine is not yet connected"))) ||
        (error as { code?: string })?.code === "P1001" ||
        (error as { code?: string })?.code === "P2024";

      if (!isConnectionError || i === retries - 1) {
        throw error;
      }

      Logger.info(`🔄 Retrying database operation (attempt ${i + 2}/${retries})...`);
      
      // Try to reconnect
      try {
        isConnected = false;
        await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause before reconnect
        await connectWithRetry();
      } catch (_connectError) {
        Logger.info("Reconnection failed, continuing with retry...");
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("All retry attempts failed");
}

// Add a function to ensure the client is connected before queries
export async function ensureConnected(): Promise<void> {
  // If already connected, return immediately
  if (isConnected) {
    return;
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
  } catch (_error) {
    // Connection is not valid, try to reconnect
    Logger.info("Ensuring database connection...");
    isConnected = false;
    await prisma.$disconnect();
    await new Promise(resolve => setTimeout(resolve, 500));
    await connectWithRetry();
  }
}

// Graceful shutdown for Vercel serverless functions
process.on('beforeExit', async () => {
  isConnected = false;
  await prisma.$disconnect();
});

// Export the functions for use in other modules
export { connectWithRetry };