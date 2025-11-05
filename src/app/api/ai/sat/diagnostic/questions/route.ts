// File: src/app/api/ai/sat/diagnostic/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SATQuestionGenerator } from "@/lib/sat-question-generator";
// Removed unused DifficultyLevel import

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
    const { section, topic, difficulty, count } = body;

    // Validate inputs
    if (!section) {
      return NextResponse.json(
        { error: "Section is required" },
        { status: 400 }
      );
    }

    // Get personalized questions from the question bank
    const questions = await SATQuestionGenerator.getPersonalizedQuestions(
      session.user.id,
      {
        section,
        topic,
        difficulty: difficulty || "INTERMEDIATE",
        count: count || 5
      }
    );

    // Transform questions to match the expected format for the frontend
    const transformedQuestions = questions.map((q: any) => {
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
      
      // Additional fallback: Try to match by finding the choice that contains the answer
      if (correctAnswerIndex === -1) {
        correctAnswerIndex = choicesArray.findIndex((choice: string) => 
          choice.trim().toLowerCase().includes(normalizedAnswer) ||
          normalizedAnswer.includes(choice.trim().toLowerCase())
        );
      }
      
      // Additional fallback: If answer is already a number, use it directly
      if (correctAnswerIndex === -1 && !isNaN(Number(q.answer)) && Number(q.answer) >= 0 && Number(q.answer) < choicesArray.length) {
        correctAnswerIndex = Number(q.answer);
      }
      
      // Additional fallback: Try partial matching for more flexibility
      if (correctAnswerIndex === -1) {
        correctAnswerIndex = choicesArray.findIndex((choice: string) => {
          const choiceLower = choice.trim().toLowerCase();
          const answerLower = normalizedAnswer.toLowerCase();
          // Check if either contains the other
          return choiceLower.includes(answerLower) || answerLower.includes(choiceLower);
        });
      }
      
      // If still not found, log detailed error but don't default to 0
      // Instead, use a more intelligent approach to select a reasonable answer
      if (correctAnswerIndex === -1) {
        console.error(`Could not match answer "${q.answer}" to choices:`, choicesArray);
        // Try to find a numeric answer in the choices
        const numericChoices = choicesArray.map((choice, index) => {
          const match = choice.trim().match(/[\d.]+/);
          return match ? { index, value: parseFloat(match[0]) } : null;
        }).filter(Boolean) as { index: number; value: number }[];
        
        if (numericChoices.length > 0 && !isNaN(Number(q.answer))) {
          const targetValue = parseFloat(q.answer.toString());
          // Find the closest numeric match
          numericChoices.sort((a, b) => Math.abs(a.value - targetValue) - Math.abs(b.value - targetValue));
          correctAnswerIndex = numericChoices[0].index;
        } else {
          // As a last resort, randomly select an answer that isn't the first one
          // to avoid the pattern of always selecting the first option
          const validIndices = choicesArray.map((_, index) => index).filter(index => index !== 0);
          if (validIndices.length > 0) {
            correctAnswerIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
          } else {
            // If there's only one choice, use that; otherwise avoid always picking the first
            correctAnswerIndex = choicesArray.length > 1 ? 1 : 0;
          }
        }
        console.log(`Using fallback answer index: ${correctAnswerIndex} for question ${q.id}`);
      }
      
      return {
        id: q.id,
        question: q.question,
        choices: choicesArray,
        answer: correctAnswerIndex, // Keep as index for consistency
        explanation: q.explanation,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        source: "database"
      };
    });

    // Filter out any questions without IDs
    const validQuestions = transformedQuestions.filter((q) => q && q.id);
    
    // Check if we have any valid questions
    if (validQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions available for this topic" },
        { status: 404 }
      );
    }

    return NextResponse.json({ questions: validQuestions });
  } catch (error: any) {
    console.error("SAT diagnostic questions error:", error);
    
    return NextResponse.json(
      { error: "Failed to generate diagnostic questions" },
      { status: 500 }
    );
  }
}