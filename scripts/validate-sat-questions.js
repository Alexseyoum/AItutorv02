// File: scripts/validate-sat-questions.js
const { PrismaClient, QuestionStatus } = require('../src/generated/prisma');
const prisma = new PrismaClient();

function parseChoices(choicesText) {
  try {
    return JSON.parse(choicesText);
  } catch (e) {
    return null;
  }
}

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

function looksLikeMathSolution(explanation) {
  if (!explanation || typeof explanation !== 'string') return false;
  const minLen = 30; // minimal length for a meaningful explanation
  if (explanation.trim().length < minLen) return false;

  // naive heuristics: presence of "=" or "→" or steps (Step 1) or arithmetic operators or solved variable names
  const hasEquationChars = /[=+\-*/^]|Step\s*\d|→|=>|solve|divide|multiply|substitu/i.test(explanation);
  return hasEquationChars;
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

async function validateQuestions() {
  const questions = await prisma.question.findMany({
    where: { status: QuestionStatus.PENDING_REVIEW } // check pending items, adjust as needed
  });

  for (const q of questions) {
    const choices = parseChoices(q.choices);
    const choiceValid = validateChoiceCorrelation(q.answer, choices);
    const solutionValid = validateSolutionCompleteness(q);

    if (choiceValid && solutionValid) {
      await prisma.question.update({
        where: { id: q.id },
        data: { status: QuestionStatus.APPROVED }
      });
      console.log(`APPROVED ${q.id}`);
    } else {
      await prisma.question.update({
        where: { id: q.id },
        data: { status: QuestionStatus.NEEDS_REVIEW }
      });
      console.log(`NEEDS_REVIEW ${q.id} (choiceValid=${choiceValid}, solutionValid=${solutionValid})`);
    }
  }
}

validateQuestions()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });