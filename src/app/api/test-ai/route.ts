import { NextResponse } from "next/server";
import { EngagingTutorAgent } from "@/lib/ai/tutor-engine";

export async function GET() {
  try {
    const tutorAgent = new EngagingTutorAgent();
    
    // Test a simple AI response
    const response = await tutorAgent.quickResponse("Say hello and introduce yourself as an AI tutor");
    
    return NextResponse.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("AI test error:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}