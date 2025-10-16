// Test to check if we can get a session from the auth API
import { PrismaClient } from './src/generated/prisma';
import { auth } from './src/lib/auth';

async function test() {
  try {
    console.log('Auth object:', typeof auth);
    console.log('Auth API methods:', Object.keys(auth.api || {}));
  } catch (error) {
    console.error('Test error:', error);
  }
}

test();