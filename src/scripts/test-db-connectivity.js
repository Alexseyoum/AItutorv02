// File: src/scripts/test-db-connectivity.js
const { PrismaClient } = require("../generated/prisma");

async function testDbConnectivity() {
  console.log("Testing database connectivity...");
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    const count = await prisma.question.count();
    console.log(`✅ Database connection successful. Total questions: ${count}`);
    
    // Test reading questions
    const questions = await prisma.question.findMany({
      take: 3,
      where: {
        status: "APPROVED",
        isActive: true
      }
    });
    
    console.log(`Retrieved ${questions.length} questions:`);
    questions.forEach((q, i) => {
      console.log(`${i + 1}. ${q.question.substring(0, 50)}... (ID: ${q.id})`);
    });
    
    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Database test failed:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  testDbConnectivity()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}