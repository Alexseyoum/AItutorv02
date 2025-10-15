// File: src/app/api/health/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EngagingTutorAgent } from "@/lib/ai/tutor-engine";

// Define proper types for our health check response
interface HealthCheckDetails {
  database?: {
    status: string;
    userCount?: number;
    connectionTime?: number;
    error?: string;
  };
  ai_providers?: {
    status: string;
    primary: string | null;
    fallbacks: string[];
    totalAvailable: number;
    testResponse: string;
    error?: string;
  };
  auth?: {
    status: string;
    providers: string[];
    error?: string;
  };
  memory?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

interface HealthCheckResponse {
  timestamp: string;
  status: 'healthy' | 'degraded';
  version: string;
  environment: string | undefined;
  checks: {
    database: boolean;
    ai_providers: boolean;
    auth: boolean;
  };
  details: HealthCheckDetails;
}

/**
 * Production Health Check Endpoint
 * Verifies all critical systems are operational
 */
export async function GET() {
  const healthChecks: HealthCheckResponse = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.CUSTOM_BUILD_ID || 'unknown',
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
      ai_providers: false,
      auth: false,
    },
    details: {}
  };

  try {
    // 1. Database Health Check
    console.log('🔍 Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    healthChecks.checks.database = true;
    healthChecks.details.database = {
      status: 'connected',
      userCount,
      connectionTime: Date.now()
    };
    console.log('✅ Database: Healthy');

  } catch (error) {
    console.error('❌ Database health check failed:', error);
    healthChecks.checks.database = false;
    healthChecks.details.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  try {
    // 2. AI Providers Health Check
    console.log('🔍 Checking AI providers...');
    const tutorAgent = new EngagingTutorAgent();
    const providers = tutorAgent.getAvailableProviders();
    
    // Check primary provider (Groq)
    const primaryProviderHealthy = providers.includes('groq');
    
    // Check fallback providers
    const fallbackProviders = [];
    if (providers.includes('huggingface')) {
      fallbackProviders.push('huggingface');
    }
    if (providers.includes('openrouter')) {
      fallbackProviders.push('openrouter');
    }
    
    if (providers.length > 0) {
      // Test a simple AI response with primary provider
      const testResponse = await tutorAgent.quickResponse("Health check test - respond with 'OK'");
      const responseHealthy = testResponse.toLowerCase().includes('ok');
      
      healthChecks.checks.ai_providers = responseHealthy;
      healthChecks.details.ai_providers = {
        status: 'available',
        primary: primaryProviderHealthy ? 'groq' : null,
        fallbacks: fallbackProviders,
        totalAvailable: providers.length,
        testResponse: testResponse.substring(0, 50) + (testResponse.length > 50 ? '...' : '')
      };
      console.log('✅ AI Providers: Healthy');
    } else {
      throw new Error('No AI providers available');
    }

  } catch (error) {
    console.error('❌ AI providers health check failed:', error);
    healthChecks.checks.ai_providers = false;
    healthChecks.details.ai_providers = {
      status: 'error',
      primary: null,
      fallbacks: [],
      totalAvailable: 0,
      testResponse: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  try {
    // 3. Auth System Health Check
    console.log('🔍 Checking authentication system...');
    // Simple check to ensure auth configuration is loaded
    const requiredEnvVars = [
      'GITHUB_CLIENT_ID',
      'GOOGLE_CLIENT_ID',
      'BETTER_AUTH_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      healthChecks.checks.auth = true;
      healthChecks.details.auth = {
        status: 'configured',
        providers: ['email', 'github', 'google']
      };
      console.log('✅ Authentication: Healthy');
    } else {
      throw new Error(`Missing auth environment variables: ${missingVars.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Auth health check failed:', error);
    healthChecks.checks.auth = false;
    healthChecks.details.auth = {
      status: 'error',
      providers: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Add memory usage monitoring
  try {
    const memoryUsage = process.memoryUsage();
    healthChecks.details.memory = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    };
    
    // Check if memory usage is within reasonable limits (less than 80% of max)
    const maxMemory = parseInt(process.env.NODE_OPTIONS?.match(/--max-old-space-size=(\d+)/)?.[1] || '0') || 1024;
    const memoryUsagePercent = (memoryUsage.heapUsed / (maxMemory * 1024 * 1024)) * 100;
    
    if (memoryUsagePercent > 80) {
      console.warn(`⚠️ High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
    }
    
    console.log(`🧠 Memory usage: ${healthChecks.details.memory.heapUsed}MB / ${maxMemory}MB (${memoryUsagePercent.toFixed(2)}%)`);
  } catch (error) {
    console.error('❌ Memory monitoring failed:', error);
  }

  // Determine overall health status
  const allHealthy = Object.values(healthChecks.checks).every(check => check === true);
  healthChecks.status = allHealthy ? 'healthy' : 'degraded';

  const statusCode = allHealthy ? 200 : 503;
  
  console.log(`🏥 Overall Health Status: ${healthChecks.status}`);
  
  return NextResponse.json(healthChecks, { status: statusCode });
}

// GET endpoint also supports HEAD requests for basic health checks
export const HEAD = GET;