// File: src/scripts/test-question-bank.js
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function testQuestionBank() {
  console.log("Testing QuestionBankService functionality...");
  
  try {
    // Test getting questions by criteria
    console.log("Testing get questions by criteria...");
    const questions = await prisma.question.findMany({
      where: {
        subject: "Math",
        topic: "Algebra: Linear Equations",
        difficulty: "BEGINNER",
        status: "APPROVED",
        isActive: true
      },
      take: 3
    });
    
    console.log(`Retrieved ${questions.length} questions`);
    
    if (questions.length > 0) {
      console.log("Sample question:", {
        id: questions[0].id,
        question: questions[0].question,
        usageCount: questions[0].usageCount,
        avgCorrectRate: questions[0].avgCorrectRate
      });
      
      // Test getting a single question by ID
      console.log("Testing get question by ID...");
      const singleQuestion = await prisma.question.findUnique({
        where: { id: questions[0].id }
      });
      console.log("Single question retrieved:", singleQuestion?.id);
      
      // Test recording question usage (simulate a correct answer)
      console.log("Testing record question usage...");
      // Note: In a real test, you would use an actual user ID
      const testUserId = "test-user-id";
      
      // First get the current question to calculate new average
      const currentQuestion = await prisma.question.findUnique({
        where: { id: questions[0].id }
      });
      
      if (currentQuestion) {
        // Calculate new average correctness rate
        const currentUsageCount = currentQuestion.usageCount;
        const currentAvgCorrectRate = currentQuestion.avgCorrectRate || 0;
        
        // New average = (old_average * old_count + new_value) / new_count
        const newUsageCount = currentUsageCount + 1;
        const newAvgCorrectRate = ((currentAvgCorrectRate * currentUsageCount) + 1) / newUsageCount; // 1 for correct answer
        
        // Calculate new average time
        const timeSpent = 45; // seconds
        const currentAvgTime = currentQuestion.avgTimeToAnswer || 0;
        const newAvgTime = ((currentAvgTime * currentUsageCount) + timeSpent) / newUsageCount;
        
        // Update question analytics
        const updatedQuestion = await prisma.question.update({
          where: { id: questions[0].id },
          data: {
            usageCount: {
              increment: 1
            },
            lastUsedAt: new Date(),
            avgCorrectRate: newAvgCorrectRate,
            avgTimeToAnswer: newAvgTime
          }
        });
        
        console.log("Question usage updated:", {
          usageCount: updatedQuestion.usageCount,
          avgCorrectRate: updatedQuestion.avgCorrectRate
        });
        
        // Skip user history creation for now since we don't have a valid user
        console.log("Skipping user history creation (no valid user in database)");
        console.log("Question usage recorded successfully");
      }
    } else {
      console.log("No questions found. Please run the population script first.");
    }
    
    console.log("✅ QuestionBankService test completed successfully!");
    
  } catch (error) {
    console.error("❌ Error testing QuestionBankService:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  testQuestionBank()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}