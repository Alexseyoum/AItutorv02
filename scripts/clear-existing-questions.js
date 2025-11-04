// File: scripts/clear-existing-questions.js
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function clearExistingQuestions() {
  try {
    // Delete all questions from the database
    const deleteResult = await prisma.question.deleteMany({});
    
    console.log(`Successfully deleted ${deleteResult.count} existing questions from the database.`);
    console.log('The database is now empty and ready for new question population.');
  } catch (error) {
    console.error('Error clearing existing questions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearExistingQuestions();