import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
// Remove the incorrect import
// import { ChatSession, ChatMessage } from "@prisma/client";

// Define the types based on the Prisma schema
type ChatSession = Awaited<ReturnType<typeof prisma.chatSession.findMany>>[number];
type ChatMessage = Awaited<ReturnType<typeof prisma.chatMessage.findMany>>[number];

export async function GET(request: NextRequest) {
  try {
    console.log('📋 SESSIONS: Loading chat sessions...');
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session) {
      console.log('❌ SESSIONS: No authentication session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ SESSIONS: User authenticated:', session.user.id);

    const chatSessions = await prisma.chatSession.findMany({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      include: {
        _count: {
          select: { messages: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1 // Just get the first message for preview
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Enhance session data with better titles
    const enhancedSessions = chatSessions.map((chatSession: ChatSession & { 
      _count: { messages: number },
      messages: ChatMessage[]
    }) => {
      let displayTitle = chatSession.title || "Untitled Chat";
      
      // If we have a topic, use that as the title
      if (chatSession.topic) {
        displayTitle = chatSession.topic;
      } 
      // If we have a first message, use the first few words as title
      else if (chatSession.messages && chatSession.messages.length > 0) {
        const firstMessage = chatSession.messages[0];
        if (firstMessage.content) {
          // Get first 40 characters and add ellipsis if needed
          displayTitle = firstMessage.content.length > 40 
            ? firstMessage.content.substring(0, 40) + "..." 
            : firstMessage.content;
        }
      }
      
      return {
        ...chatSession,
        displayTitle
      };
    });

    console.log('📋 SESSIONS: Found', chatSessions.length, 'sessions');
    chatSessions.forEach((chatSession: ChatSession & { 
      _count: { messages: number }
    }, index) => {
      console.log(`  ${index + 1}. ${chatSession.id} - "${chatSession.title}" - ${chatSession._count.messages} messages`);
    });

    return NextResponse.json({ sessions: enhancedSessions });
  } catch (error: unknown) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🆕 SESSIONS: Creating new chat session...');
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session) {
      console.log('❌ SESSIONS: No authentication session for POST');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ SESSIONS: User authenticated for POST:', session.user.id);

    const { title, topic } = await request.json();
    console.log('🆕 SESSIONS: Creating session with title:', title, 'topic:', topic);

    const chatSession = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        title: title || "New Chat Session",
        topic: topic || null
      }
    });

    console.log('✅ SESSIONS: Session created successfully:', chatSession.id);
    return NextResponse.json({ session: chatSession });
  } catch (error: unknown) {
    console.error("❌ SESSIONS: Error creating chat session:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}