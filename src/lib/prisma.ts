import { PrismaClient } from "@/generated/prisma";

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
      console.log("✅ Database connected successfully");
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        console.error("🚫 All database connection attempts failed");
        throw error;
      }
      
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Initialize connection with retry logic
connectWithRetry().catch((error) => {
  console.error("Failed to establish database connection:", error);
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
    } catch (error: any) {
      // Check if it's a connection error
      const isConnectionError = 
        error?.message?.includes("Can't reach database server") ||
        error?.code === "P1001" ||
        error?.code === "P2024";

      if (!isConnectionError || i === retries - 1) {
        throw error;
      }

      console.log(`🔄 Retrying database operation (attempt ${i + 2}/${retries})...`);
      
      // Try to reconnect
      try {
        await prisma.$connect();
      } catch (connectError) {
        console.log("Reconnection failed, continuing with retry...");
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("All retry attempts failed");
}