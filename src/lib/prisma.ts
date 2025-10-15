import { PrismaClient } from "@/generated/prisma";
import { Logger } from "@/lib/logger";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma client with retry logic for Neon database
export const prisma =
  globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Enhanced connection function with retry logic
async function connectWithRetry(retries = 3, delay = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
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
}

// Initialize connection with retry logic
connectWithRetry().catch((error) => {
  Logger.error("Failed to establish database connection", error as Error);
});

// Add a helper function for executing queries with retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: unknown) {
      // Check if it's a connection error
      const isConnectionError = 
        (error instanceof Error && error?.message?.includes("Can't reach database server")) ||
        (error as { code?: string })?.code === "P1001" ||
        (error as { code?: string })?.code === "P2024";

      if (!isConnectionError || i === retries - 1) {
        throw error;
      }

      Logger.info(`🔄 Retrying database operation (attempt ${i + 2}/${retries})...`);
      
      // Try to reconnect
      try {
        await prisma.$connect();
      } catch (connectError) {
        Logger.info("Reconnection failed, continuing with retry...");
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("All retry attempts failed");
}
