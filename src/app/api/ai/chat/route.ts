import { NextRequest, NextResponse } from "next/server";
import { EngagingTutorAgent } from "@/lib/ai/tutor-engine";
import { auth } from "@/lib/auth";
import { StudentAnalytics } from "@/lib/student-analytics";
import { ActivityType } from "@/generated/prisma";

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

    // Track the chat activity
    await StudentAnalytics.trackActivity(
      session.user.id,
      ActivityType.CHAT_MESSAGE,
      {
        topic: concept || 'General Chat',
        subject: profile?.subjects?.[0] || 'General',
        metadata: { message: message.substring(0, 100) } // Store first 100 chars
      }
    );

    // If it's a concept explanation request
    if (concept && profile) {
      const explanation = await tutorAgent.generateExplanation(concept, profile);
      
      // Track explanation request
      await StudentAnalytics.trackActivity(
        session.user.id,
        ActivityType.EXPLANATION_REQUESTED,
        {
          topic: concept,
          subject: profile.subjects?.[0] || 'General'
        }
      );
      
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