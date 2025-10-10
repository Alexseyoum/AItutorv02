import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('🔍 GET: Loading messages for session:', sessionId);
    
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session) {
      console.log('❌ GET: No session found - user not authenticated');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ GET: User authenticated:', session.user.id);

    const chatSession = await prisma.chatSession.findFirst({
      where: { 
        id: sessionId,
        userId: session.user.id 
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chatSession) {
      console.log('❌ GET: Chat session not found for user:', session.user.id, 'sessionId:', sessionId);
      
      // Check if session exists but belongs to different user
      const sessionExists = await prisma.chatSession.findFirst({
        where: { id: sessionId }
      });
      
      if (sessionExists) {
        console.log('⚠️ GET: Session exists but belongs to different user:', sessionExists.userId);
      } else {
        console.log('❌ GET: Session does not exist in database at all');
      }
      
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log('✅ GET: Found session with', chatSession.messages.length, 'messages');
    
    if (chatSession.messages.length === 0) {
      console.log('ℹ️ GET: Session has no messages, checking database directly...');
      const directMessageCount = await prisma.chatMessage.count({
        where: { sessionId: sessionId }
      });
      console.log('📊 GET: Direct database query shows', directMessageCount, 'messages for session:', sessionId);
      
      // List all sessions for this user to help debug
      const userSessions = await prisma.chatSession.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, createdAt: true, _count: { select: { messages: true } } }
      });
      console.log('📋 GET: All user sessions:', userSessions.map(s => ({
        id: s.id,
        title: s.title,
        messageCount: s._count.messages,
        createdAt: s.createdAt
      })));
    } else {
      console.log('📋 GET: Message summary:');
      chatSession.messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.type}: ${msg.content.substring(0, 50)}... (${msg.createdAt})`);
      });
    }
    return NextResponse.json({ session: chatSession });
  } catch (error: unknown) {
    console.error("Error fetching chat session:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat session" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('💾 POST: Saving message to session:', sessionId);
    
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session) {
      console.log('❌ POST: No session found - user not authenticated');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ POST: User authenticated:', session.user.id);

    const body = await request.json();
    const { content, type, metadata } = body;
    console.log('📝 POST: Message data received:', { 
      type, 
      contentLength: content?.length,
      hasMetadata: !!metadata,
      sessionId,
      userId: session.user.id
    });

    // Validate required fields
    if (!content || !type) {
      console.log('❌ POST: Missing required fields - content or type');
      return NextResponse.json(
        { error: "Missing required fields: content and type are required" },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    console.log('🔍 POST: Verifying session ownership...');
    const chatSession = await prisma.chatSession.findFirst({
      where: { 
        id: sessionId,
        userId: session.user.id 
      }
    });

    if (!chatSession) {
      console.log('❌ POST: Chat session not found for user:', session.user.id, 'sessionId:', sessionId);
      
      // Check if session exists at all
      const sessionExists = await prisma.chatSession.findFirst({
        where: { id: sessionId }
      });
      
      if (sessionExists) {
        console.log('⚠️ POST: Session exists but belongs to different user:', sessionExists.userId);
        return NextResponse.json(
          { error: "Session not found or unauthorized access" },
          { status: 403 }
        );
      } else {
        console.log('❌ POST: Session does not exist in database');
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
    }

    console.log('✅ POST: Found session, creating message...');
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: sessionId,
        content,
        type,
        metadata: metadata || undefined
      }
    });

    console.log('✅ POST: Message created with ID:', message.id);

    // Verify the message was actually saved
    const savedMessage = await prisma.chatMessage.findUnique({
      where: { id: message.id }
    });
    console.log('📊 POST: Verification - message exists in DB:', !!savedMessage);
    
    // Count total messages in session after save
    const totalMessages = await prisma.chatMessage.count({
      where: { sessionId: sessionId }
    });
    console.log('📊 POST: Total messages in session after save:', totalMessages);

    // Update session's updatedAt timestamp
    try {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });
      console.log('✅ POST: Session timestamp updated');
    } catch (updateError) {
      console.error('⚠️ POST: Failed to update session timestamp:', updateError);
      // Don't fail the whole operation if timestamp update fails
    }

    return NextResponse.json({ message });
  } catch (error: unknown) {
    console.error("❌ Error saving message:", error);
    
    // More detailed error handling
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      if ('code' in error) {
        console.error("Error code:", (error as any).code);
      }
      if ('meta' in error) {
        console.error("Error meta:", (error as any).meta);
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to save message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}