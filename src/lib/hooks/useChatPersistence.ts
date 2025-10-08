import { useState, useEffect } from 'react';
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

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  // Create welcome message when session changes
  useEffect(() => {
    if (currentSessionId && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: initialTopic 
          ? `Great choice! Let's explore ${initialTopic} together. What would you like to know first?`
          : `Hi there! 👋 I'm your AI tutor, and I'm excited to help you learn today! What would you like to explore?`,
        type: "ai",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentSessionId, initialTopic]);

  const loadChatSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const createNewSession = async (title?: string) => {
    try {
      setIsLoading(true);
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
        setCurrentSessionId(data.session.id);
        setMessages([]);
        await loadChatSessions();
        return data.session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create new chat session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(sessionId);
        
        // Convert database messages to component format
        const convertedMessages: Message[] = data.session.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type as "user" | "ai",
          timestamp: new Date(msg.createdAt),
          metadata: msg.metadata
        }));
        
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!currentSessionId) {
      // Create new session if none exists
      const sessionId = await createNewSession();
      if (!sessionId) return;
    }

    try {
      await fetch(`/api/chat/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.content,
          type: message.type,
          metadata: message.metadata
        })
      });
    } catch (error) {
      console.error('Failed to save message:', error);
      // Don't show error to user for message saving failures
    }
  };

  const addMessage = async (message: Message) => {
    setMessages(prev => [...prev, message]);
    await saveMessage(message);
  };

  const deleteSession = async (sessionId: string) => {
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
  };

  return {
    currentSessionId,
    messages,
    sessions,
    isLoading,
    setMessages,
    addMessage,
    createNewSession,
    loadSession,
    deleteSession,
    loadChatSessions
  };
}