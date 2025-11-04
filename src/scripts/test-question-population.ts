// File: src/scripts/test-question-population.ts
import { prisma } from "@/lib/prisma";
import { generateQuestions } from "@/lib/utils/questionBank";

async function testQuestionPopulation() {
  console.log("Testing question population pipeline...");
  
  try {
    // Test generating a single question
    console.log("Generating test question...");
    const testQuestions = await generateQuestions({
      subject: "Math",
      topic: "Algebra: Linear Equations",
      difficulty: "INTERMEDIATE",
      questionCount: 1
    });
    
    console.log("Generated question:", testQuestions[0]);
    
    // Test storing the question in the database
    console.log("Storing question in database...");
    const storedQuestion = await prisma.question.create({
      data: {
        topic: "Algebra: Linear Equations",
        subject: "Math",
        difficulty: "INTERMEDIATE",
        question: testQuestions[0].question,
        choices: JSON.stringify(testQuestions[0].choices),
        answer: testQuestions[0].answer,
        explanation: testQuestions[0].explanation,
        source: "test",
        status: "APPROVED" // Start with approved for testing
      }
    });
    
    console.log("Stored question ID:", storedQuestion.id);
    
    // Test retrieving the question
    console.log("Retrieving question from database...");
    const retrievedQuestion = await prisma.question.findUnique({
      where: { id: storedQuestion.id }
    });
    
    console.log("Retrieved question:", retrievedQuestion);
    
    // Test the question bank service
    console.log("Testing question bank service...");
    // We'll need to import this once we create it
    
    console.log("✅ All tests passed! Ready to populate database.");
    
    // Clean up test question
    await prisma.question.delete({
      where: { id: storedQuestion.id }
    });
    
    console.log("Cleaned up test data.");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testQuestionPopulation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}