// File: src/scripts/assess-question-quality.js
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

// Function to assess mathematical accuracy of questions
function assessMathAccuracy(questionText, choices, answer, explanation) {
  const issues = [];
  let qualityScore = 10; // Start with perfect score
  
  // Check for linear equation questions
  const linearEqMatch = questionText.match(/(\d+)x\s*[\+\-]\s*(\d+)\s*=\s*(\d+)/);
  if (linearEqMatch) {
    const a = parseInt(linearEqMatch[1]);
    const b = parseInt(linearEqMatch[2]);
    const c = parseInt(linearEqMatch[3]);
    
    // Calculate correct answer
    const correctAnswer = (c - b) / a;
    
    // Check if provided answer matches correct answer
    if (parseFloat(answer) !== correctAnswer) {
      issues.push(`Incorrect answer: Expected ${correctAnswer}, got ${answer}`);
      qualityScore -= 3;
    }
    
    // Check explanation accuracy
    if (!explanation.includes((c - b).toString()) || !explanation.includes(`x = ${correctAnswer}`)) {
      issues.push("Explanation doesn't match the correct solution process");
      qualityScore -= 2;
    }
  }
  
  // Check for quadratic equation questions
  const quadEqMatch = questionText.match(/(\d+)x²\s*[\+\-]\s*(\d+)x\s*[\+\-]\s*(\d+)\s*=\s*0/);
  if (quadEqMatch) {
    // Basic check for quadratic questions - just verify explanation mentions discriminant
    if (!explanation.includes("discriminant") && !explanation.includes("b² - 4ac")) {
      issues.push("Quadratic explanation missing discriminant discussion");
      qualityScore -= 2;
    }
  }
  
  // Check for geometry questions (triangles)
  if (questionText.includes("triangle") && questionText.includes("angle")) {
    // Check if angles add up to 180
    const angleMatches = questionText.match(/(\d+)°/g);
    if (angleMatches && angleMatches.length >= 2) {
      const angles = angleMatches.map(match => parseInt(match.replace('°', '')));
      const sumOfGivenAngles = angles.reduce((sum, angle) => sum + angle, 0);
      const missingAngle = 180 - sumOfGivenAngles;
      
      if (parseInt(answer) !== missingAngle) {
        issues.push(`Triangle angle sum incorrect: Expected ${missingAngle}°, got ${answer}°`);
        qualityScore -= 3;
      }
    }
  }
  
  return { issues, qualityScore };
}

// Function to assess reading/writing questions
function assessReadingWritingQuality(questionText, choices, answer, explanation) {
  const issues = [];
  let qualityScore = 10;
  
  // Check if question is too generic
  const genericPatterns = [
    "What is the subject of this",
    "What is the purpose",
    "What is the function",
    "main theme"
  ];
  
  if (genericPatterns.some(pattern => questionText.includes(pattern))) {
    issues.push("Question is too generic or formulaic");
    qualityScore -= 2;
  }
  
  // Check if choices are too similar or obviously wrong
  if (choices && choices.length > 0) {
    const choiceTexts = choices.map(c => typeof c === 'string' ? c : c.toString());
    if (choiceTexts.some(c => c === "Option A" || c === "Option B")) {
      issues.push("Placeholder choices detected");
      qualityScore -= 3;
    }
  }
  
  // Check explanation quality
  if (explanation && explanation.length < 50) {
    issues.push("Explanation is too brief");
    qualityScore -= 1;
  }
  
  return { issues, qualityScore };
}

// Function to provide improvement suggestions
function suggestImprovements(question, issues) {
  const suggestions = [];
  
  if (issues.includes("Incorrect answer")) {
    suggestions.push("Recalculate the correct answer and update the question");
  }
  
  if (issues.includes("Explanation doesn't match the correct solution process")) {
    suggestions.push("Rewrite explanation to accurately reflect the solution steps");
  }
  
  if (issues.includes("Question is too generic or formulaic")) {
    suggestions.push("Rewrite with more specific context or scenario");
  }
  
  if (issues.includes("Placeholder choices detected")) {
    suggestions.push("Create more plausible distractor options");
  }
  
  if (issues.includes("Explanation is too brief")) {
    suggestions.push("Expand explanation with more detailed reasoning");
  }
  
  return suggestions;
}

async function assessQuestionQuality() {
  console.log("Assessing question quality in database...\n");
  
  try {
    // Get all approved questions
    const questions = await prisma.question.findMany({
      where: {
        status: "APPROVED",
        isActive: true
      }
    });
    
    console.log(`Analyzing ${questions.length} questions...\n`);
    
    let totalScore = 0;
    let mathIssues = 0;
    let readingWritingIssues = 0;
    const issueReport = [];
    
    for (const question of questions) {
      const choices = JSON.parse(question.choices);
      let assessment;
      
      if (question.subject === "Math") {
        assessment = assessMathAccuracy(
          question.question,
          choices,
          question.answer,
          question.explanation
        );
        
        if (assessment.issues.length > 0) {
          mathIssues++;
        }
      } else {
        assessment = assessReadingWritingQuality(
          question.question,
          choices,
          question.answer,
          question.explanation
        );
        
        if (assessment.issues.length > 0) {
          readingWritingIssues++;
        }
      }
      
      totalScore += assessment.qualityScore;
      
      // Record issues for reporting
      if (assessment.issues.length > 0) {
        const suggestions = suggestImprovements(question, assessment.issues);
        issueReport.push({
          id: question.id,
          subject: question.subject,
          topic: question.topic,
          question: question.question.substring(0, 100) + "...",
          issues: assessment.issues,
          suggestions
        });
      }
    }
    
    // Summary report
    const averageScore = totalScore / questions.length;
    console.log("=== QUESTION QUALITY ASSESSMENT REPORT ===");
    console.log(`Total Questions Analyzed: ${questions.length}`);
    console.log(`Average Quality Score: ${averageScore.toFixed(1)}/10`);
    console.log(`Questions with Math Issues: ${mathIssues}`);
    console.log(`Questions with Reading/Writing Issues: ${readingWritingIssues}`);
    console.log(`Total Issues Found: ${issueReport.length}\n`);
    
    // Detailed issue report
    if (issueReport.length > 0) {
      console.log("=== DETAILED ISSUE REPORT ===");
      issueReport.forEach((report, index) => {
        console.log(`\n${index + 1}. ID: ${report.id}`);
        console.log(`   Subject: ${report.subject} | Topic: ${report.topic}`);
        console.log(`   Question: ${report.question}`);
        console.log(`   Issues:`);
        report.issues.forEach(issue => console.log(`     - ${issue}`));
        console.log(`   Suggestions:`);
        report.suggestions.forEach(suggestion => console.log(`     - ${suggestion}`));
      });
    } else {
      console.log("No significant issues found!");
    }
    
    // Subject distribution
    console.log("\n=== SUBJECT DISTRIBUTION ===");
    const subjectCounts = await prisma.question.groupBy({
      by: ['subject'],
      _count: true,
      where: {
        status: "APPROVED",
        isActive: true
      }
    });
    
    subjectCounts.forEach(({ subject, _count }) => {
      console.log(`  ${subject}: ${_count}`);
    });
    
    console.log("\n✅ Quality assessment completed!");
    
  } catch (error) {
    console.error("❌ Error assessing question quality:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  assessQuestionQuality()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}