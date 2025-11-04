// src/app/api/sat/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SATQuestionGenerator } from "@/lib/sat-question-generator";
import { QuestionBankService } from "@/lib/question-bank";

// Helper function to map section to subject
function mapSectionToSubject(section: string): string {
  switch (section.toLowerCase()) {
    case "math":
      return "Math";
    case "reading":
      return "Reading";
    case "writing":
      return "Writing";
    default:
      return "Math"; // Default to Math
  }
}

// Helper function to get default topic for section
function getDefaultTopicForSection(section: string): string {
  switch (section.toLowerCase()) {
    case "math":
      return "Algebra: Linear Equations";
    case "reading":
      return "Reading Comprehension";
    case "writing":
      return "Grammar: Sentence Structure";
    default:
      return "Algebra: Linear Equations";
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { section, topic } = body;

    console.log("SAT start route called with:", { section, topic });

    if (!section || !topic) {
      return NextResponse.json(
        { error: "Section and topic are required" },
        { status: 400 }
      );
    }

    const questionCount = 10;

    // Map section to subject
    const subject = mapSectionToSubject(section);
    
    // If no topic specified, use a default one based on section
    const questionTopic = topic || getDefaultTopicForSection(section);
    
    // If no difficulty specified, use intermediate as default
    const questionDifficulty = "INTERMEDIATE";
    
    console.log("Getting questions with:", { subject, questionTopic, questionDifficulty, questionCount });
    
    // Get questions from the question bank with retry logic
    let questions: any[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && questions.length === 0) {
      try {
        questions = await SATQuestionGenerator.getQuestions(
          session.user.id,
          subject,
          questionTopic,
          questionDifficulty,
          questionCount
        );
        console.log("Got questions from generator:", questions.length);
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed to get questions:`, error);
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
        // If we've exhausted retries, we'll try the direct approach below
      }
    }
    
    // If we still don't have questions, try a direct approach
    if (questions.length === 0) {
      console.log("Trying direct approach to get questions...");
      try {
        const directQuestions = await QuestionBankService.getQuestionsByCriteria(
          subject,
          questionTopic,
          questionDifficulty,
          questionCount
        );
        
        // Transform to match expected format
        questions = directQuestions.map((q: any) => ({
          id: q.id,
          question: q.question,
          choices: q.choices,
          answer: q.answer,
          explanation: q.explanation,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty
        }));
        console.log("Got questions from direct approach:", questions.length);
      } catch (directError) {
        console.error("Direct approach also failed:", directError);
      }
    }

    // Check if we have any questions
    if (questions.length === 0) {
      // Special handling for Reading section - try alternative topics
      if (section.toLowerCase() === 'reading') {
        console.log("No questions found for Reading, trying alternative topics...");
        const alternativeTopics = [
          "Reading Comprehension: Literature",
          "Reading Comprehension: History",
          "Reading Comprehension: Science"
        ];
        
        for (const altTopic of alternativeTopics) {
          try {
            console.log(`Trying alternative topic: ${altTopic}`);
            const altQuestions = await QuestionBankService.getQuestionsByCriteria(
              subject,
              altTopic,
              questionDifficulty,
              questionCount
            );
            
            if (altQuestions.length > 0) {
              console.log(`Found ${altQuestions.length} questions for ${altTopic}`);
              questions = altQuestions;
              break;
            }
          } catch (altError) {
            console.error(`Failed to get questions for ${altTopic}:`, altError);
          }
        }
      }
      
      // If we still don't have questions, create mock questions as fallback
      if (questions.length === 0) {
        console.warn("No questions available, creating mock questions as fallback");
        const mockQuestions: any[] = [];
        for (let i = 0; i < questionCount; i++) {
          mockQuestions.push({
            id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
            question: `What is 2 + 2? (Mock practice question #${i + 1} for ${questionTopic})`,
            choices: JSON.stringify(["3", "4", "5", "6"]),
            answer: "4",
            explanation: "This is a mock question because no real questions are available in the database.",
            subject: subject,
            topic: questionTopic,
            difficulty: questionDifficulty
          });
        }
        questions = mockQuestions;
      }
    }

    // Transform questions to match the expected format
    const formattedQuestions = questions
      .filter((q: any) => q && q.id && typeof q.id === 'string' && q.id.length > 0) // Filter out any undefined or invalid questions
      .map((q: any, _i: number) => {
      // Ensure choices is an array
      let choicesArray: string[] = [];
      if (typeof q.choices === 'string') {
        try {
          choicesArray = JSON.parse(q.choices);
        } catch (e) {
          console.error("Error parsing choices:", e);
          choicesArray = [];
        }
      } else if (Array.isArray(q.choices)) {
        choicesArray = q.choices;
      }
      
      // Skip questions with no choices
      if (!Array.isArray(choicesArray) || choicesArray.length === 0) {
        console.warn("Skipping question with no valid choices:", q.id);
        return null;
      }
      
      // Normalize answer to handle edge cases - convert string answer to index
      let correctAnswerIndex = -1;
      const normalizedAnswer = q.answer?.toString()?.trim().toLowerCase() || '';
      
      // Try exact match first
      correctAnswerIndex = choicesArray.findIndex((choice: string) => 
        choice.trim().toLowerCase() === normalizedAnswer
      );
      
      // If not found, try to extract just the answer part (in case AI returns "C) 7" format)
      if (correctAnswerIndex === -1) {
        // Remove option letters like "A)", "B)", etc.
        const cleanedAnswer = normalizedAnswer.replace(/^[a-d]\)\s*/i, '');
        correctAnswerIndex = choicesArray.findIndex((choice: string) => 
          choice.trim().toLowerCase() === cleanedAnswer ||
          choice.trim().toLowerCase().includes(cleanedAnswer)
        );
      }
      
      // Additional fallback: If answer is already a number, use it directly
      if (correctAnswerIndex === -1 && !isNaN(Number(q.answer)) && Number(q.answer) >= 0 && Number(q.answer) < choicesArray.length) {
        correctAnswerIndex = Number(q.answer);
      }
      
      // If still not found, default to 0 and log error
      if (correctAnswerIndex === -1) {
        console.error(`Could not match answer "${q.answer}" to choices:`, choicesArray);
        correctAnswerIndex = 0;
      }
      
      // Map difficulty to expected values
      let difficulty: "easy" | "medium" | "hard" = "medium";
      if (q.difficulty) {
        const lowerDiff = q.difficulty.toLowerCase();
        if (lowerDiff.includes("easy") || lowerDiff === "beginner") {
          difficulty = "easy";
        } else if (lowerDiff.includes("hard") || lowerDiff.includes("advanced")) {
          difficulty = "hard";
        } else {
          difficulty = "medium";
        }
      }
      
      return {
        id: q.id,
        question: q.question || "",
        choices: choicesArray,
        correctAnswer: correctAnswerIndex,
        explanation: q.explanation || "",
        topic: q.topic || questionTopic,
        difficulty: difficulty
      };
    })
    .filter((q: any) => {
      return q && 
        typeof q === 'object' && 
        q.id && 
        typeof q.id === 'string' && 
        q.id.length > 0 &&
        q.question && 
        typeof q.question === 'string' && 
        q.question.length > 0 &&
        Array.isArray(q.choices) && 
        q.choices.length > 0;
    }); // Filter out malformed questions

    console.log("Formatted questions:", formattedQuestions.length);

    // Check if we have any valid questions - if not, create mock questions as ultimate fallback
    if (formattedQuestions.length === 0) {
      console.warn("No valid formatted questions available, creating mock questions as ultimate fallback");
      const mockQuestions: any[] = [];
      for (let i = 0; i < questionCount; i++) {
        mockQuestions.push({
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
          question: `What is 2 + 2? (Mock practice question #${i + 1} for ${questionTopic})`,
          choices: ["3", "4", "5", "6"],
          correctAnswer: 1,
          explanation: "This is a mock question because no real questions are available in the database.",
          topic: questionTopic,
          difficulty: "medium"
        });
      }
      
      // Return mock questions immediately
      return NextResponse.json({
        sessionId: `mock-session-${Date.now()}`,
        questions: mockQuestions
      });
    }

    // Create practice session with fallback for database issues
    let practiceSession;
    try {
      practiceSession = await prisma.sATPracticeSession.create({
        data: {
          userId: session.user.id,
          section,
          score: 0,
          maxScore: formattedQuestions.length,
          answers: { questions: formattedQuestions },
          timeSpent: 0
        }
      });
    } catch (dbError) {
      console.error("Database error creating practice session, using fallback:", dbError);
      // Create a temporary session object without database persistence
      practiceSession = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        section,
        score: 0,
        maxScore: formattedQuestions.length,
        answers: { questions: formattedQuestions },
        timeSpent: 0,
        completedAt: null,
        createdAt: new Date()
      };
    }

    console.log("Created practice session:", practiceSession.id);

    return NextResponse.json({
      sessionId: practiceSession.id,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error("SAT practice start error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to start practice session", details: errorMessage },
      { status: 500 }
    );
  }
}
