import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function test() {
  try {
    // Test if we can access the SATPracticeSession model
    const count = await prisma.sATPracticeSession.count();
    console.log(`SATPracticeSession count: ${count}`);
    
    // Try to create a test session
    const session = await prisma.sATPracticeSession.create({
      data: {
        userId: 'test-user-id',
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
    console.error('Prisma test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();