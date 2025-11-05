// File: src/scripts/check-reading-questions.js
// Use the generated Prisma client directly
const { PrismaClient } = require("../generated/prisma");

async function checkReadingQuestions() {
  console.log("Checking for Reading Comprehension questions...");
  
  // Initialize Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Check for Reading Comprehension: History questions
    console.log("\nChecking Reading Comprehension: History questions...");
    const historyQuestions = await prisma.question.findMany({
      where: {
        subject: "Reading",
        topic: "Reading Comprehension: History",
        status: "APPROVED",
        isActive: true
      },
      take: 5
    });
    
    console.log(`Found ${historyQuestions.length} History questions`);
    if (historyQuestions.length > 0) {
      console.log("Sample History question:", {
        id: historyQuestions[0].id,
        question: historyQuestions[0].question.substring(0, 50) + "...",
        usageCount: historyQuestions[0].usageCount,
        avgCorrectRate: historyQuestions[0].avgCorrectRate
      });
    }
    
    // Check for Reading Comprehension: Literature questions
    console.log("\nChecking Reading Comprehension: Literature questions...");
    const literatureQuestions = await prisma.question.findMany({
      where: {
        subject: "Reading",
        topic: "Reading Comprehension: Literature",
        status: "APPROVED",
        isActive: true
      },
      take: 5
    });
    
    console.log(`Found ${literatureQuestions.length} Literature questions`);
    if (literatureQuestions.length > 0) {
      console.log("Sample Literature question:", {
        id: literatureQuestions[0].id,
        question: literatureQuestions[0].question.substring(0, 50) + "...",
        usageCount: literatureQuestions[0].usageCount,
        avgCorrectRate: literatureQuestions[0].avgCorrectRate
      });
    }
    
    // Check total Reading questions
    console.log("\nChecking total Reading questions...");
    const totalReadingQuestions = await prisma.question.count({
      where: {
        subject: "Reading",
        status: "APPROVED",
        isActive: true
      }
    });
    
    console.log(`Total Reading questions: ${totalReadingQuestions}`);
    
    console.log("\n✅ Check completed successfully!");
    
  } catch (error) {
    console.error("❌ Error checking Reading questions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  checkReadingQuestions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}