import { NextRequest, NextResponse } from "next/server";
import { EngagingTutorAgent } from "@/lib/ai/tutor-engine";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { message, concept, profile } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const tutorAgent = new EngagingTutorAgent();

    // If it's a concept explanation request
    if (concept && profile) {
      const explanation = await tutorAgent.generateExplanation(concept, profile);
      return NextResponse.json({ 
        type: "explanation",
        data: explanation 
      });
    }

    // For general chat
    const response = await tutorAgent.quickResponse(message);
    
    return NextResponse.json({ 
      type: "chat",
      data: { message: response }
    });

  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}