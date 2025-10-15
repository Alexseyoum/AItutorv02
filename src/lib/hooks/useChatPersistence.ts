import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Message } from '@/lib/types';
import { Logger } from '@/lib/logger';

interface ChatSession {
  id: string;
  title?: string;
  displayTitle?: string;
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
        Logger.info('✅ Loaded chat sessions', { count: data.sessions.length });
      } else {
        Logger.error('❌ Failed to load sessions', new Error(`HTTP ${response.status}: ${response.statusText}`));
      }
    } catch (error) {
      Logger.error('Failed to load chat sessions', error as Error);
    }
  }, []);

  const createNewSession = useCallback(async (title?: string) => {
    // Prevent multiple simultaneous session creation
    if (sessionCreationInProgress.current) {
      Logger.info('🔄 Session creation already in progress, skipping...');
      return null;
    }

    try {
      sessionCreationInProgress.current = true;
      setIsLoading(true);
      Logger.info('🆕 Creating new session...');
      
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
        Logger.info('✅ Created new session', { sessionId: data.session.id });
        setCurrentSessionId(data.session.id);
        setMessages([]);
        await loadChatSessions();
        return data.session.id;
      } else {
        Logger.error('❌ Failed to create session', new Error(`HTTP ${response.status}: ${response.statusText}`));
        const errorText = await response.text();
        Logger.error('Create session error details', new Error(errorText));
        return null;
      }
    } catch (error) {
      Logger.error('Failed to create session', error as Error);
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
      Logger.info('🔍 Loading session', { sessionId });
      
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      Logger.info('📡 Response status', { status: response.status });
      
      if (response.ok) {
        const data = await response.json();
        Logger.info('📦 Response data structure', {
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
        
        Logger.info('✅ Converted messages', { count: convertedMessages.length });
        setMessages(convertedMessages);
        
        if (convertedMessages.length === 0) {
          Logger.info('ℹ️ No messages found in session, this might be expected for new sessions');
        }
      } else {
        Logger.error('❌ Response not OK', new Error(`HTTP ${response.status}: ${response.statusText}`));
        const errorText = await response.text();
        Logger.error('Error details', new Error(errorText));
        toast.error('Failed to load chat session');
      }
    } catch (error) {
      Logger.error('Failed to load session', error as Error);
      toast.error('Failed to load chat session');
    } finally {
      setIsLoading(false);
      setIsLoadingExistingSession(false);
    }
  }, []);

  const saveMessageToSession = useCallback(async (message: Message, sessionId: string) => {
    try {
      Logger.info('💾 SAVE: Saving message to session', { 
        sessionId, 
        type: message.type, 
        contentLength: message.content.length 
      });
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
        Logger.error('❌ SAVE: Failed to save message', new Error(`HTTP ${response.status}: ${response.statusText}`));
        const errorText = await response.text();
        Logger.error('SAVE: Error details', new Error(errorText));
        
        // Show user-friendly error message
        let errorMessage = 'Failed to save message';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (e) {
          // If parsing fails, use the raw error text
          if (errorText) {
            errorMessage += `: ${errorText}`;
          }
        }
        
        toast.error(errorMessage);
        return false;
      } else {
        const result = await response.json();
        Logger.info('✅ SAVE: Message saved successfully', { messageId: result.message?.id });
        return true;
      }
    } catch (error) {
      Logger.error('❌ SAVE: Exception while saving message', error as Error);
      toast.error('Network error while saving message');
      return false;
    }
  }, []);

  // New method to ensure session exists and return session ID
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (currentSessionId) {
      Logger.info('🎯 ENSURE: Using existing session', { sessionId: currentSessionId });
      return currentSessionId;
    }
    
    Logger.info('🎯 ENSURE: No session exists, creating new one...');
    const newSessionId = await createNewSession();
    Logger.info('🎯 ENSURE: New session created', { sessionId: newSessionId });
    return newSessionId;
  }, [currentSessionId, createNewSession]);

  const addMessage = useCallback(async (message: Message, forceSessionId?: string) => {
    Logger.info('🐈 ADD: Starting to add message', { 
      type: message.type, 
      contentPreview: message.content.substring(0, 50) + '...' 
    });
    
    // First add to local state immediately for UI responsiveness
    setMessages(prev => {
      Logger.info('🐈 ADD: Adding to local state', { previousCount: prev.length });
      return [...prev, message];
    });
    
    // Then save to backend session
    const sessionId = forceSessionId || await ensureSession();
    if (!sessionId) {
      Logger.error('❌ ADD: No session ID available for message save');
      toast.error('Failed to save message - no active session');
      return null;
    }
    
    // Save message to the specific session
    const saveSuccess = await saveMessageToSession(message, sessionId);
    
    if (!saveSuccess) {
      Logger.error('❌ ADD: Message save failed, but keeping in UI for now');
      toast.error('Failed to save message - it may not persist');
    } else {
      Logger.info('✅ ADD: Message successfully saved to backend');
    }
    
    // Refresh sessions list to update the last activity timestamp
    await loadChatSessions();
    
    // Return the session ID that was used
    return sessionId;
  }, [currentSessionId, saveMessageToSession, loadChatSessions]);

  // New method specifically for sending a conversation (user message + AI response)
  const sendConversation = useCallback(async (userMessage: Message, aiMessage: Message) => {
    Logger.info('💬 CONVERSATION: Starting conversation flow...');
    
    // Ensure we have a session before doing anything
    const sessionId = await ensureSession();
    if (!sessionId) {
      Logger.error('❌ CONVERSATION: Failed to ensure session exists');
      toast.error('Failed to create chat session');
      return false;
    }
    
    Logger.info('💬 CONVERSATION: Using session', { sessionId });
    
    // Add both messages to UI immediately
    setMessages(prev => {
      Logger.info('💬 CONVERSATION: Adding both messages to UI', { previousCount: prev.length });
      return [...prev, userMessage, aiMessage];
    });
    
    // Save user message first
    Logger.info('💬 CONVERSATION: Saving user message...');
    const userSaveSuccess = await saveMessageToSession(userMessage, sessionId);
    
    if (!userSaveSuccess) {
      Logger.error('❌ CONVERSATION: Failed to save user message');
      toast.error('Failed to save your message');
    }
    
    // Save AI message second
    Logger.info('💬 CONVERSATION: Saving AI message...');
    const aiSaveSuccess = await saveMessageToSession(aiMessage, sessionId);
    
    if (!aiSaveSuccess) {
      Logger.error('❌ CONVERSATION: Failed to save AI message');
      toast.error('Failed to save AI response');
    }
    
    // Refresh sessions list
    await loadChatSessions();
    
    const success = userSaveSuccess && aiSaveSuccess;
    Logger.info('💬 CONVERSATION: Conversation save result', { success });
    return success;
  }, [ensureSession, saveMessageToSession, loadChatSessions]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      Logger.info('🗑️ Deleting session', { sessionId });
      
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        Logger.info('✅ Session deleted successfully', { sessionId });
        await loadChatSessions();
        
        // If we just deleted the current session, clear it
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        
        toast.success('Chat session deleted');
        return true;
      } else {
        Logger.error('❌ Failed to delete session', new Error(`HTTP ${response.status}: ${response.statusText}`));
        toast.error('Failed to delete chat session');
        return false;
      }
    } catch (error) {
      Logger.error('Failed to delete session', error as Error);
      toast.error('Network error while deleting session');
      return false;
    }
  }, [currentSessionId, loadChatSessions]);

  return {
    currentSessionId,
    messages,
    isLoading,
    sessions,
    isLoadingExistingSession,
    loadSession,
    addMessage,
    sendConversation,
    createNewSession,
    deleteSession,
    loadChatSessions
  };
}