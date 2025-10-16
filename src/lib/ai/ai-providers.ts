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
  private hf?: import('@huggingface/inference').HfInference; // Will be initialized when needed
  
  async generateResponse(prompt: string, maxTokens: number = 500): Promise<string> {
    if (!this.hf) {
      const { HfInference } = await import('@huggingface/inference');
      this.hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
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
      Logger.error(`${this.name} provider error`, error as Error, { prompt, maxTokens });
      throw error;
    }
  }

  async generateImage(prompt: string, _options: ImageGenerationOptions = {}): Promise<ImageResult> {
    if (!this.hf) {
      const { HfInference } = await import('@huggingface/inference');
      this.hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
    }

    try {
      // Enhance prompt based on grade level and style
      const enhancedPrompt = this.enhanceImagePrompt(prompt, _options);
      
      Logger.info(`🎨 HuggingFace: Generating image with prompt: "${enhancedPrompt}"`, { prompt, enhancedPrompt });
      
      // Add timeout and error handling for the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        // Use Stable Diffusion model for free image generation
        const result = await this.hf.textToImage({
          model: "stabilityai/stable-diffusion-2-1",
          inputs: enhancedPrompt,
          parameters: {
            width: _options.width || 512,
            height: _options.height || 512,
          }
        });

        clearTimeout(timeoutId);

        // Enhanced blob handling with multiple fallback approaches
        let buffer: ArrayBuffer;
        
        if (result instanceof Blob) {
          // Method 1: Direct blob conversion
          try {
            buffer = await result.arrayBuffer();
          } catch (blobError) {
            Logger.error('Direct blob conversion failed, trying alternative approach', blobError as Error);
            
            // Method 2: Stream-based conversion
            const reader = new FileReader();
            buffer = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = () => reject(reader.error);
              reader.readAsArrayBuffer(result);
            });
          }
        } else if (result && typeof result === 'object' && 'arrayBuffer' in result) {
          // Method 3: Response-like object
          buffer = await (result as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
        } else {
          throw new Error(`Unexpected result type: ${typeof result}`);
        }

        // Convert buffer to base64 data URL
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        Logger.info(`✅ HuggingFace: Image generated successfully, size: ${buffer.byteLength} bytes`, { size: buffer.byteLength });

        return {
          url: dataUrl,
          alt: prompt,
          provider: this.name
        };
        
      } catch (apiError) {
        clearTimeout(timeoutId);
        throw apiError;
      }
      
    } catch (error) {
      Logger.error(`❌ HuggingFace image generation error`, error as Error, { prompt, _options });
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to Hugging Face API. Please check your internet connection.');
        } else if (error.message.includes('timeout') || error.name === 'AbortError') {
          throw new Error('Timeout: Image generation took too long. Please try again with a simpler prompt.');
        } else if (error.message.includes('blob') || error.message.includes('arrayBuffer')) {
          throw new Error('Data processing error: Unable to process the generated image. The service might be experiencing issues.');
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          throw new Error('Authentication error: Invalid Hugging Face token. Please check your HUGGINGFACE_TOKEN environment variable.');
        } else if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded: Too many requests to Hugging Face. Please try again later.');
        }
      }
      
      throw new Error(`Hugging Face image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private enhanceImagePrompt(prompt: string, options: ImageGenerationOptions): string {
    const { gradeLevel = 8, style = 'realistic' } = options;
    
    let enhancement = '';
    
    if (gradeLevel < 8) {
      enhancement = 'colorful, friendly, cartoon-style, educational illustration, simple and clear, suitable for children, ';
    } else {
      enhancement = 'detailed, educational, clear diagram, scientific illustration, high quality, ';
    }
    
    if (style === 'illustration') {
      enhancement += 'vector illustration, clean lines, ';
    } else if (style === 'diagram') {
      enhancement += 'technical diagram, labeled, informative, ';
    }
    
    return enhancement + prompt;
  }

  isAvailable(): boolean {
    const hasToken = !!process.env.HUGGINGFACE_TOKEN;
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
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers are available. Please check your API keys.');
    }

    for (const provider of availableProviders) {
      try {
        console.log(`Attempting AI generation with ${provider.name}...`);
        const result = await provider.generateResponse(prompt, maxTokens);
        console.log(`✅ Success with ${provider.name}`);
        return result;
      } catch (_error) {
        console.log(`❌ ${provider.name} failed, trying next provider...`);
        continue;
      }
    }

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