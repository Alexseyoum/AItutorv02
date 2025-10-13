// Test to check if we can get a session from the auth API
const { PrismaClient } = require('./src/generated/prisma');
const { auth } = require('./src/lib/auth');

async function test() {
  try {
    console.log('Auth object:', typeof auth);
    console.log('Auth API methods:', Object.keys(auth.api || {}));
  } catch (error) {
    console.error('Test error:', error);
  }
}

test();