// File: scripts/admin-review.js
const { PrismaClient, QuestionStatus } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function reviewQuestions() {
  // Get questions that need review
  const questions = await prisma.question.findMany({
    where: { status: QuestionStatus.NEEDS_REVIEW },
    take: 10 // Limit to 10 for review
  });

  console.log(`Found ${questions.length} questions needing review:`);
  
  for (const question of questions) {
    console.log('\n--- Question for Review ---');
    console.log(`ID: ${question.id}`);
    console.log(`Subject: ${question.subject}`);
    console.log(`Topic: ${question.topic}`);
    console.log(`Difficulty: ${question.difficulty}`);
    console.log(`Question: ${question.question}`);
    console.log(`Choices: ${question.choices}`);
    console.log(`Answer: ${question.answer}`);
    console.log(`Explanation: ${question.explanation}`);
    console.log('---------------------------\n');
  }
}

reviewQuestions()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });