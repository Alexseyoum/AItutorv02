/**
 * Run: node scripts/strict-validate-math.js
 * Requires: npm i mathjs @prisma/client
 */

const { create, all } = require("mathjs");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();
const math = create(all);

function isMathQuestion(q) {
  return ["math", "algebra", "geometry", "probability", "statistics"].some(k =>
    q.subject.toLowerCase().includes(k) || (q.topic || "").toLowerCase().includes(k)
  );
}

function parseChoices(choicesText) {
  try {
    return Array.isArray(choicesText)
      ? choicesText
      : JSON.parse(choicesText);
  } catch {
    return [];
  }
}

function trySolveEquation(text) {
  // extract equations like "3x + 5 = 20"
  const match = text.match(/([0-9xX\+\-\*\/\^=\s\.]+)/);
  if (!match) return null;

  const equation = match[1].replace(/\s+/g, "");
  if (!equation.includes("=")) return null;

  try {
    const [lhs, rhs] = equation.split("=");
    const expr = math.simplify(`${lhs} - (${rhs})`);
    const sol = math.solve(expr, "x");
    if (Array.isArray(sol) && sol.length) return sol[0];
    if (typeof sol === "number") return sol;
    return null;
  } catch {
    return null;
  }
}

function nearlyEqual(a, b, tolerance = 1e-3) {
  return Math.abs(a - b) < tolerance;
}

async function validateStrictMath() {
  const questions = await prisma.question.findMany({
    where: { subject: { contains: "Math", mode: "insensitive" } },
  });

  console.log(`🔍 Validating ${questions.length} math questions...`);

  let approvedCount = 0;
  let pendingReviewCount = 0;

  for (const q of questions) {
    const choices = parseChoices(q.choices);
    const choiceIndex = parseInt(q.answer, 10);
    const answerChoice = choices[choiceIndex];
    const explanation = q.explanation || "";

    let result = "PENDING_REVIEW";

    // Attempt to solve
    const numericAnswer = trySolveEquation(q.question);
    if (numericAnswer !== null) {
      const numericChoice = Number(answerChoice);
      if (!Number.isNaN(numericChoice) && nearlyEqual(numericAnswer, numericChoice)) {
        result = "APPROVED";
      }
    }

    // fallback: check if explanation shows a solving process
    const hasProcess = /[=+\-*/^]|divide|multiply|substitute|solve/i.test(explanation);
    if (result !== "APPROVED" && hasProcess) {
      result = "PENDING_REVIEW"; // Keep for manual review but flag as potentially good
    }

    await prisma.question.update({
      where: { id: q.id },
      data: { status: result },
    });

    if (result === "APPROVED") {
      approvedCount++;
    } else {
      pendingReviewCount++;
    }

    console.log(`${q.id}: ${result}`);
  }

  console.log("\n✅ Strict validation completed.");
  console.log(`Approved: ${approvedCount}`);
  console.log(`Need Review: ${pendingReviewCount}`);
}

validateStrictMath()
  .catch(e => {
    console.error("❌ Error during validation:", e.message);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());