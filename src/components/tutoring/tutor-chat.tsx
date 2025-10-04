"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  Settings
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  type: "user" | "ai";
  timestamp: Date;
}

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: initialTopic 
        ? `Great choice! Let's explore ${initialTopic} together. I'll adapt my explanations to your ${studentProfile?.learningStyle?.toLowerCase().replace('_', ' ')} learning style and ${studentProfile?.difficultyLevel?.toLowerCase()} level. What would you like to know first?`
        : `Hi there! 👋 I'm your AI tutor, and I'm excited to help you learn today! Whether you need help with ${studentProfile?.subjects?.join(", ") || "any subject"}, want to practice problems, or just have questions, I'm here for you. What would you like to explore?`,
      type: "ai",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000 + Math.random() * 2000);
  };

  const sendMessage = async (messageText: string = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      type: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    simulateTyping();

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
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
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
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

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-4 max-w-xs">
      <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 backdrop-blur-sm rounded-full border border-white/20">
        <Bot className="h-5 w-5 text-purple-300" />
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-10 w-10 text-purple-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            TutorByAI
          </span>
        </div>
        <div className="flex items-center gap-4">
          {onBack ? (
            <Button 
              onClick={onBack}
              variant="ghost" 
              size="sm" 
              className="text-purple-200 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20">
            <Link href="/profile">
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
        </div>
      </nav>

      {/* Main Chat Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-8">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/80 to-cyan-600/80 backdrop-blur-sm text-white p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <MessageCircle className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Tutor Chat</h2>
                <p className="text-white/90">
                  {studentProfile ? (
                    `Grade ${studentProfile.gradeLevel} • ${studentProfile.learningStyle?.toLowerCase().replace('_', ' ')} learner • ${studentProfile.difficultyLevel?.toLowerCase()} level`
                  ) : (
                    "Ask me anything! I'm here to help you learn."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-black/10">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.type === "ai" && (
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 backdrop-blur-sm rounded-full shrink-0 mt-1 border border-white/20">
                    <Bot className="h-5 w-5 text-purple-300" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-4 shadow-lg border",
                    message.type === "user"
                      ? "bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-sm text-white border-white/20 ml-auto"
                      : "bg-white/10 backdrop-blur-sm border-white/20 text-white"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <span className="text-xs mt-2 block opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {message.type === "user" && (
                  <div className="flex items-center justify-center w-10 h-10 bg-cyan-500/20 backdrop-blur-sm rounded-full shrink-0 mt-1 border border-white/20">
                    <User className="h-5 w-5 text-cyan-300" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="p-6 bg-white/5 border-t border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Try asking me about:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question.text)}
                    className="justify-start gap-3 h-auto py-3 text-left bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-cyan-400/50 transition-all rounded-xl"
                    disabled={isLoading}
                  >
                    <question.icon className="h-5 w-5 text-cyan-400 shrink-0" />
                    <span>{question.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 bg-white/5 border-t border-white/20">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your studies..."
                disabled={isLoading}
                className="flex-1 h-14 rounded-2xl border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-gray-300 focus:border-cyan-400/50 focus:bg-white/20 transition-all"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !inputMessage.trim()}
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-xs text-purple-200 mt-3 text-center opacity-70">
              I'm powered by AI and here to help you learn! Ask me questions, request explanations, or practice problems.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}