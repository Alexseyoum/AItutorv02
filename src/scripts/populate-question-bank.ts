// File: src/scripts/populate-question-bank.ts
import { prisma } from "@/lib/prisma";
import { QuestionStatus } from "@/generated/prisma";
import { generateQuestions } from "@/lib/utils/questionBank";

// Expanded sample SAT questions data with more variety
const sampleQuestions = [
  // Math - Algebra
  {
    subject: "Math",
    topic: "Algebra: Linear Equations",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Math",
    topic: "Algebra: Linear Equations",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Math",
    topic: "Algebra: Linear Equations",
    difficulty: "ADVANCED",
    count: 5
  },
  {
    subject: "Math",
    topic: "Algebra: Quadratic Equations",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Math",
    topic: "Algebra: Quadratic Equations",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Math",
    topic: "Algebra: Quadratic Equations",
    difficulty: "ADVANCED",
    count: 5
  },
  {
    subject: "Math",
    topic: "Algebra: Systems of Equations",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Math",
    topic: "Algebra: Systems of Equations",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Math",
    topic: "Algebra: Systems of Equations",
    difficulty: "ADVANCED",
    count: 5
  },
  
  // Math - Geometry
  {
    subject: "Math",
    topic: "Geometry: Triangles",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Math",
    topic: "Geometry: Triangles",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Math",
    topic: "Geometry: Triangles",
    difficulty: "ADVANCED",
    count: 5
  },
  {
    subject: "Math",
    topic: "Geometry: Circles",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Math",
    topic: "Geometry: Circles",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Math",
    topic: "Geometry: Circles",
    difficulty: "ADVANCED",
    count: 5
  },
  
  // Math - Data Analysis
  {
    subject: "Math",
    topic: "Data Analysis: Statistics",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Math",
    topic: "Data Analysis: Statistics",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Math",
    topic: "Data Analysis: Statistics",
    difficulty: "ADVANCED",
    count: 5
  },
  {
    subject: "Math",
    topic: "Data Analysis: Probability",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Math",
    topic: "Data Analysis: Probability",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Math",
    topic: "Data Analysis: Probability",
    difficulty: "ADVANCED",
    count: 5
  },
  
  // Reading - Literature
  {
    subject: "Reading",
    topic: "Reading Comprehension: Literature",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Reading",
    topic: "Reading Comprehension: Literature",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Reading",
    topic: "Reading Comprehension: Literature",
    difficulty: "ADVANCED",
    count: 5
  },
  
  // Reading - History
  {
    subject: "Reading",
    topic: "Reading Comprehension: History",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Reading",
    topic: "Reading Comprehension: History",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Reading",
    topic: "Reading Comprehension: History",
    difficulty: "ADVANCED",
    count: 5
  },
  
  // Reading - Science
  {
    subject: "Reading",
    topic: "Reading Comprehension: Science",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Reading",
    topic: "Reading Comprehension: Science",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Reading",
    topic: "Reading Comprehension: Science",
    difficulty: "ADVANCED",
    count: 5
  },
  
  // Writing - Grammar
  {
    subject: "Writing",
    topic: "Grammar: Sentence Structure",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Writing",
    topic: "Grammar: Sentence Structure",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Writing",
    topic: "Grammar: Sentence Structure",
    difficulty: "ADVANCED",
    count: 5
  },
  
  // Writing - Punctuation
  {
    subject: "Writing",
    topic: "Grammar: Punctuation",
    difficulty: "BEGINNER",
    count: 5
  },
  {
    subject: "Writing",
    topic: "Grammar: Punctuation",
    difficulty: "INTERMEDIATE",
    count: 10
  },
  {
    subject: "Writing",
    topic: "Grammar: Punctuation",
    difficulty: "ADVANCED",
    count: 5
  }
];

async function populateQuestionBank() {
  console.log("Populating question bank with sample questions...");
  
  let totalGenerated = 0;
  
  try {
    for (const config of sampleQuestions) {
      console.log(`Generating ${config.count} ${config.difficulty} questions for ${config.subject} - ${config.topic}...`);
      
      try {
        // Generate questions using the existing question generation utility
        const generatedQuestions = await generateQuestions({
          subject: config.subject,
          topic: config.topic,
          difficulty: config.difficulty.toLowerCase(), // API expects lowercase
          questionCount: config.count,
          goal: "SAT"
        });
        
        // Store each generated question in the database
        for (const q of generatedQuestions) {
          try {
            await prisma.question.create({
              data: {
                subject: config.subject,
                topic: config.topic,
                difficulty: config.difficulty,
                question: q.question,
                choices: JSON.stringify(q.choices),
                answer: q.answer,
                explanation: q.explanation,
                source: "ai_generated",
                status: QuestionStatus.APPROVED, // Start with approved status for testing
                usageCount: 0,
                avgCorrectRate: 0,
                avgTimeToAnswer: 0,
                tags: [],
                version: 1,
                isActive: true
              }
            });
            totalGenerated++;
          } catch (storeError) {
            console.error(`Error storing question:`, storeError);
            // Continue with other questions
          }
        }
        
        console.log(`✓ Generated and stored ${generatedQuestions.length} questions`);
      } catch (generateError) {
        console.error(`Error generating questions for ${config.subject} - ${config.topic}:`, generateError);
        // Continue with other configurations
      }
    }
    
    console.log(`✅ Successfully populated question bank with ${totalGenerated} questions!`);
    
    // Verify the population
    const totalQuestions = await prisma.question.count();
    console.log(`Total questions in database: ${totalQuestions}`);
    
    // Show breakdown by subject
    const subjectCounts = await prisma.question.groupBy({
      by: ['subject'],
      _count: {
        _all: true
      }
    });
    
    console.log("Questions by subject:");
    subjectCounts.forEach(count => {
      console.log(`  ${count.subject}: ${count._count._all}`);
    });
    
  } catch (error) {
    console.error("❌ Error populating question bank:", error);
    throw error;
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  populateQuestionBank()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}