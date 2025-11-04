// File: src/scripts/populate-question-bank.js
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

// Expanded sample SAT questions data with more variety
const sampleQuestionsData = [
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

// Function to generate questions using the API
async function generateQuestionsViaAPI(params) {
  try {
    // Since we're in a script context, we can't make actual API calls
    // Instead, we'll generate mock questions with some variety
    const questions = [];
    
    // Generate different types of questions based on subject and topic
    for (let i = 0; i < params.questionCount; i++) {
      let question, choices, answer, explanation;
      
      if (params.subject === "Math") {
        // Generate math questions
        if (params.topic.includes("Linear")) {
          const a = Math.floor(Math.random() * 10) + 1;
          const b = Math.floor(Math.random() * 20) + 1;
          const c = Math.floor(Math.random() * 30) + 1;
          const x = Math.floor((c - b) / a);
          
          question = `If ${a}x + ${b} = ${c}, what is the value of x?`;
          choices = [x.toString(), (x + 1).toString(), (x - 1).toString(), (x + 2).toString()];
          answer = x.toString();
          explanation = `Subtract ${b} from both sides: ${a}x = ${c - b}. Divide by ${a}: x = ${x}.`;
        } else if (params.topic.includes("Quadratic")) {
          const a = Math.floor(Math.random() * 5) + 1;
          const b = Math.floor(Math.random() * 10) + 1;
          const c = Math.floor(Math.random() * 10) + 1;
          
          question = `Solve for x: ${a}x² + ${b}x + ${c} = 0`;
          choices = ["No real solutions", "One real solution", "Two real solutions", "Infinite solutions"];
          answer = "No real solutions";
          explanation = "Using the discriminant b² - 4ac, we determine the nature of the roots.";
        } else if (params.topic.includes("Geometry") && params.topic.includes("Triangles")) {
          const angle1 = Math.floor(Math.random() * 60) + 30;
          const angle2 = Math.floor(Math.random() * (120 - angle1)) + 1;
          const angle3 = 180 - angle1 - angle2;
          
          question = `In a triangle, two angles measure ${angle1}° and ${angle2}°. What is the measure of the third angle?`;
          choices = [`${angle3}°`, `${angle3 + 10}°`, `${angle3 - 10}°`, `${angle3 + 20}°`];
          answer = `${angle3}°`;
          explanation = `The sum of angles in a triangle is 180°. So the third angle = 180° - ${angle1}° - ${angle2}° = ${angle3}°.`;
        } else if (params.topic.includes("Geometry") && params.topic.includes("Circles")) {
          const radius = Math.floor(Math.random() * 10) + 5;
          const area = Math.PI * radius * radius;
          
          question = `What is the area of a circle with radius ${radius} units?`;
          choices = [`${Math.round(area)}π`, `${Math.round(area * 2)}π`, `${Math.round(area / 2)}π`, `${Math.round(area * 3)}π`];
          answer = `${Math.round(area)}π`;
          explanation = `The area of a circle is πr². With radius ${radius}, area = π × ${radius}² = ${Math.round(area)}π.`;
        } else if (params.topic.includes("Statistics")) {
          const numbers = Array.from({length: 5}, () => Math.floor(Math.random() * 20) + 1);
          const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          
          question = `What is the mean of the numbers: ${numbers.join(", ")}?`;
          choices = [mean.toFixed(1), (mean + 1).toFixed(1), (mean - 1).toFixed(1), (mean + 2).toFixed(1)];
          answer = mean.toFixed(1);
          explanation = `The mean is the sum of all numbers divided by the count. (${numbers.join(" + ")}) ÷ ${numbers.length} = ${mean.toFixed(1)}.`;
        } else {
          // Default math question
          const num1 = Math.floor(Math.random() * 20) + 1;
          const num2 = Math.floor(Math.random() * 20) + 1;
          const result = num1 + num2;
          
          question = `What is ${num1} + ${num2}?`;
          choices = [result.toString(), (result + 1).toString(), (result - 1).toString(), (result + 2).toString()];
          answer = result.toString();
          explanation = `Simple addition: ${num1} + ${num2} = ${result}.`;
        }
      } else if (params.subject === "Reading") {
        // Generate reading comprehension questions
        if (params.topic.includes("Literature")) {
          question = "What is the main theme of a story where a character overcomes adversity through perseverance?";
          choices = [
            "The power of determination",
            "The importance of wealth",
            "The value of solitude",
            "The danger of ambition"
          ];
          answer = "The power of determination";
          explanation = "Stories about overcoming adversity typically emphasize themes of perseverance and determination.";
        } else if (params.topic.includes("History")) {
          question = "Which document established the framework for the United States government?";
          choices = [
            "The Constitution",
            "The Declaration of Independence",
            "The Bill of Rights",
            "The Articles of Confederation"
          ];
          answer = "The Constitution";
          explanation = "The U.S. Constitution established the framework for the federal government and is the supreme law of the land.";
        } else if (params.topic.includes("Science")) {
          question = "What is the primary function of chlorophyll in plants?";
          choices = [
            "To absorb light energy for photosynthesis",
            "To transport water throughout the plant",
            "To store nutrients for growth",
            "To protect the plant from pests"
          ];
          answer = "To absorb light energy for photosynthesis";
          explanation = "Chlorophyll is the green pigment in plants that absorbs light energy, which is essential for photosynthesis.";
        } else {
          // Default reading question
          question = "What is the purpose of an introductory paragraph in an essay?";
          choices = [
            "To present the main argument",
            "To provide background information",
            "To summarize the key points",
            "To conclude the discussion"
          ];
          answer = "To present the main argument";
          explanation = "The introductory paragraph typically presents the thesis or main argument of the essay.";
        }
      } else if (params.subject === "Writing") {
        // Generate writing questions
        if (params.topic.includes("Sentence Structure")) {
          question = "Which of the following is a correctly punctuated compound sentence?";
          choices = [
            "I went to the store and I bought some milk.",
            "I went to the store, and I bought some milk.",
            "I went to the store I bought some milk.",
            "I went to the store, I bought some milk."
          ];
          answer = "I went to the store, and I bought some milk.";
          explanation = "A compound sentence joining two independent clauses with a comma and coordinating conjunction is correctly punctuated.";
        } else if (params.topic.includes("Punctuation")) {
          question = "When should a semicolon be used in a sentence?";
          choices = [
            "To separate items in a list",
            "To join two related independent clauses",
            "To introduce a list",
            "To show possession"
          ];
          answer = "To join two related independent clauses";
          explanation = "A semicolon is used to join two related independent clauses without a coordinating conjunction.";
        } else {
          // Default writing question
          question = "What is the function of a transition word in a paragraph?";
          choices = [
            "To connect ideas between sentences",
            "To introduce new vocabulary",
            "To emphasize the main point",
            "To conclude the paragraph"
          ];
          answer = "To connect ideas between sentences";
          explanation = "Transition words help create smooth connections between ideas and improve the flow of writing.";
        }
      } else {
        // Default question
        question = `What is the subject of this ${params.subject} question about ${params.topic}?`;
        choices = ["Option A", "Option B", "Option C", "Option D"];
        answer = "Option A";
        explanation = "This is a sample explanation for the question.";
      }
      
      questions.push({
        question,
        choices,
        answer,
        explanation
      });
    }
    
    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

async function populateQuestionBank() {
  console.log("Populating question bank with sample questions...");
  
  let totalGenerated = 0;
  
  try {
    for (const config of sampleQuestionsData) {
      console.log(`Generating ${config.count} ${config.difficulty} questions for ${config.subject} - ${config.topic}...`);
      
      try {
        // Generate questions using our mock generator
        const generatedQuestions = await generateQuestionsViaAPI({
          subject: config.subject,
          topic: config.topic,
          difficulty: config.difficulty.toLowerCase(),
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
                status: "APPROVED", // Use string directly since we can't import enum
                usageCount: 0,
                avgCorrectRate: 0,
                avgTimeToAnswer: 0,
                tags: [],
                version: 1,
                isActive: true
              }
            });
            totalGenerated++;
            console.log(`✓ Stored question: ${q.question.substring(0, 50)}...`);
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
  } finally {
    await prisma.$disconnect();
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