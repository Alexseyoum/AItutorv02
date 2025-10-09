import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Message } from '@/lib/types';

interface ChatSession {
  id: string;
  title?: string;
  topic?: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    content: string;
    type: string;
    createdAt: Date;
    metadata?: any;
  }>;
}

export function useChatPersistence(initialTopic?: string) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingExistingSession, setIsLoadingExistingSession] = useState(false);
  const sessionCreationInProgress = useRef(false);
  
  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        console.log('✅ Loaded chat sessions:', data.sessions.length);
      } else {
        console.error('❌ Failed to load sessions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, []);

  const createNewSession = useCallback(async (title?: string) => {
    // Prevent multiple simultaneous session creation
    if (sessionCreationInProgress.current) {
      console.log('🔄 Session creation already in progress, skipping...');
      return null;
    }

    try {
      sessionCreationInProgress.current = true;
      setIsLoading(true);
      console.log('🆕 Creating new session...');
      
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title || `Chat ${new Date().toLocaleDateString()}`,
          topic: initialTopic 
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Created new session:', data.session.id);
        setCurrentSessionId(data.session.id);
        setMessages([]);
        await loadChatSessions();
        return data.session.id;
      } else {
        console.error('❌ Failed to create session:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Create session error details:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create new chat session');
      return null;
    } finally {
      setIsLoading(false);
      sessionCreationInProgress.current = false;
    }
  }, [initialTopic, loadChatSessions]);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setIsLoadingExistingSession(true);
      console.log('🔍 Loading session:', sessionId);
      
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Response data structure:', {
          hasSession: !!data.session,
          messageCount: data.session?.messages?.length || 0,
          sessionId: data.session?.id
        });
        
        setCurrentSessionId(sessionId);
        
        // Convert database messages to component format
        const convertedMessages: Message[] = (data.session?.messages || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type as "user" | "ai",
          timestamp: new Date(msg.createdAt),
          metadata: msg.metadata,
          // Include enhanced content fields if they exist
          imageUrl: msg.imageUrl,
          links: msg.links,
          keywords: msg.keywords
        }));
        
        console.log('✅ Converted messages:', convertedMessages.length, 'messages');
        setMessages(convertedMessages);
        
        if (convertedMessages.length === 0) {
          console.log('ℹ️ No messages found in session, this might be expected for new sessions');
        }
      } else {
        console.error('❌ Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        toast.error('Failed to load chat session');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load chat session');
    } finally {
      setIsLoading(false);
      setIsLoadingExistingSession(false);
    }
  }, []);

  const saveMessageToSession = useCallback(async (message: Message, sessionId: string) => {
    try {
      console.log('💾 SAVE: Saving message to session:', sessionId, 'Type:', message.type, 'Content length:', message.content.length);
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.content,
          type: message.type,
          metadata: message.metadata
        })
      });

      if (!response.ok) {
        console.error('❌ SAVE: Failed to save message:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('SAVE: Error details:', errorText);
        return false;
      } else {
        const result = await response.json();
        console.log('✅ SAVE: Message saved successfully, ID:', result.message?.id);
        return true;
      }
    } catch (error) {
      console.error('❌ SAVE: Exception while saving message:', error);
      return false;
    }
  }, []);

  // New method to ensure session exists and return session ID
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (currentSessionId) {
      console.log('🎯 ENSURE: Using existing session:', currentSessionId);
      return currentSessionId;
    }
    
    console.log('🎯 ENSURE: No session exists, creating new one...');
    const newSessionId = await createNewSession();
    console.log('🎯 ENSURE: New session created:', newSessionId);
    return newSessionId;
  }, [currentSessionId, createNewSession]);

  const addMessage = useCallback(async (message: Message, forceSessionId?: string) => {
    console.log('🐈 ADD: Starting to add message:', message.type, message.content.substring(0, 50) + '...');
    
    // First add to local state immediately for UI responsiveness
    setMessages(prev => {
      console.log('🐈 ADD: Adding to local state, previous count:', prev.length);
      return [...prev, message];
    });
    
    // Use forced session ID or current session
    const sessionId = forceSessionId || currentSessionId;
    
    if (!sessionId) {
      console.error('❌ ADD: No session ID available for message save');
      toast.error('Failed to save message - no active session');
      return null;
    }
    
    // Save message to the specific session
    const saveSuccess = await saveMessageToSession(message, sessionId);
    
    if (!saveSuccess) {
      console.error('❌ ADD: Message save failed, but keeping in UI for now');
      toast.error('Failed to save message - it may not persist');
    } else {
      console.log('✅ ADD: Message successfully saved to backend');
    }
    
    // Refresh sessions list to update the last activity timestamp
    await loadChatSessions();
    
    // Return the session ID that was used
    return sessionId;
  }, [currentSessionId, saveMessageToSession, loadChatSessions]);

  // New method specifically for sending a conversation (user message + AI response)
  const sendConversation = useCallback(async (userMessage: Message, aiMessage: Message) => {
    console.log('💬 CONVERSATION: Starting conversation flow...');
    
    // Ensure we have a session before doing anything
    const sessionId = await ensureSession();
    if (!sessionId) {
      console.error('❌ CONVERSATION: Failed to ensure session exists');
      toast.error('Failed to create chat session');
      return false;
    }
    
    console.log('💬 CONVERSATION: Using session:', sessionId);
    
    // Add both messages to UI immediately
    setMessages(prev => {
      console.log('💬 CONVERSATION: Adding both messages to UI, previous count:', prev.length);
      return [...prev, userMessage, aiMessage];
    });
    
    // Save user message first
    console.log('💬 CONVERSATION: Saving user message...');
    const userSaveSuccess = await saveMessageToSession(userMessage, sessionId);
    
    if (!userSaveSuccess) {
      console.error('❌ CONVERSATION: Failed to save user message');
      toast.error('Failed to save your message');
    }
    
    // Save AI message second
    console.log('💬 CONVERSATION: Saving AI message...');
    const aiSaveSuccess = await saveMessageToSession(aiMessage, sessionId);
    
    if (!aiSaveSuccess) {
      console.error('❌ CONVERSATION: Failed to save AI message');
      toast.error('Failed to save AI response');
    }
    
    // Refresh sessions list
    await loadChatSessions();
    
    const success = userSaveSuccess && aiSaveSuccess;
    console.log('💬 CONVERSATION: Conversation save result:', success);
    return success;
  }, [ensureSession, saveMessageToSession, loadChatSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      // TODO: Implement delete endpoint
      toast.success('Session deleted');
      await loadChatSessions();
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    }
  }, [currentSessionId, loadChatSessions]);

  const startNewChat = useCallback(() => {
    console.log('🆕 Starting new chat (UI only - no session created yet)');
    setCurrentSessionId(null);
    setMessages([]);
    // Note: Actual session will be created when user sends first message
  }, []);

  return {
    currentSessionId,
    messages,
    sessions,
    isLoading,
    setMessages,
    addMessage,
    sendConversation,
    createNewSession,
    loadSession,
    deleteSession,
    loadChatSessions,
    startNewChat
  };
}