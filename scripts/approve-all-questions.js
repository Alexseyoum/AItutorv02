// File: scripts/approve-all-questions.js
const { PrismaClient, QuestionStatus } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function approveAllQuestions() {
  try {
    console.log("Approving all questions in the database...");
    
    // Update all questions to have APPROVED status
    const result = await prisma.question.updateMany({
      where: {
        status: {
          not: QuestionStatus.APPROVED
        }
      },
      data: {
        status: QuestionStatus.APPROVED
      }
    });
    
    console.log(`✅ Updated ${result.count} questions to APPROVED status`);
    
    // Show current status counts
    const statusCounts = await prisma.question.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    
    console.log("Current status distribution:");
    statusCounts.forEach(count => {
      console.log(`  ${count.status}: ${count._count._all}`);
    });
    
    console.log("✅ All questions approved successfully!");
  } catch (error) {
    console.error("❌ Error approving questions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  approveAllQuestions()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { approveAllQuestions };