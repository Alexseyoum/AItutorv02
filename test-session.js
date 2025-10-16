import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function test() {
  try {
    // First, let's see if there are any users in the database
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    if (userCount === 0) {
      console.log('No users found in the database');
      return;
    }
    
    // Get the first user
    const user = await prisma.user.findFirst();
    console.log('First user:', user.id);
    
    // Try to create a test session with a real user ID
    const session = await prisma.sATPracticeSession.create({
      data: {
        userId: user.id,
        section: 'math',
        score: 0,
        maxScore: 800,
        answers: {},
        timeSpent: 0
      }
    });
    
    console.log('Created test session:', session);
    
    // Clean up
    await prisma.sATPracticeSession.delete({
      where: { id: session.id }
    });
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();