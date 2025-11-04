// File: src/scripts/check-available-topics.js
const { PrismaClient } = require("../generated/prisma");

async function checkAvailableTopics() {
  console.log("Checking available topics in the database...");
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection first
    console.log("Testing database connection...");
    const count = await prisma.question.count();
    console.log(`✅ Database connection successful. Total questions: ${count}`);
    
    // Get all unique subjects and topics
    const subjects = await prisma.question.groupBy({
      by: ['subject'],
      where: {
        status: "APPROVED",
        isActive: true
      }
    });
    
    console.log("Available subjects:");
    subjects.forEach((s, i) => {
      console.log(`${i + 1}. ${s.subject}`);
    });
    
    const topics = await prisma.question.groupBy({
      by: ['subject', 'topic'],
      where: {
        status: "APPROVED",
        isActive: true
      }
    });
    
    console.log("\nAvailable subject-topic combinations:");
    topics.forEach((t, i) => {
      console.log(`${i + 1}. ${t.subject} - ${t.topic}`);
    });
    
    // Get count of questions per topic
    const topicCounts = await prisma.question.groupBy({
      by: ['subject', 'topic'],
      where: {
        status: "APPROVED",
        isActive: true
      },
      _count: {
        id: true
      }
    });
    
    console.log("\nQuestion counts by topic:");
    topicCounts.forEach((tc, i) => {
      console.log(`${i + 1}. ${tc.subject} - ${tc.topic}: ${tc._count.id} questions`);
    });
    
    console.log("\n✅ Topic check completed!");
  } catch (error) {
    console.error("❌ Error checking topics:", error.message);
    console.error("This indicates a database connectivity issue. Please check:");
    console.error("1. Your DATABASE_URL in .env file");
    console.error("2. That your Neon database is running");
    console.error("3. Your network connection");
    console.error("4. Any firewall restrictions");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  checkAvailableTopics()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}