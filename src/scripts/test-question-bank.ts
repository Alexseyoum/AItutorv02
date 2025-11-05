// File: src/scripts/test-question-bank.ts
import { QuestionBankService } from "@/lib/question-bank";

async function testQuestionBank() {
  console.log("Testing QuestionBankService...");
  
  try {
    // Test getting questions by criteria
    console.log("Testing getQuestionsByCriteria...");
    const questions = await QuestionBankService.getQuestionsByCriteria(
      "Math", 
      "Algebra: Linear Equations", 
      "INTERMEDIATE", 
      3
    );
    
    console.log(`Retrieved ${questions.length} questions`);
    
    if (questions.length > 0) {
      console.log("Sample question:", {
        id: questions[0].id,
        question: questions[0].question,
        usageCount: questions[0].usageCount,
        avgCorrectRate: questions[0].avgCorrectRate
      });
      
      // Test getting a single question by ID
      console.log("Testing getQuestionById...");
      const singleQuestion = await QuestionBankService.getQuestionById(questions[0].id);
      console.log("Single question retrieved:", singleQuestion?.id);
      
      // Test recording question usage (simulate a correct answer)
      console.log("Testing recordQuestionUsage...");
      // Note: In a real test, you would use an actual user ID
      const testUserId = "test-user-id";
      await QuestionBankService.recordQuestionUsage(
        questions[0].id,
        testUserId,
        true, // wasCorrect
        45, // timeSpent in seconds
        "Math",
        "Algebra: Linear Equations",
        "INTERMEDIATE"
      );
      
      console.log("Question usage recorded successfully");
    } else {
      console.log("No questions found. Please run the population script first.");
    }
    
    console.log("✅ QuestionBankService test completed successfully!");
    
  } catch (error) {
    console.error("❌ Error testing QuestionBankService:", error);
    throw error;
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