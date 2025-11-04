// File: scripts/populate-initial-questions.js
const { PrismaClient } = require('../src/generated/prisma');
const { QuestionStatus } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Initial set of vetted questions
const initialQuestions = [
  // Math: Algebra - Linear Equations (Easy)
  {
    id: 'math_algebra_linear_easy_001',
    question: 'What is the value of \\( x \\) in the equation \\( 3x + 5 = 20 \\)?',
    choices: '["5", "6", "7", "8"]',
    answer: '0',
    explanation: 'To solve for \\( x \\):  \n1. Subtract 5 from both sides: \\( 3x = 20 - 5 = 15 \\).  \n2. Divide by 3: \\( x = 15 \\div 3 = 5 \\).  \nThe correct answer is choice 0 (5).',
    subject: 'Math',
    topic: 'Algebra: Linear Equations',
    difficulty: 'easy',
    status: QuestionStatus.APPROVED
  },
  // Math: Algebra - Quadratic Equations (Medium)
  {
    id: 'math_algebra_quadratic_medium_001',
    question: 'What is the positive solution to \\( x^2 - 5x + 6 = 0 \\)?',
    choices: '["2", "3", "-2", "-3"]',
    answer: '1',
    explanation: 'Factor the quadratic: \\( (x - 2)(x - 3) = 0 \\).  \nSolutions: \\( x = 2 \\) or \\( x = 3 \\).  \nThe positive solution is 3 (choice 1).',
    subject: 'Math',
    topic: 'Algebra: Quadratic Equations',
    difficulty: 'medium',
    status: QuestionStatus.APPROVED
  },
  // Math: Geometry - Triangles (Hard)
  {
    id: 'math_geometry_triangles_hard_001',
    question: 'In \\( \\triangle ABC \\), \\( AB = 5 \\), \\( BC = 7 \\), and \\( \\angle B = 60^\\circ \\). What is \\( AC \\)?',
    choices: '["√3", "√21", "√39", "√49"]',
    answer: '2',
    explanation: 'Use the Law of Cosines: \\( AC^2 = AB^2 + BC^2 - 2 \\cdot AB \\cdot BC \\cdot \\cos(\\angle B) \\).  \nSubstitute values: \\( AC^2 = 5^2 + 7^2 - 2 \\cdot 5 \\cdot 7 \\cdot \\cos(60^\\circ) \\).  \n\\( \\cos(60^\\circ) = 0.5 \\), so:  \n\\( AC^2 = 25 + 49 - 35 = 39 \\).  \nThus, \\( AC = \\sqrt{39} \\) (choice 2).',
    subject: 'Math',
    topic: 'Geometry: Triangles',
    difficulty: 'hard',
    status: QuestionStatus.APPROVED
  },
  // Math: Data Analysis - Statistics (Medium)
  {
    id: 'math_data_stats_medium_001',
    question: 'Scores: 78, 82, 85, 90, 95. What is the mean score?',
    choices: '["84", "85", "86", "87"]',
    answer: '2',
    explanation: 'Mean = (sum of scores) / (number of scores).  \nSum: \\( 78 + 82 + 85 + 90 + 95 = 430 \\).  \nNumber of scores: 5.  \nMean: \\( 430 \\div 5 = 86 \\) (choice 2).',
    subject: 'Math',
    topic: 'Data Analysis: Statistics',
    difficulty: 'medium',
    status: QuestionStatus.APPROVED
  },
  // Reading: Literature Comprehension (Easy)
  {
    id: 'reading_literature_easy_001',
    question: 'Passage: "Lila traced a finger over the dusty mirror, her eyes heavy with secrets." What can be inferred about Lila?',
    choices: '["She is cheerful.", "She is hiding something.", "She cleans mirrors daily.", "She prefers sunlight."]',
    answer: '1',
    explanation: 'The phrase "eyes heavy with secrets" implies Lila has hidden information. Thus, the correct inference is choice 1 (hiding something).',
    subject: 'Reading',
    topic: 'Reading Comprehension: Literature',
    difficulty: 'easy',
    status: QuestionStatus.APPROVED
  },
  // Reading: History Comprehension (Medium)
  {
    id: 'reading_history_medium_001',
    question: 'Passage: "The Industrial Revolution shifted economies from farms to factories, increasing production but worsening urban living." What is the main effect described?',
    choices: '["Improved cities", "Agricultural growth", "Industrial economy shift", "Lower production"]',
    answer: '2',
    explanation: 'The passage explicitly states the shift "from farms to factories," directly identifying the main effect as an industrial economy shift (choice 2). Other options contradict the text.',
    subject: 'Reading',
    topic: 'Reading Comprehension: History',
    difficulty: 'medium',
    status: QuestionStatus.APPROVED
  },
  // Reading: Science Comprehension (Hard)
  {
    id: 'reading_science_hard_001',
    question: 'Passage: "Photosynthesis splits water into oxygen, protons, and electrons. These electrons generate ATP, powering glucose production." What is a product of the light-dependent reactions?',
    choices: '["Glucose", "ATP", "Carbon Dioxide", "Chlorophyll"]',
    answer: '1',
    explanation: 'Light-dependent reactions produce ATP (stated: "These electrons generate ATP"). Glucose is made in the Calvin cycle (light-independent). Carbon dioxide is a reactant, and chlorophyll is a pigment, not a product. Correct answer: choice 1 (ATP).',
    subject: 'Reading',
    topic: 'Reading Comprehension: Science',
    difficulty: 'hard',
    status: QuestionStatus.APPROVED
  },
  // Writing: Grammar - Sentence Structure (Easy)
  {
    id: 'writing_grammar_structure_easy_001',
    question: 'Which sentence is correctly structured?',
    choices: '["Running to the park, the sun set.", "After eating, Maria walked to the store.", "The book, heavy and dusty, she ignored.", "Because he was tired, so he slept."]',
    answer: '1',
    explanation: 'Choice 1 pairs a dependent clause ("After eating") with an independent clause ("Maria walked..."), forming a valid structure.  \n- Choice 0: Misplaced modifier (sun isn\'t running).  \n- Choice 2: Fragment (no clear subject for "she ignored").  \n- Choice 3: Redundant conjunction ("because" + "so").  \nCorrect answer: choice 1.',
    subject: 'Writing',
    topic: 'Grammar: Sentence Structure',
    difficulty: 'easy',
    status: QuestionStatus.APPROVED
  },
  // Writing: Grammar - Punctuation (Medium)
  {
    id: 'writing_grammar_punctuation_medium_001',
    question: 'Which sentence correctly uses commas in a list? Original: "The box held pens pencils and erasers."',
    choices: '["The box held pens, pencils, and erasers.", "The box held pens pencils, and erasers.", "The box held pens, pencils and erasers.", "The box held pens pencils and erasers."]',
    answer: '0',
    explanation: 'An Oxford comma (before "and") is required in formal lists.  \nChoice 0 includes commas after "pens" and "pencils" with an Oxford comma, making it correct.  \nOther choices missing commas or lacking the Oxford comma are invalid.  \nCorrect answer: choice 0.',
    subject: 'Writing',
    topic: 'Grammar: Punctuation',
    difficulty: 'medium',
    status: QuestionStatus.APPROVED
  }
];

async function populateInitialQuestions() {
  let inserted = 0;
  let errors = 0;

  for (const questionData of initialQuestions) {
    try {
      // Validate before inserting
      const choices = typeof questionData.choices === 'string' ? 
        JSON.parse(questionData.choices) : questionData.choices;

      const isValid = validateChoiceCorrelation(questionData.answer, choices) &&
                     validateSolutionCompleteness(questionData);

      if (isValid) {
        await prisma.question.create({
          data: {
            ...questionData,
            status: QuestionStatus.APPROVED
          }
        });
        inserted++;
        console.log(`Inserted question: ${questionData.id}`);
      } else {
        console.log(`Invalid question skipped: ${questionData.id}`);
        errors++;
      }
    } catch (error) {
      console.error(`Error inserting question ${questionData.id}:`, error);
      errors++;
    }
  }

  console.log(`Population complete: ${inserted} questions inserted, ${errors} errors`);
}

// Reuse validation functions from the validation script
function validateChoiceCorrelation(answer, choices) {
  if (!choices || !Array.isArray(choices) || choices.length < 4) return false;

  // If answer looks like integer index (string or number), accept 0..choices.length-1
  const idx = typeof answer === 'number' ? answer : ('' + answer).trim();
  if (/^\d+$/.test(idx)) {
    const n = parseInt(idx, 10);
    return n >= 0 && n < choices.length;
  }

  // Otherwise treat answer as string: must match one of the choices (case-insensitive, trimmed)
  const aStr = String(answer).trim().toLowerCase();
  for (const c of choices) {
    if (String(c).trim().toLowerCase() === aStr) return true;
  }
  // allow fuzzy match: numeric equality when both parse to numbers
  for (const c of choices) {
    const cnum = Number(c);
    const anum = Number(answer);
    if (!Number.isNaN(cnum) && !Number.isNaN(anum) && cnum === anum) return true;
  }
  return false;
}

function validateSolutionCompleteness(question) {
  if (!question.explanation || question.explanation.trim().length < 15) return false;

  // If subject is Math (or topic contains algebra/geometry/probability/statistics)
  const subj = (question.subject || '').toLowerCase();
  const topic = (question.topic || '').toLowerCase();

  const mathKeywords = ['math', 'algebra', 'geometry', 'equation', 'probability', 'statistics', 'data analysis'];
  const isMath = mathKeywords.some(k => subj.includes(k) || topic.includes(k));

  if (isMath) {
    return looksLikeMathSolution(question.explanation);
  }
  // For non-math: require explanation length >= 30 characters as a baseline
  return question.explanation.trim().length >= 30;
}

function looksLikeMathSolution(explanation) {
  if (!explanation || typeof explanation !== 'string') return false;
  const minLen = 30; // minimal length for a meaningful explanation
  if (explanation.trim().length < minLen) return false;

  // naive heuristics: presence of "=" or "→" or steps (Step 1) or arithmetic operators or solved variable names
  const hasEquationChars = /[=+\-*/^]|Step\s*\d|→|=>|solve|divide|multiply|substitu/i.test(explanation);
  return hasEquationChars;
}

populateInitialQuestions()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });