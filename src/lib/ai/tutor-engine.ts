import { groq, GROQ_MODELS } from "@/lib/groq/client";

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
  private async generateWithPrompt(prompt: string, maxTokens: number = 500) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: GROQ_MODELS.LLAMA3_70B,
        temperature: 0.8,
        max_tokens: maxTokens,
        stream: false,
      });

      return completion.choices[0]?.message?.content || "I'm having trouble thinking right now. Can you try again?";
    } catch (error: unknown) {
      console.error("Groq API error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        error: (error as any)?.error,
        model: GROQ_MODELS.LLAMA3_70B,
        hasApiKey: !!process.env.GROQ_API_KEY
      });
      return "I'm currently unavailable. Please try again in a moment!";
    }
  }

  async generateExplanation(
    concept: string,
    profile: StudentProfile
  ): Promise<TutorResponse> {
    const prompt = `
      Explain ${concept} to a grade ${profile.gradeLevel} student who learns best through ${profile.learningStyle || 'various'} methods.
      
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

  // Quick response method for chat interactions
  async quickResponse(prompt: string): Promise<string> {
    try {
      console.log("Attempting Groq API call with model:", GROQ_MODELS.LLAMA3_8B);
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: GROQ_MODELS.LLAMA3_70B, // Use 70B model instead of 8B
        temperature: 0.7,
        max_tokens: 150,
        stream: false,
      });

      return completion.choices[0]?.message?.content || "Sure!";
    } catch (error: unknown) {
      console.error("Quick response error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        error: (error as any)?.error,
        model: GROQ_MODELS.LLAMA3_70B,
        hasApiKey: !!process.env.GROQ_API_KEY
      });
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
}