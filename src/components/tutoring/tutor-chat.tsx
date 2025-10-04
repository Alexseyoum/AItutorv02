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
  MessageCircle
} from "lucide-react";

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

export default function TutorChat({ studentProfile }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: `Hi there! 👋 I'm your AI tutor, and I'm excited to help you learn today! Whether you need help with ${studentProfile?.subjects?.join(", ") || "any subject"}, want to practice problems, or just have questions, I'm here for you. What would you like to explore?`,
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
      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="bg-card rounded-2xl px-4 py-2 shadow-sm border">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto khan-card">
      {/* Header */}
      <div className="khan-gradient-primary text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Tutor Chat</h2>
            <p className="text-white/90 text-sm">
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/30">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.type === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.type === "ai" && (
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                message.type === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-card border"
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <span className={cn(
                "text-xs mt-2 block",
                message.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {message.type === "user" && (
              <div className="flex items-center justify-center w-8 h-8 bg-secondary/10 rounded-full shrink-0 mt-1">
                <User className="h-4 w-4 text-secondary" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="p-4 bg-muted/20 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Try asking me about:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(question.text)}
                className="justify-start gap-2 h-auto py-2 text-left text-sm font-normal hover:bg-primary/5 hover:border-primary/20"
                disabled={isLoading}
              >
                <question.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{question.text}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-card border-t">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about your studies..."
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl border-2 focus:border-primary/50 transition-colors"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="h-12 px-6 rounded-xl khan-button-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          I'm powered by AI and here to help you learn! Ask me questions, request explanations, or practice problems.
        </p>
      </div>
    </div>
  );
}