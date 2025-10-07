import { groq, GROQ_MODELS } from "@/lib/groq/client";

// AI Provider Configuration
const AI_PROVIDERS = {
  primary: 'groq',           // ✅ Always free
  fallback1: 'huggingface',  // ✅ 100% free, no deposit
  fallback2: 'openrouter',   // ✅ $5 free, no deposit required
  experimental: 'perplexity' // ✅ Free tier available
} as const;

interface AIProvider {
  name: string;
  generateResponse(prompt: string, maxTokens?: number): Promise<string>;
  isAvailable(): boolean;
}

class GroqProvider implements AIProvider {
  name = 'groq';
  
  async generateResponse(prompt: string, maxTokens: number = 500): Promise<string> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: GROQ_MODELS.LLAMA3_70B,
        temperature: 0.8,
        max_tokens: maxTokens,
        stream: false,
      });

      return completion.choices[0]?.message?.content || "I'm having trouble thinking right now.";
    } catch (error) {
      console.error(`${this.name} provider error:`, error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!process.env.GROQ_API_KEY;
  }
}

class HuggingFaceProvider implements AIProvider {
  name = 'huggingface';
  private hf?: any; // Will be initialized when needed
  
  async generateResponse(prompt: string, maxTokens: number = 500): Promise<string> {
    if (!this.hf) {
      try {
        const { HfInference } = await import('@huggingface/inference');
        this.hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
      } catch (importError) {
        throw new Error('Hugging Face SDK not installed. Run: npm install @huggingface/inference');
      }
    }

    try {
      const result = await this.hf.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.8,
      });

      return result.choices[0]?.message?.content || "I'm processing your request.";
    } catch (error) {
      console.error(`${this.name} provider error:`, error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!process.env.HUGGINGFACE_TOKEN;
  }
}

class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  
  async generateResponse(prompt: string, maxTokens: number = 500): Promise<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.BETTER_AUTH_URL || 'http://localhost:3001',
          'X-Title': 'TutorByAI',
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I'm working on your request.";
    } catch (error) {
      console.error(`${this.name} provider error:`, error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  }
}

export class AIProviderManager {
  private providers: AIProvider[];

  constructor() {
    this.providers = [
      new GroqProvider(),
      new HuggingFaceProvider(),
      new OpenRouterProvider(),
    ];
  }

  async generateWithFallback(prompt: string, maxTokens: number = 500): Promise<string> {
    const availableProviders = this.providers.filter(provider => provider.isAvailable());
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers are available. Please check your API keys.');
    }

    for (const provider of availableProviders) {
      try {
        console.log(`🤖 Attempting AI generation with ${provider.name}...`);
        const result = await provider.generateResponse(prompt, maxTokens);
        console.log(`✅ Success with ${provider.name}`);
        return result;
      } catch (error) {
        console.log(`❌ ${provider.name} failed, trying next provider...`);
        continue;
      }
    }

    throw new Error('All AI providers failed. Please try again later.');
  }

  getAvailableProviders(): string[] {
    return this.providers
      .filter(provider => provider.isAvailable())
      .map(provider => provider.name);
  }

  // Smart model selection based on query complexity
  selectOptimalProvider(query: string): AIProvider | null {
    const availableProviders = this.providers.filter(provider => provider.isAvailable());
    
    if (availableProviders.length === 0) return null;

    const isComplex = query.includes('explain') || query.includes('why') || query.length > 100;
    
    if (isComplex && availableProviders.find(p => p.name === 'groq')) {
      return availableProviders.find(p => p.name === 'groq')!;
    }

    return availableProviders[0]; // Return first available
  }
}

// Export singleton instance
export const aiProviderManager = new AIProviderManager();