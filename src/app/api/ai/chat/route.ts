import { NextRequest, NextResponse } from "next/server";
import { EngagingTutorAgent } from "@/lib/ai/tutor-engine";
import { auth } from "@/lib/auth";
import { StudentAnalytics } from "@/lib/student-analytics";
import { ActivityType } from "@/generated/prisma";
import { contextManager } from "@/lib/ai/context-manager";

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

    const { message, history, concept, profile } = await request.json();

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
        metadata: { 
          message: message.substring(0, 100),
          hasHistory: !!history && history.length > 0
        }
      }
    );

    // If it's a concept explanation request (legacy support)
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

    // Handle conversational chat with history
    if (history && Array.isArray(history) && history.length > 0) {
      console.log(`🗣️ Processing conversational chat with ${history.length} history messages`);
      
      // Use enhanced response for full multimodal capabilities
      const enhancedResponse = await tutorAgent.generateEnhancedResponse(
        message,
        history,
        profile ? {
          gradeLevel: profile.gradeLevel,
          learningStyle: profile.learningStyle,
          interests: profile.interests,
          pastEngagement: profile.pastEngagement || 0
        } : undefined
      );
      
      return NextResponse.json({ 
        type: "chat",
        data: { 
          message: enhancedResponse.content,
          imageUrl: enhancedResponse.imageUrl,
          links: enhancedResponse.links,
          keywords: enhancedResponse.keywords,
          funFact: enhancedResponse.funFact,
          analogy: enhancedResponse.analogy
        },
        meta: {
          historyLength: history.length,
          contextOptimized: true,
          hasImage: !!enhancedResponse.imageUrl,
          hasLinks: !!(enhancedResponse.links && enhancedResponse.links.length > 0)
        }
      });
    }

    // Fallback to simple chat (backward compatibility) - also use enhanced response
    const enhancedResponse = await tutorAgent.generateEnhancedResponse(
      message,
      [],
      profile ? {
        gradeLevel: profile.gradeLevel,
        learningStyle: profile.learningStyle,
        interests: profile.interests,
        pastEngagement: profile.pastEngagement || 0
      } : undefined
    );
    
    return NextResponse.json({ 
      type: "chat",
      data: { 
        message: enhancedResponse.content,
        imageUrl: enhancedResponse.imageUrl,
        links: enhancedResponse.links,
        keywords: enhancedResponse.keywords,
        funFact: enhancedResponse.funFact,
        analogy: enhancedResponse.analogy
      },
      meta: {
        historyLength: 0,
        contextOptimized: false,
        hasImage: !!enhancedResponse.imageUrl,
        hasLinks: !!(enhancedResponse.links && enhancedResponse.links.length > 0)
      }
    });

  } catch (error: unknown) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}