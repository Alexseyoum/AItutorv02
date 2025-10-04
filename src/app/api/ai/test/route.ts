import { NextRequest, NextResponse } from "next/server";
import { EngagingTutorAgent } from "@/lib/ai/tutor-engine";

export async function GET() {
  try {
    const tutorAgent = new EngagingTutorAgent();
    
    // Test the AI connection with a simple question
    const testResponse = await tutorAgent.quickResponse(
      "Say 'Hello! AI integration is working correctly.' in a friendly way."
    );

    return NextResponse.json({ 
      status: "success",
      message: "AI integration is working!",
      testResponse
    });

  } catch (error) {
    console.error("AI Test error:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "AI integration failed",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}