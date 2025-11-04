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
      
      // Normalize answer to handle edge cases
      let correctAnswerIndex = -1;
      const normalizedAnswer = q.answer?.trim().toLowerCase() || '';
      
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
      
      // If still not found, log detailed error and use the first choice as fallback
      if (correctAnswerIndex === -1) {
        console.error(`Could not match answer "${q.answer}" to choices:`, choicesArray);
        // Instead of defaulting to 0, we'll use a more robust approach
        // If the answer is a number and within range, use it as index
        if (!isNaN(Number(q.answer)) && Number(q.answer) >= 0 && Number(q.answer) < choicesArray.length) {
          correctAnswerIndex = Number(q.answer);
        } else {
          // As a last resort, default to 0 but log this clearly
          correctAnswerIndex = 0;
          console.warn(`Using first choice as answer fallback for question ID ${q.id}`);
        }
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