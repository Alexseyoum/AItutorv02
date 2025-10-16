import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { questionPrompt } from "@/lib/prompts/questionPrompt";
import { callLLM } from "@/lib/utils/llmClient";
import { prisma } from "@/lib/prisma";

// Helper function to fix truncated JSON and escape characters
function fixTruncatedJSON(jsonStr: string): string {
  // Remove trailing commas
  let fixedJson = jsonStr.replace(/,\s*}$/, "}").replace(/,\s*]$/, "]");
  
  // Fix common escape character issues
  // Replace problematic escape sequences
  fixedJson = fixedJson.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1');
  
  // Ensure all quotes are properly escaped
  // This is a simplified approach - in a real scenario, you'd want a more robust JSON fixer
  fixedJson = fixedJson.replace(/([^\\])"/g, '$1\\"');
  fixedJson = fixedJson.replace(/^"/, '\\"');
  
  // Count opening and closing braces/brackets
  const openBraces = (fixedJson.match(/{/g) || []).length;
  const closeBraces = (fixedJson.match(/}/g) || []).length;
  const openBrackets = (fixedJson.match(/\[/g) || []).length;
  const closeBrackets = (fixedJson.match(/]/g) || []).length;
  
  // Add missing closing braces
  for (let i = closeBraces; i < openBraces; i++) {
    fixedJson += "}";
  }
  
  // Add missing closing brackets
  for (let i = closeBrackets; i < openBrackets; i++) {
    fixedJson += "]";
  }
  
  return fixedJson;
}

// Helper function to clean and fix JSON response from LLM
function cleanLLMResponse(response: string): string {
  // Remove any text before the first brace and after the last brace
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
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      grade = 11,
      topic = "Algebra: Linear Equations",
      subject = "Math",
      difficulty = "medium",
      goal = "SAT",
      questionCount = 1,
    } = body;

    const prompt = questionPrompt({
      grade,
      topic,
      difficulty,
      subject,
      goal,
      questionCount,
    });

    console.log("Sending prompt to LLM:", prompt);

    const llmResponse = await callLLM(prompt);
    
    console.log("LLM response received:", llmResponse);

    // More robust JSON extraction and parsing
    let data;
    try {
      // First try to parse the entire response as JSON
      data = JSON.parse(llmResponse);
    } catch (_parseError) {
      try {
        // Clean the response first
        const cleanedResponse = cleanLLMResponse(llmResponse);
        
        // If that fails, try to extract JSON using regex
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON object found in response");
        }
      } catch (_regexError) {
        // If regex extraction fails, try manual extraction
        const startIdx = llmResponse.indexOf("{");
        const endIdx = llmResponse.lastIndexOf("}");
        
        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
          throw new Error(`No valid JSON found in LLM response. Response preview: ${llmResponse.substring(0, 200)}...`);
        }
        
        const jsonPart = llmResponse.slice(startIdx, endIdx + 1);
        
        try {
          data = JSON.parse(jsonPart);
        } catch (_extractError) {
          // Try to fix common JSON issues in truncated responses
          let fixedJson = jsonPart;
          
          // Try multiple fixing approaches
          try {
            fixedJson = fixTruncatedJSON(jsonPart);
            data = JSON.parse(fixedJson);
          } catch (_fixError) {
            // If that still fails, try a more aggressive approach
            // Remove all non-JSON characters and try to reconstruct
            const aggressiveFix = jsonPart
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
              .replace(/\\([^"\\/bfnrtu])/g, '$1') // Fix bad escape sequences
              .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
            
            data = JSON.parse(aggressiveFix);
          }
        }
      }
    }

    // Validate structure
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid response format from LLM - missing questions array");
    }

    // Validate that we have the expected number of questions
    if (data.questions.length === 0) {
      throw new Error("LLM returned empty questions array");
    }

    // Validate each question has required fields
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.question || !q.choices || !q.answer || !q.explanation) {
        throw new Error(`Question ${i + 1} is missing required fields (question, choices, answer, or explanation)`);
      }
      
      if (!Array.isArray(q.choices) || q.choices.length < 2) {
        throw new Error(`Question ${i + 1} has invalid choices array`);
      }
    }

    // Add metadata (timestamps, IDs)
    const finalized = data.questions.map((q: { id?: string; topic: string; subject: string; difficulty: string; question: string; choices: string[]; answer: string; explanation: string }, i: number) => ({
      ...q,
      id: q.id || `gen_${Date.now()}_${i}`,
      createdAt: new Date().toISOString(),
      status: "pending_review",
    }));

    return NextResponse.json({ success: true, questions: finalized });
  } catch (error: unknown) {
    console.error("Question generation failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to generate questions", 
        error: error instanceof Error ? error.message : "Unknown error",
        // Don't expose internal details in production
        ...(process.env.NODE_ENV === "development" ? { stack: error instanceof Error ? error.stack : undefined } : {})
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch generated questions (for admin review)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Only admins can fetch all questions
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const questions = await prisma.question.findMany({
      where: {
        status: "pending_review"
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Limit to 50 most recent pending questions
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: unknown) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch questions", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}