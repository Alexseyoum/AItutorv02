// File: src/scripts/test-specific-topics.js
const { PrismaClient } = require('@prisma/client');

// Use relative path instead of alias
const { QuestionStatus } = require('../generated/prisma');

async function testSpecificTopics() {
  console.log("Testing specific topics that are failing...");
  
  // Initialize Prisma client
  const prisma = new PrismaClient();
  
  const topicsToTest = [
    "Reading Comprehension: History",
    "Reading Comprehension: Literature"
  ];
  
  try {
    for (const topic of topicsToTest) {
      console.log(`\nTesting topic: ${topic}`);
      
      // Test getting questions by criteria
      console.log("Testing getQuestionsByCriteria...");
      const questions = await prisma.question.findMany({
        where: {
          subject: "Reading",
          topic: topic,
          status: "APPROVED",
          isActive: true
        },
        take: 3,
        orderBy: [
          { usageCount: 'asc' },
          { lastUsedAt: 'asc' }
        ]
      });
      
      console.log(`Retrieved ${questions.length} questions for ${topic}`);
      
      if (questions.length > 0) {
        console.log("Sample question:", {
          id: questions[0].id,
          question: questions[0].question,
          usageCount: questions[0].usageCount,
          avgCorrectRate: questions[0].avgCorrectRate
        });
      } else {
        console.log(`No questions found for topic: ${topic}`);
      }
    }
    
    console.log("\n✅ Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Error testing specific topics:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  testSpecificTopics()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}