import { groq, GROQ_MODELS } from "@/lib/groq/client";
import { AIProviderManager } from "@/lib/ai/ai-providers";
import { ConversationMessage } from "@/lib/ai/context-manager";

export interface StudentProfile {
  gradeLevel: number;
  learningStyle?: string;
  interests?: string[];
  pastEngagement: number;
}

export interface TutorResponse {
  explanation: string;
  funFact?: string;
  analogy?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export class EngagingTutorAgent {
  private aiProviderManager: AIProviderManager;

  constructor() {
    this.aiProviderManager = new AIProviderManager();
  }

  private async generateWithPrompt(prompt: string, maxTokens: number = 500): Promise<string> {
    try {
      // First try the new AI provider manager with fallbacks
      return await this.aiProviderManager.generateWithFallback(prompt, maxTokens);
    } catch (error) {
      console.error("All AI providers failed:", error);
      
      // Ultimate fallback - try direct Groq call
      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: GROQ_MODELS.LLAMA3_70B,
          temperature: 0.8,
          max_tokens: maxTokens,
          stream: false,
        });

        return completion.choices[0]?.message?.content || "I'm having trouble thinking right now. Can you try again?";
      } catch (groqError) {
        console.error("Even direct Groq failed:", groqError);
        return "I'm currently unavailable. Please try again in a moment!";
      }
    }
  }

  // Enhanced explanation with dynamic model switching
  async generateExplanation(
    concept: string,
    profile: StudentProfile
  ): Promise<TutorResponse> {
    const prompt = `
      Think step-by-step: For a ${profile.learningStyle || 'mixed'} learner in grade ${profile.gradeLevel}, explain ${concept}.
      
      Requirements:
      - Make it engaging and relatable to teenagers
      - Use ${profile.learningStyle || 'creative'} learning techniques
      - Include a surprising fun fact about the topic
      - Create a memorable analogy
      - Keep it under 200 words
      
      Respond in this exact JSON format:
      {
        "explanation": "your explanation here",
        "funFact": "interesting fact here", 
        "analogy": "creative analogy here"
      }
    `;

    const response = await this.generateWithPrompt(prompt);
    
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error("JSON parsing error:", error);
      // Fallback response as specified in memory
      return {
        explanation: response.substring(0, 300) + "...",
        funFact: "💡 Did you know? The brain learns better when information is presented in multiple ways!",
        analogy: "Think of learning like building a puzzle - each concept is a piece that helps complete the picture!"
      };
    }
  }

  async generateStudyMethod(
    topic: string,
    timeAvailable: number,
    profile: StudentProfile
  ): Promise<string> {
    const prompt = `
      Suggest a fun, effective study method for a grade ${profile.gradeLevel} student 
      to learn about ${topic} in ${timeAvailable} minutes.
      
      Student interests: ${profile.interests?.join(', ') || 'general'}
      Learning style: ${profile.learningStyle || 'mixed'}
      
      Make it:
      - Game-like and interactive
      - Suitable for short attention spans
      - Incorporates proven techniques (spaced repetition, active recall)
      - Includes a micro-challenge
      - Maximum 150 words
    `;

    return await this.generateWithPrompt(prompt, 300);
  }

  async generateFunFact(subject: string, currentTopic: string): Promise<string> {
    const prompt = `
      Share a surprising and relevant fun fact about ${currentTopic} in ${subject} 
      that would amaze a high school student. Make it shocking and memorable!
      
      Requirements:
      - 1-2 sentences maximum
      - Include an emoji to make it fun
      - Make it truly surprising
      
      Example format: "Did you know? [surprising fact]! 🚀"
    `;

    return await this.generateWithPrompt(prompt, 100);
  }

  async generateEncouragement(progress: number, streak: number): Promise<string> {
    const prompt = `
      Give a brief, authentic motivational message to a student who has:
      - Made ${progress}% progress in their current topic
      - Maintained a ${streak}-day study streak
      
      Make it:
      - Authentic and not cheesy (teenagers hate cringe)
      - Relatable to teenage experiences
      - Includes a gaming or pop culture reference if appropriate
      - 1 sentence maximum
      - Add an encouraging emoji
    `;

    return await this.generateWithPrompt(prompt, 80);
  }

  async generateMicroQuiz(concept: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<QuizQuestion | null> {
    const prompt = `
      Create a quick 1-question multiple choice quiz about ${concept} at ${difficulty} difficulty level for high school students.
      
      Format your response as valid JSON only:
      {
        "question": "clear question here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "exact text of correct option",
        "explanation": "brief explanation of why it's correct"
      }
    `;

    const response = await this.generateWithPrompt(prompt, 200);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error("Quiz JSON parsing error:", error);
      return null;
    }
  }

  /**
   * Enhanced conversational response with context awareness
   */
  async generateConversationalResponse(
    messages: ConversationMessage[],
    profile?: StudentProfile
  ): Promise<string> {
    try {
      // Build context-aware prompt with student profile
      const systemMessage = this.buildSystemPrompt(profile);
      
      // Prepare messages for AI
      const conversationMessages = [
        { role: "system", content: systemMessage },
        ...messages
      ];

      // Use the AI provider manager with conversation format
      return await this.generateWithConversation(conversationMessages);
    } catch (error) {
      console.error("Conversational response error:", error);
      return "I'm having trouble understanding the context. Could you rephrase your question?";
    }
  }

  /**
   * Generate response using conversation format
   */
  private async generateWithConversation(
    messages: Array<{role: string, content: string}>,
    maxTokens: number = 500
  ): Promise<string> {
    try {
      // Try with Groq first as it supports conversation format natively
      const completion = await groq.chat.completions.create({
        messages: messages as any,
        model: GROQ_MODELS.LLAMA3_70B,
        temperature: 0.8,
        max_tokens: maxTokens,
        stream: false,
      });

      return completion.choices[0]?.message?.content || "I'm having trouble thinking right now. Can you try again?";
    } catch (error) {
      console.error("Groq conversation failed:", error);
      
      // Fallback to prompt-based approach for other providers
      const conversationPrompt = this.convertConversationToPrompt(messages);
      return await this.aiProviderManager.generateWithFallback(conversationPrompt, maxTokens);
    }
  }

  /**
   * Build system prompt based on student profile
   */
  private buildSystemPrompt(profile?: StudentProfile): string {
    const basePrompt = `You are an engaging AI tutor that helps students learn effectively. You should:
- Provide clear, concise explanations appropriate for the student's level
- Use encouraging and supportive language
- Ask follow-up questions to check understanding
- Provide examples and analogies when helpful
- Keep responses focused and not too lengthy`;

    if (!profile) return basePrompt;

    return `${basePrompt}

Student Profile:
- Grade Level: ${profile.gradeLevel}
- Learning Style: ${profile.learningStyle || 'mixed'}
- Interests: ${profile.interests?.join(', ') || 'general topics'}
- Engagement Level: ${profile.pastEngagement || 0}

Adjust your teaching style to match their grade level and learning preferences.`;
  }

  /**
   * Convert conversation array to single prompt for non-conversation APIs
   */
  private convertConversationToPrompt(messages: Array<{role: string, content: string}>): string {
    return messages
      .map(msg => {
        if (msg.role === 'system') return `Instructions: ${msg.content}`;
        if (msg.role === 'user') return `Student: ${msg.content}`;
        return `Tutor: ${msg.content}`;
      })
      .join('\n\n') + '\n\nTutor:';
  }

  // Enhanced quick response with smart provider selection
  async quickResponse(prompt: string): Promise<string> {
    try {
      console.log("🚀 Quick response requested");
      
      // Use the AI provider manager for quick responses
      return await this.aiProviderManager.generateWithFallback(prompt, 150);
    } catch (error: unknown) {
      console.error("Quick response error:", error);
      return "I'm having trouble responding right now. Could you try again?";
    }
  }

  // Khan Academy-style onboarding method
  async generateOnboardingQuestion(stage: number, previousAnswers?: string[]): Promise<string> {
    const stages = [
      "What grade are you in? (This helps me adjust the difficulty)",
      "What subjects are you most interested in learning about?",
      "How do you learn best? (visual, hands-on, reading, discussing, etc.)",
      "What's your biggest challenge with studying?",
      "What would make learning more fun for you?"
    ];

    if (stage < stages.length) {
      return stages[stage];
    }

    // Generate follow-up questions based on previous answers
    const prompt = `
      Based on these student responses: ${previousAnswers?.join(', ')}, 
      generate one more personalized onboarding question to better understand their learning needs.
      Keep it conversational and friendly. Maximum 20 words.
    `;

    return await this.quickResponse(prompt);
  }

  // Get available AI providers for debugging
  getAvailableProviders(): string[] {
    return this.aiProviderManager.getAvailableProviders();
  }
}