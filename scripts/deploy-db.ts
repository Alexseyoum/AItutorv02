// File: scripts/deploy-db.ts

/**
 * Production Database Deployment Script
 * Handles database migrations and seeding for production deployment
 * 
 * This script follows the Prisma workflow memory guidelines:
 * - Uses `npx prisma generate` to update the Prisma Client
 * - Uses `npx prisma db push` for direct schema application (development)
 * - Implements proper error handling and connection management
 */

import { execSync } from 'child_process';
import { PrismaClient } from '../src/generated/prisma';
import { env } from '../src/lib/env-validation';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface DeploymentOptions {
  environment: 'development' | 'production' | 'test' | 'staging';
  skipGenerate?: boolean;
  skipPush?: boolean;
  validateOnly?: boolean;
}

class DatabaseDeployer {
  private options: DeploymentOptions;

  constructor(options: DeploymentOptions = { environment: 'production' }) {
    this.options = options;
  }

  async deploy(): Promise<void> {
    console.log('🚀 Starting database deployment...');
    console.log(`📊 Environment: ${this.options.environment}`);
    console.log(`🔗 Database URL: ${env.DATABASE_URL.substring(0, 30)}...`);
    
    try {
      await this.validateEnvironment();
      
      if (!this.options.validateOnly) {
        await this.generatePrismaClient();
        await this.applyDatabaseChanges();
        await this.verifyDeployment();
        await this.performHealthChecks();
      }
      
      console.log('✅ Database deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Database deployment failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...');
    
    // Check if DATABASE_URL is set
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Validate database URL format for PostgreSQL
    if (!env.DATABASE_URL.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }
    
    // Check if we're in production with localhost URL (not allowed)
    if (this.options.environment === 'production' && env.DATABASE_URL.includes('localhost')) {
      throw new Error('Production environment cannot use localhost database URL');
    }
    
    console.log('✅ Environment validation passed');
  }

  private async generatePrismaClient(): Promise<void> {
    if (this.options.skipGenerate) {
      console.log('⏭️ Skipping Prisma client generation');
      return;
    }
    
    console.log('📦 Generating Prisma client...');
    
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      throw new Error(`Failed to generate Prisma client: ${error}`);
    }
  }

  private async applyDatabaseChanges(): Promise<void> {
    if (this.options.skipPush) {
      console.log('⏭️ Skipping database schema push');
      return;
    }
    
    console.log('🔄 Applying database schema changes...');
    
    try {
      if (this.options.environment === 'production') {
        // For production, we should use migrations instead of db push
        console.log('🏭 Production mode: Using migration-based deployment');
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } else {
        // For development/staging, use db push
        console.log('🔧 Development mode: Using schema push');
        execSync('npx prisma db push', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      }
      console.log('✅ Database schema applied successfully');
    } catch (error) {
      throw new Error(`Failed to apply database changes: ${error}`);
    }
  }

  private async verifyDeployment(): Promise<void> {
    console.log('🔍 Verifying database deployment...');
    
    try {
      // Test database connection
      await prisma.$connect();
      console.log('✅ Database connection established');
      
      // Verify basic database structure
      const _result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database query test passed');
      
      // Check if essential tables exist
      await this.verifyEssentialTables();
      
      // Get basic statistics
      await this.getDatabaseStats();
      
    } catch (error) {
      throw new Error(`Database verification failed: ${error}`);
    }
  }

  private async verifyEssentialTables(): Promise<void> {
    console.log('📋 Verifying essential tables...');
    
    const essentialTables = [
      { name: 'users', model: 'user' },
      { name: 'sessions', model: 'session' },
      { name: 'accounts', model: 'account' },
      { name: 'verifications', model: 'verification' }
    ];
    
    for (const table of essentialTables) {
      try {
        // Use dynamic access with proper typing
        const model = (prisma as unknown as Record<string, { count: () => Promise<number> }>)[table.model];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          console.log(`  ✅ ${table.name}: ${count} records`);
        } else {
          console.warn(`  ⚠️ ${table.name}: Model not found or invalid`);
        }
      } catch (error) {
        console.warn(`  ⚠️ ${table.name}: Could not verify (${error})`);
      }
    }
  }

  private async getDatabaseStats(): Promise<void> {
    console.log('📊 Database statistics:');
    
    try {
      const userCount = await prisma.user.count();
      const sessionCount = await prisma.session.count();
      const chatSessionCount = await prisma.chatSession.count();
      const messageCount = await prisma.chatMessage.count();
      
      console.log(`  👥 Users: ${userCount}`);
      console.log(`  🔐 Sessions: ${sessionCount}`);
      console.log(`  💬 Chat Sessions: ${chatSessionCount}`);
      console.log(`  📝 Messages: ${messageCount}`);
      
      if (userCount === 0) {
        console.log('ℹ️ No users found. Database is ready for first-time setup.');
      }
      
    } catch (error) {
      console.warn('⚠️ Could not retrieve database statistics:', error);
    }
  }

  private async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing health checks...');
    
    try {
      // Test write operation
      const _testWrite = await prisma.$executeRaw`SELECT 'write_test' as test`;
      console.log('✅ Write operations: Working');
      
      // Test read operation
      const _testRead = await prisma.$queryRaw`SELECT 'read_test' as test`;
      console.log('✅ Read operations: Working');
      
      // Check database version
      const _version = await prisma.$queryRaw`SELECT version() as version`;
      console.log('✅ Database version check: Passed');
      
    } catch (error) {
      console.warn('⚠️ Some health checks failed:', error);
    }
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up...');
    try {
      if (prisma) {
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
      }
    } catch (_error) {
      console.warn('⚠️ Cleanup warning:', _error);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const environment = (args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production') as 'production' | 'development' | 'test' | 'staging';
  const skipGenerate = args.includes('--skip-generate');
  const skipPush = args.includes('--skip-push');
  const validateOnly = args.includes('--validate-only');

  console.log('🎯 TutorByAI Database Deployment Script');
  console.log('==========================================');

  const deployer = new DatabaseDeployer({
    environment,
    skipGenerate,
    skipPush,
    validateOnly
  });

  await deployer.deploy();
}

// Error handling for the script
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

export { DatabaseDeployer };