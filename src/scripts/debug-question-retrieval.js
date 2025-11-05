// File: src/scripts/debug-question-retrieval.js
const { PrismaClient } = require("../generated/prisma");

async function debugQuestionRetrieval() {
  console.log("Debugging question retrieval process...");
  
  const prisma = new PrismaClient();
  
  try {
    console.log("1. Testing basic database connection...");
    const count = await prisma.question.count();
    console.log(`   ✅ Connected successfully. Total questions: ${count}`);
    
    console.log("\n2. Checking what subjects and topics exist in the database...");
    
    // Get all unique subjects
    const subjects = await prisma.question.groupBy({
      by: ['subject'],
      where: {
        status: "APPROVED",
        isActive: true
      }
    });
    
    console.log("   Available subjects:");
    subjects.forEach((s, i) => {
      console.log(`     ${i + 1}. ${s.subject}`);
    });
    
    // Get all unique topics by subject
    const topicsBySubject = await prisma.question.groupBy({
      by: ['subject', 'topic'],
      where: {
        status: "APPROVED",
        isActive: true
      }
    });
    
    console.log("\n   Available subject-topic combinations:");
    topicsBySubject.forEach((t, i) => {
      console.log(`     ${i + 1}. ${t.subject} - ${t.topic}`);
    });
    
    console.log("\n3. Testing specific topic queries that might be failing...");
    
    // Test the specific topics used in the diagnostic test
    const diagnosticTopics = [
      "Algebra: Linear Equations",
      "Algebra: Quadratic Equations",
      "Geometry: Triangles",
      "Geometry: Circles",
      "Data Analysis: Statistics",
      "Data Analysis: Probability",
      "Reading Comprehension: Literature",
      "Reading Comprehension: History",
      "Reading Comprehension: Science",
      "Vocabulary: Context Clues",
      "Grammar: Sentence Structure",
      "Grammar: Punctuation",
      "Rhetoric: Argument Analysis"
    ];
    
    console.log("   Testing diagnostic topics:");
    for (const topic of diagnosticTopics) {
      try {
        const questions = await prisma.question.findMany({
          where: {
            topic: topic,
            status: "APPROVED",
            isActive: true
          },
          take: 1
        });
        
        console.log(`     ${topic}: ${questions.length} questions found`);
      } catch (error) {
        console.log(`     ${topic}: ERROR - ${error.message}`);
      }
    }
    
    console.log("\n4. Testing the QuestionBankService methods directly...");
    
    // Try to import and test the QuestionBankService
    try {
      // This would require a more complex setup to test the actual service
      console.log("   Skipping direct service test (requires more setup)");
    } catch (error) {
      console.log(`   Service test error: ${error.message}`);
    }
    
    console.log("\n✅ Debug process completed!");
    
  } catch (error) {
    console.error("❌ Debug process failed:", error.message);
    
    // If it's a connectivity issue, provide specific guidance
    if (error.message.includes("Can't reach database server")) {
      console.error("\n🔧 Database connectivity issue detected:");
      console.error("   This is likely the root cause of your SAT prep issues.");
      console.error("   The application works when the database is connected,");
      console.error("   but fails when there are connectivity interruptions.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  debugQuestionRetrieval()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}