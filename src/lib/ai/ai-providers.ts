// src/lib/ai/ai-providers.ts
import { groq, GROQ_MODELS } from "@/lib/groq/client";
import { ImageGenerationOptions, ImageResult } from "./types";
import { Logger } from "@/lib/logger";

interface AIProvider {
  name: string;
  generateResponse(prompt: string, maxTokens?: number): Promise<string>;
  generateImage?(prompt: string, options?: ImageGenerationOptions): Promise<ImageResult>;
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
      Logger.error(`${this.name} provider error`, error as Error, { prompt, maxTokens });
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!process.env.GROQ_API_KEY;
  }
}

class HuggingFaceProvider implements AIProvider {
  name = 'huggingface';
  private hf?: import('@huggingface/inference').HfInferenceEndpoint;
  
  async generateResponse(prompt: string, maxTokens: number = 500): Promise<string> {
    // Debug: Log token status
    console.log('HuggingFace token status:', {
      tokenExists: !!process.env.HUGGINGFACE_TOKEN,
      tokenLength: process.env.HUGGINGFACE_TOKEN?.length || 0,
      tokenPrefix: process.env.HUGGINGFACE_TOKEN ? process.env.HUGGINGFACE_TOKEN.substring(0, 10) + '...' : 'none'
    });
    
    if (!process.env.HUGGINGFACE_TOKEN) {
      throw new Error('HuggingFace token is not set. Please check your environment variables.');
    }
    
    if (!this.hf) {
      console.log('Initializing HuggingFace client with new endpoint...');
      try {
        const { HfInference } = await import('@huggingface/inference');
        console.log('HfInference imported successfully');
        // Directly create an endpoint client with the new URL
        this.hf = new HfInference(process.env.HUGGINGFACE_TOKEN).endpoint('https://router.huggingface.co/hf-inference');
        console.log('Endpoint client created successfully');
      } catch (initError) {
        console.error('HuggingFace client initialization error:', initError);
        throw new Error(`Failed to initialize HuggingFace client: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
      }
    }

    try {
      console.log('Attempting text generation with prompt length:', prompt.length);
      
      // For very large prompts, truncate to avoid timeout issues
      let truncatedPrompt = prompt;
      if (prompt.length > 2500) {
        console.log('Truncating prompt to reduce size...');
        truncatedPrompt = prompt.substring(0, 2500) + '... [truncated]';
      }
      
      // Try text generation with the endpoint client
      // Using a more reliable model and simpler parameters
      const result = await this.hf.textGeneration({
        inputs: truncatedPrompt,
        parameters: {
          max_new_tokens: Math.min(maxTokens, 150), // Further reduce max tokens to avoid timeout
          temperature: 0.7,
          return_full_text: false,
          do_sample: true,
        }
      });

      console.log('HuggingFace response received:', {
        hasGeneratedText: !!result.generated_text,
        textLength: result.generated_text?.length || 0,
        textPreview: result.generated_text ? result.generated_text.substring(0, 50) + '...' : 'none'
      });
      
      return result.generated_text || "I'm processing your request.";
    } catch (error) {
      console.error('HuggingFace detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        name: error instanceof Error ? error.name : 'Unknown type',
        fullError: error
      });
      
      Logger.error(`${this.name} provider error`, error as Error, { prompt, maxTokens });
      
      // Provide more specific error information
      if (error instanceof Error) {
        // Handle the specific "blob" error
        if (error.message.includes('blob')) {
          console.error('Blob error details:', {
            errorMessage: error.message,
            errorName: error.name
          });
          throw new Error('Model loading error: Unable to fetch model files. This might be a temporary issue with Hugging Face or a network connectivity problem. Please try again later.');
        } else if (error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to Hugging Face API. Please check your internet connection and ensure your HUGGINGFACE_TOKEN is valid.');
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          throw new Error('Authentication error: Invalid Hugging Face token. Please check your HUGGINGFACE_TOKEN environment variable.');
        } else if (error.message.includes('permissions') || error.message.includes('sufficient permissions')) {
          throw new Error('Permission error: Your Hugging Face token does not have sufficient permissions for inference. Please check your token permissions at https://huggingface.co/settings/tokens');
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded: Too many requests to Hugging Face. Please try again later.');
        } else if (error.message.includes('model') && error.message.includes('loading')) {
          throw new Error('Model loading error: Unable to load the requested model. This might be a temporary issue with Hugging Face. Please try again later.');
        } else {
          throw new Error(`Hugging Face generation failed: ${error.message}`);
        }
      }
      
      throw new Error(`Hugging Face generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    const hasToken = !!process.env.HUGGINGFACE_TOKEN;
    console.log('HuggingFace provider availability:', {
      hasToken,
      tokenLength: process.env.HUGGINGFACE_TOKEN?.length || 0
    });
    
    if (!hasToken) {
      Logger.warn('⚠️ HuggingFace provider: HUGGINGFACE_TOKEN environment variable not set');
    }
    return hasToken;
  }
}

class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  
  async generateResponse(prompt: string, maxTokens: number = 500): Promise<string> {
    try {
      // Try multiple free models in order of preference
      const freeModels = [
        "google/gemini-2.0-flash-exp:free",
        "qwen/qwen-2-7b-instruct:free",
        "meta-llama/llama-3.2-3b-instruct:free",
      ];
      
      let lastError: Error | null = null;
      
      for (const model of freeModels) {
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
              model: model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: maxTokens,
              temperature: 0.8,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log(`✅ OpenRouter using model: ${model}`);
          return data.choices[0]?.message?.content || "I'm working on your request.";
        } catch (error) {
          lastError = error as Error;
          console.log(`⚠️ OpenRouter model ${model} failed, trying next...`);
          continue;
        }
      }
      
      // If all models failed, throw the last error
      throw lastError || new Error('All OpenRouter models failed');
    } catch (_error) {
      console.error(`${this.name} provider error:`, _error);
      throw _error;
    }
  }

  isAvailable(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  }

  async generateImage(prompt: string, _options: ImageGenerationOptions = {}): Promise<ImageResult> {
    try {
      // OpenRouter doesn't directly support image generation through their API
      // But we can use their text generation to create a detailed description
      // and then use a fallback approach or return a placeholder
      console.log('🎨 OpenRouter: Image generation not directly supported, using fallback approach');
      
      // For now, we'll throw an error to let other providers handle it
      throw new Error('OpenRouter does not support direct image generation');
      
    } catch (_error) {
      console.error(`❌ OpenRouter image generation error:`, _error);
      throw _error;
    }
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
    
    console.log(`🔍 Available providers: ${availableProviders.map(p => p.name).join(', ')}`);
    
    if (availableProviders.length === 0) {
      console.error('❌ No AI providers available!');
      console.error('Environment check:', this.getEnvironmentStatus());
      throw new Error('No AI providers are available. Please check your API keys.');
    }

    const errors: Array<{provider: string, error: any}> = [];

    for (const provider of availableProviders) {
      try {
        console.log(`🔄 Attempting AI generation with ${provider.name}...`);
        const result = await provider.generateResponse(prompt, maxTokens);
        console.log(`✅ Success with ${provider.name}`);
        return result;
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error instanceof Error ? error.message : String(error));
        errors.push({ provider: provider.name, error });
        continue;
      }
    }

    console.error('❌ All providers failed. Error details:', errors.map(e => `${e.provider}: ${e.error instanceof Error ? e.error.message : String(e.error)}`).join(' | '));
    throw new Error('All AI providers failed. Please try again later.');
  }

  async generateImage(prompt: string, options: ImageGenerationOptions = {}): Promise<ImageResult | null> {
    // Check if image generation is enabled via environment variable
    const imageGenerationEnabled = process.env.ENABLE_IMAGE_GENERATION === 'true';
    
    if (!imageGenerationEnabled) {
      console.log('🖼️ Image generation is disabled. Set ENABLE_IMAGE_GENERATION=true to enable.');
      return null;
    }

    const imageProviders = this.providers.filter(provider => 
      provider.isAvailable() && provider.generateImage
    );
    
    console.log(`🖼️ Image generation requested. Available providers: ${imageProviders.map(p => p.name).join(', ')}`);
    
    if (imageProviders.length === 0) {
      console.log('❌ No image generation providers available');
      console.log('💡 Hint: Make sure HUGGINGFACE_TOKEN is set in your environment variables');
      return null;
    }

    for (const provider of imageProviders) {
      try {
        console.log(`🎨 Attempting image generation with ${provider.name}...`);
        const result = await provider.generateImage!(prompt, options);
        console.log(`✅ Image generation success with ${provider.name}`);
        return result;
      } catch (error) {
        console.log(`❌ ${provider.name} image generation failed, trying next provider...`);
        console.error(`Image generation error with ${provider.name}:`, error);
        continue;
      }
    }

    console.log('❌ All image generation providers failed');
    return null;
  }

  getAvailableProviders(): string[] {
    return this.providers
      .filter(provider => provider.isAvailable())
      .map(provider => provider.name);
  }

  getAvailableImageProviders(): string[] {
    return this.providers
      .filter(provider => provider.isAvailable() && provider.generateImage)
      .map(provider => provider.name);
  }

  // Debug method to check environment setup
  getEnvironmentStatus(): { [key: string]: boolean } {
    return {
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      HUGGINGFACE_TOKEN: !!process.env.HUGGINGFACE_TOKEN,
      OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    };
  }
}