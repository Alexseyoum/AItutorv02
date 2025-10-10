"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VoiceInteraction from "@/components/tutoring/voice-interaction";
import { useChatPersistence } from "@/lib/hooks/useChatPersistence";
import { contextManager } from "@/lib/ai/context-manager";
import { Message } from "@/lib/types";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  HelpCircle, 
  BookOpen, 
  Calculator,
  Sparkles,
  MessageCircle,
  ArrowLeft,
  Brain,
  Settings,
  Mic,
  History,
  Plus,
  ExternalLink,
  Image as ImageIcon,
  Menu,
  X,
  Copy,
  Check,
  MoreHorizontal,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";



interface TutorChatProps {
  studentProfile?: {
    gradeLevel: number;
    age?: number;
    school?: string;
    subjects: string[];
    learningGoals: string[];
    learningStyle: string;
    difficultyLevel: string;
    sessionDuration?: number;
    interests: string[];
    pastEngagement: number;
  };
  onBack?: () => void;
  initialTopic?: string;
}

const suggestedQuestions = [
  {
    text: "Explain this concept simply",
    icon: Lightbulb,
    category: "understanding"
  },
  {
    text: "Give me practice problems",
    icon: Calculator,
    category: "practice"
  },
  {
    text: "Help me with homework",
    icon: BookOpen,
    category: "homework"
  },
  {
    text: "What should I study next?",
    icon: HelpCircle,
    category: "guidance"
  }
];

export default function TutorChat({ studentProfile, onBack, initialTopic }: TutorChatProps) {
  const {
    currentSessionId,
    messages,
    sessions,
    isLoading: isPersistenceLoading,
    addMessage,
    createNewSession,
    loadSession,
    setMessages,
    startNewChat,
    sendConversation
  } = useChatPersistence(initialTopic);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mobile responsiveness: Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Note: Session will be created automatically when user sends their first message
  // No need to create empty sessions on component mount

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000 + Math.random() * 2000);
  };

  const sendMessage = async (messageText: string = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    console.log('🚀 SEND: Starting to send message:', messageText.substring(0, 50) + '...');
    console.log('🚀 SEND: Current session ID:', currentSessionId);
    console.log('🚀 SEND: Current message count:', messages.length);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      type: "user",
      timestamp: new Date()
    };

    console.log('🚀 SEND: Created user message with ID:', userMessage.id);
    
    setInputMessage("");
    setIsLoading(true);
    simulateTyping();

    try {
      // Prepare optimized conversation context
      const conversationContext = contextManager.getOptimizedContext(messages, {
        maxMessages: 8,        // Keep last 8 messages for context
        maxTokens: 1500,       // Limit to ~1500 tokens to control costs
        systemPrompt: studentProfile ? undefined : "You are a helpful AI tutor focused on clear, engaging explanations."
      });

      // Add the current user message to context
      conversationContext.push({
        role: "user",
        content: messageText
      });

      console.log(`🔄 Sending ${conversationContext.length} messages to AI (optimized context)`);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          history: conversationContext,  // 🎯 Optimized conversation history
          profile: studentProfile ? {
            gradeLevel: studentProfile.gradeLevel,
            learningStyle: studentProfile.learningStyle?.toLowerCase().replace('_', ' '),
            interests: studentProfile.interests,
            pastEngagement: studentProfile.pastEngagement
          } : undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.data.message || data.data.explanation || "I'm not sure how to respond to that.",
        type: "ai",
        timestamp: new Date(),
        // Enhanced content from API response
        imageUrl: data.data.imageUrl,
        links: data.data.links,
        keywords: data.data.keywords,
        funFact: data.data.funFact,
        analogy: data.data.analogy
      };

      console.log('🚀 SEND: Created AI message with ID:', aiMessage.id);
      
      // Use the new sendConversation method to ensure both messages go to the same session
      const success = await sendConversation(userMessage, aiMessage);
      
      if (!success) {
        console.error('❌ SEND: Failed to save conversation properly');
      }

      // Log context optimization results (development only)
      if (process.env.NODE_ENV === 'development' && data.meta) {
        console.log(`📊 Context optimization - History: ${data.meta.historyLength} messages, Optimized: ${data.meta.contextOptimized}`);
      }

    } catch (error: unknown) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleVoiceInput = (transcript: string) => {
    setInputMessage(transcript);
    if (transcript.trim()) {
      sendMessage(transcript);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };



  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarVisible && !sidebarCollapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarVisible(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out z-30",
        "lg:relative lg:translate-x-0", // Desktop: always visible and positioned
        sidebarCollapsed 
          ? "w-16" 
          : sidebarVisible 
          ? "w-80 lg:w-80" 
          : "w-0 lg:w-16", // Mobile: hidden when not visible
        "lg:block", // Always visible on desktop
        !sidebarVisible && "lg:w-16", // Collapsed state on desktop
        // Mobile positioning
        "fixed lg:relative inset-y-0 left-0",
        sidebarVisible ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && sidebarVisible && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  TutorByAI
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarVisible(false)}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
              {/* Desktop collapse button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 hidden lg:flex"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={() => startNewChat()}
            className={cn(
              "w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 shadow-lg transition-all duration-200",
              sidebarCollapsed || !sidebarVisible ? "px-2" : "px-4"
            )}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            {!sidebarCollapsed && sidebarVisible && <span className="ml-2">New Chat</span>}
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!sidebarCollapsed && sidebarVisible && (
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Chat History
            </h3>
          )}
          <div className="space-y-1">
            {sessions.map((session) => (
              <Button
                key={session.id}
                variant="ghost"
                onClick={() => loadSession(session.id)}
                className={cn(
                  "w-full justify-start text-left p-3 h-auto rounded-lg transition-all duration-200",
                  currentSessionId === session.id 
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-700",
                  sidebarCollapsed || (!sidebarVisible && "px-2 justify-center")
                )}
              >
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && sidebarVisible && (
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">
                      {session.title || "Untitled Chat"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer",
            sidebarCollapsed || (!sidebarVisible && "justify-center")
          )}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && sidebarVisible && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {studentProfile ? `Grade ${studentProfile.gradeLevel} Student` : "Student"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {studentProfile?.learningStyle?.replace('_', ' ') || "Learning"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Menu button for mobile + Back button */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarVisible(true)}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              {onBack ? (
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Center - Page title */}
            <div className="text-center flex-1 lg:flex-none">
              <h1 className="text-lg lg:text-xl font-semibold text-slate-900 dark:text-slate-100">AI Tutor Chat</h1>
              {studentProfile && (
                <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  Grade {studentProfile.gradeLevel} • {studentProfile.learningStyle?.toLowerCase().replace('_', ' ')} learner • {studentProfile.difficultyLevel?.toLowerCase()} level
                </p>
              )}
            </div>

            {/* Right side - Theme toggle */}
            <div className="flex items-center gap-2">
              <ModeToggle className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100" />
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="max-w-4xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
            {/* Welcome state when no session exists */}
            {!currentSessionId && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-96 text-center">
                <div className="p-4 lg:p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-4 lg:mb-6">
                  <Bot className="h-12 lg:h-16 w-12 lg:w-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  {initialTopic 
                    ? `Ready to explore ${initialTopic}?`
                    : "Welcome to your AI Tutor!"
                  }
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-6 lg:mb-8 px-4">
                  {initialTopic
                    ? `I'm here to help you learn about ${initialTopic}. Ask me anything to get started!`
                    : "I'm here to help you learn anything you're curious about. Send me your first message to begin our conversation!"
                  }
                </p>
                
                {/* Suggested Questions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleSuggestedQuestion(question.text)}
                      className="justify-start gap-3 h-auto py-3 lg:py-4 text-left bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md text-sm lg:text-base"
                      disabled={isLoading}
                    >
                      <question.icon className="h-4 lg:h-5 w-4 lg:w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="text-slate-900 dark:text-slate-100">{question.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Regular messages */}
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "group relative",
                    message.type === "user" ? "ml-auto max-w-3xl" : "mr-auto max-w-4xl"
                  )}
                >
                  <div className={cn(
                    "flex gap-4 items-start",
                    message.type === "user" ? "flex-row-reverse" : ""
                  )}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        message.type === "user" 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500" 
                          : "bg-gradient-to-r from-purple-500 to-cyan-500"
                      )}>
                        {message.type === "user" ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={cn(
                      "flex-1 relative",
                      message.type === "user" ? "text-right" : ""
                    )}>
                      <div className={cn(
                        "inline-block max-w-full p-4 rounded-2xl shadow-sm",
                        message.type === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-tr-sm"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm"
                      )}>
                        <p className="whitespace-pre-wrap leading-relaxed text-left">{message.content}</p>

                        {/* Enhanced Content - Only for AI messages */}
                        {message.type === "ai" && (
                          <>
                            {/* Display educational image */}
                            {message.imageUrl && (
                              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                                <img 
                                  src={message.imageUrl} 
                                  alt="Educational illustration" 
                                  className="w-full h-auto max-h-64 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Display fun fact */}
                            {message.funFact && (
                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200">{message.funFact}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Display analogy */}
                            {message.analogy && (
                              <div className="mt-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700">
                                <div className="flex items-start gap-2">
                                  <Brain className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                                  <p className="text-sm text-cyan-800 dark:text-cyan-200">{message.analogy}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Display educational links */}
                            {message.links && message.links.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  Learn more:
                                </p>
                                <div className="space-y-2">
                                  {message.links.slice(0, 2).map((link, index) => (
                                    <a
                                      key={index}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                                    >
                                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{link.title}</div>
                                      {link.snippet && (
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{link.snippet}</div>
                                      )}
                                      <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">{link.type.toUpperCase()}</div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Display keywords */}
                            {message.keywords && message.keywords.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-1">
                                  {message.keywords.slice(0, 5).map((keyword, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Timestamp and Actions */}
                        <div className={cn(
                          "flex items-center gap-2 mt-3 pt-2 border-t opacity-70",
                          message.type === "user" 
                            ? "border-white/20 justify-end" 
                            : "border-slate-200 dark:border-slate-600 justify-between"
                        )}>
                          <span className="text-xs">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {/* Copy button for AI messages */}
                          {message.type === "ai" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
              }
              
              {isTyping && (
                <div className="mr-auto max-w-4xl">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 lg:p-6 safe-area-inset-bottom">
          <div className="max-w-4xl mx-auto">
            {/* Voice Controls */}
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <VoiceInteraction
                  onVoiceInput={handleVoiceInput}
                  size="md"
                  className="flex items-center gap-2"
                />
                <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Voice input available</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs lg:text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-purple-600 focus:ring-purple-500 scale-90 lg:scale-100"
                  />
                  <span className="hidden sm:inline">Auto-speak responses</span>
                  <span className="sm:hidden">Auto-speak</span>
                </label>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 lg:gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={!currentSessionId 
                    ? "Ask me anything to start learning..."
                    : "Type your message or use voice input..."
                  }
                  disabled={isLoading}
                  className="h-11 lg:h-12 rounded-xl border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 shadow-sm text-sm lg:text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="h-11 lg:h-12 px-4 lg:px-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 min-w-[44px] lg:min-w-[48px]"
              >
                <Send className="h-4 lg:h-5 w-4 lg:w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}