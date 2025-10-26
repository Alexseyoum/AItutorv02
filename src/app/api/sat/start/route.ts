// src/app/api/sat/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { questionPrompt } from "@/lib/prompts/questionPrompt";
import { callLLM } from "@/lib/utils/llmClient";
import { prisma } from "@/lib/prisma";

function generateFallbackQuestions(section: string, topic: string, count: number) {
  const questions = [];
  const isMath = section === "math";
  
  for (let i = 0; i < count; i++) {
    if (isMath) {
      questions.push({
        question: `Math practice question ${i + 1} for ${topic}. If x + 5 = 12, what is the value of x?`,
        choices: ["5", "7", "12", "17"],
        answer: "7",
        explanation: "To solve x + 5 = 12, subtract 5 from both sides: x = 12 - 5 = 7.",
        difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard"
      });
    } else {
      questions.push({
        question: `Reading practice question ${i + 1} for ${topic}. Which word best describes the tone of this passage?`,
        choices: ["Optimistic", "Pessimistic", "Neutral", "Aggressive"],
        answer: "Neutral",
        explanation: "The passage maintains an objective, neutral tone throughout without expressing strong emotions.",
        difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard"
      });
    }
  }
  
  return questions;
}

function fixTruncatedJSON(jsonStr: string): string {
  let fixedJson = jsonStr.replace(/,\s*}$/, "}").replace(/,\s*]$/, "]");
  
  fixedJson = fixedJson.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
  
  const openBraces = (fixedJson.match(/{/g) || []).length;
  const closeBraces = (fixedJson.match(/}/g) || []).length;
  const openBrackets = (fixedJson.match(/\[/g) || []).length;
  const closeBrackets = (fixedJson.match(/]/g) || []).length;
  
  for (let i = closeBraces; i < openBraces; i++) {
    fixedJson += "}";
  }
  
  
  for (let i = closeBrackets; i < openBrackets; i++) {
    fixedJson += "]";
  }
  
  return fixedJson;
}

function cleanLLMResponse(response: string): string {
  const startIdx = response.indexOf("{");
  const endIdx = response.lastIndexOf("}");
  
  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
    return response;
  }
  
  return response.slice(startIdx, endIdx + 1);
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

    if (!section || !topic) {
      return NextResponse.json(
        { error: "Section and topic are required" },
        { status: 400 }
      );
    }

    const subject = section === "math" ? "Math" : "Reading and Writing";
    const questionCount = 10;

    const prompt = questionPrompt({
      grade: 11,
      topic,
      difficulty: "medium",
      subject,
      goal: "SAT",
      questionCount,
    });

    const llmResponse = await callLLM(prompt);

    let data;
    try {
      data = JSON.parse(llmResponse);
    } catch {
      try {
        const cleanedResponse = cleanLLMResponse(llmResponse);
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON object found in response");
        }
      } catch {
        const startIdx = llmResponse.indexOf("{");
        const endIdx = llmResponse.lastIndexOf("}");
        
        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
          throw new Error("No valid JSON found in LLM response");
        }
        
        const jsonPart = llmResponse.slice(startIdx, endIdx + 1);
        
        try {
          data = JSON.parse(jsonPart);
        } catch {
          let fixedJson = jsonPart;
          
          try {
            fixedJson = fixTruncatedJSON(jsonPart);
            data = JSON.parse(fixedJson);
          } catch {
            const aggressiveFix = jsonPart
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
              .replace(/\\([^"\\/bfnrtu])/g, '$1')
              .replace(/,\s*([}\]])/g, '$1');
            
            try {
              data = JSON.parse(aggressiveFix);
            } catch (_finalError) {
              console.error("All JSON parsing attempts failed, using fallback questions");
              
              data = {
                questions: generateFallbackQuestions(section, topic, questionCount)
              };
            }
          }
        }
      }
    }

    if (!data.questions || !Array.isArray(data.questions)) {
      data = {
        questions: generateFallbackQuestions(section, topic, questionCount)
      };
    }

    const questions = data.questions.map((q: {
      question: string;
      choices: string[];
      answer: string;
      explanation: string;
      difficulty?: string;
    }, i: number) => {
      // Normalize answer to handle edge cases
      let correctAnswerIndex = -1;
      const normalizedAnswer = q.answer.trim().toLowerCase();
      
      // Try exact match first
      correctAnswerIndex = q.choices.findIndex(choice => 
        choice.trim().toLowerCase() === normalizedAnswer
      );
      
      // If not found, try to extract just the answer part (in case AI returns "C) 7" format)
      if (correctAnswerIndex === -1) {
        // Remove option letters like "A)", "B)", etc.
        const cleanedAnswer = normalizedAnswer.replace(/^[a-d]\)\s*/i, '');
        correctAnswerIndex = q.choices.findIndex(choice => 
          choice.trim().toLowerCase() === cleanedAnswer ||
          choice.trim().toLowerCase().includes(cleanedAnswer)
        );
      }
      
      // If still not found, default to 0 and log error
      if (correctAnswerIndex === -1) {
        console.error(`Could not match answer "${q.answer}" to choices:`, q.choices);
        correctAnswerIndex = 0;
      }
      
      return {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`,
        question: q.question,
        choices: q.choices,
        correctAnswer: correctAnswerIndex,
        explanation: q.explanation,
        topic,
        difficulty: (q.difficulty || "medium") as "easy" | "medium" | "hard"
      };
    });

    const practiceSession = await prisma.sATPracticeSession.create({
      data: {
        userId: session.user.id,
        section,
        score: 0,
        maxScore: questions.length,
        answers: { questions },
        timeSpent: 0
      }
    });

    return NextResponse.json({
      sessionId: practiceSession.id,
      questions
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