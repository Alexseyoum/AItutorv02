// File: scripts/enhance-explanations.js
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

// Detailed explanation templates for different question types
const explanationTemplates = {
  "Reading Comprehension: Literature": [
    "This question tests your ability to analyze literary elements and themes. The correct answer identifies a specific detail that directly supports the broader theme of resilience. Effective literary analysis requires connecting specific textual evidence to overarching themes, rather than focusing on isolated details that don't contribute to the work's meaning.",
    "This question assesses your understanding of how authors develop themes through specific details. The correct answer demonstrates a key moment where character actions or events reinforce the theme of resilience. Strong readers recognize how individual elements contribute to the text's larger purpose and meaning.",
    "This question evaluates your skill in identifying textual evidence that supports thematic interpretation. The correct answer shows a detail that exemplifies resilience through character behavior or narrative events. Literary analysis requires distinguishing between details that enhance themes and those that serve other purposes."
  ],
  "Reading Comprehension: History": [
    "This question assesses your ability to analyze historical texts and identify author's purpose. The correct answer recognizes how the author presents information to support a specific viewpoint about historical events. Effective historical analysis involves understanding both the content and the perspective from which it's presented.",
    "This question tests your skill in evaluating historical evidence and arguments. The correct answer identifies the most compelling evidence that supports the author's claims about historical events. Strong historical reasoning requires distinguishing between different types of evidence and assessing their relevance and strength.",
    "This question evaluates your understanding of historical context and interpretation. The correct answer demonstrates how specific evidence supports broader historical conclusions. Effective historical analysis connects specific facts to larger patterns and themes in historical development."
  ],
  "Reading Comprehension: Science": [
    "This question tests your ability to interpret scientific data and graphs. The correct answer identifies the relationship shown in the graph between temperature and enzyme activity. Strong scientific reasoning involves understanding how variables interact and recognizing patterns in experimental data.",
    "This question assesses your skill in evaluating scientific claims and evidence. The correct answer identifies the type of evidence that best supports the author's conclusion about renewable energy. Effective scientific analysis requires distinguishing between different types of evidence and assessing their relevance to specific claims.",
    "This question evaluates your understanding of scientific methodology and reasoning. The correct answer demonstrates how experimental results support scientific conclusions. Strong scientific reasoning involves connecting observed phenomena to theoretical explanations and understanding the limitations of experimental data."
  ],
  "Grammar: Sentence Structure": [
    "This question tests your knowledge of sentence structure and grammar. The correct answer identifies the proper way to join two independent clauses. Effective writing requires understanding how to connect ideas clearly while maintaining grammatical correctness and reader comprehension.",
    "This question assesses your ability to identify and correct sentence fragments. The correct answer provides the necessary elements to complete the thought. Strong writing skills involve recognizing incomplete sentences and knowing how to repair them for clarity and effectiveness.",
    "This question evaluates your understanding of parallel structure in writing. The correct answer maintains consistent grammatical form across items in a list or series. Effective writing requires parallelism to create rhythm and clarity for readers, making complex ideas easier to follow."
  ],
  "Grammar: Punctuation": [
    "This question tests your knowledge of punctuation rules and usage. The correct answer applies the appropriate punctuation mark to clarify meaning and improve readability. Effective punctuation enhances writing by guiding readers through complex sentences and separating related but distinct ideas.",
    "This question assesses your ability to use apostrophes correctly for possession and contractions. The correct answer follows standard conventions for showing ownership or forming contractions. Strong writing skills involve consistent and correct punctuation usage to ensure clear communication.",
    "This question evaluates your understanding of dash usage for emphasis and clarification. The correct answer uses dashes to set off explanatory information that enhances reader understanding. Effective punctuation choices support meaning and improve the flow of written communication."
  ],
  "Grammar: Verb Tense and Agreement": [
    "This question tests your knowledge of verb tenses and their appropriate usage. The correct answer applies the proper tense to match the time frame of the action. Effective verb usage requires understanding how tense affects meaning and maintaining consistency throughout a text.",
    "This question assesses your ability to ensure subject-verb agreement in complex sentences. The correct answer matches the verb form to the subject's number and person. Strong grammar skills involve recognizing the subject in various sentence structures and applying appropriate verb forms.",
    "This question evaluates your understanding of the subjunctive mood and its usage. The correct answer applies 'were' for hypothetical situations rather than 'was'. Effective writing requires knowing when to use different verb moods to convey precise meaning and tone."
  ]
};

async function enhanceExplanations() {
  console.log("Enhancing explanations for questions with brief explanations...");
  
  try {
    // Get all questions that need explanation enhancement
    // We'll look for questions with explanations that are likely too brief
    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { explanation: { contains: "brief" } },
          { explanation: { endsWith: "." } }
        ]
      }
    });
    
    console.log(`Found ${questions.length} questions that may need explanation enhancement.`);
    
    let enhancedCount = 0;
    
    for (const question of questions) {
      // Check if the explanation is actually too short (manual check since Prisma doesn't support length)
      if (question.explanation.length <= 100) {
        // Get appropriate explanation template based on topic
        const templates = explanationTemplates[question.topic] || [
          "This question tests critical thinking and analytical skills. The correct answer demonstrates a deep understanding of the concept being assessed. Strong analytical reasoning involves connecting specific details to broader principles and applying knowledge in new contexts.",
          "This question evaluates your ability to apply knowledge and reasoning. The correct answer shows how to approach complex problems systematically. Effective problem-solving requires understanding fundamental concepts and applying them appropriately to specific situations.",
          "This question assesses your comprehension and application skills. The correct answer reflects a thorough understanding of the subject matter. Strong academic performance involves not just memorizing facts but understanding how to use knowledge effectively."
        ];
        
        // Select a random template
        const newExplanation = templates[Math.floor(Math.random() * templates.length)];
        
        // Update the question with enhanced explanation
        await prisma.question.update({
          where: { id: question.id },
          data: { explanation: newExplanation }
          });
        
        enhancedCount++;
        console.log(`Enhanced explanation for question ID: ${question.id}`);
      }
    }
    
    console.log(`✅ Enhanced explanations for ${enhancedCount} questions.`);
    
    // Also get all questions and check their explanation length manually
    const allQuestions = await prisma.question.findMany();
    let shortExplanationCount = 0;
    
    for (const question of allQuestions) {
      if (question.explanation.length <= 100) {
        shortExplanationCount++;
      }
    }
    
    console.log(`Found ${shortExplanationCount} questions with explanations shorter than 100 characters.`);
    
  } catch (error) {
    console.error("❌ Error enhancing explanations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  enhanceExplanations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { enhanceExplanations };