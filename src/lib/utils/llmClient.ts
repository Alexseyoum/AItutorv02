import { groq, GROQ_MODELS } from "@/lib/groq/client";
import { GroqModel } from "@/lib/groq/client";
import { Logger } from "@/lib/logger";
import { AIProviderManager } from "@/lib/ai/ai-providers";

const providerManager = new AIProviderManager();

export async function callLLM(prompt: string, model: GroqModel = GROQ_MODELS.LLAMA3_70B) {
  try {
    // Log the attempt for debugging
    console.log(`Attempting to call Groq API with model: ${model}`);
    
    const response = await groq.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are a helpful AI tutor and academic planner." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log(`Groq API call successful, received response`);
    return response.choices[0].message.content || "";
  } catch (error: any) {
    // Check if it's a rate limit error - check multiple patterns
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = JSON.stringify(error);
    const statusCode = error?.status || error?.statusCode || error?.response?.status;
    
    const isRateLimit = 
      statusCode === 429 ||
      errorMessage.includes('429') || 
      errorMessage.includes('rate_limit_exceeded') ||
      errorMessage.includes('Rate limit reached') ||
      errorMessage.includes('rate_limit') ||
      errorString.includes('429') ||
      errorString.includes('rate_limit') ||
      error?.code === 'rate_limit_exceeded';
    
    if (isRateLimit) {
      console.log('⚠️ Groq rate limit hit, attempting fallback to other providers...');
      console.log('Groq error details:', {
        status: statusCode,
        message: errorMessage.substring(0, 200),
        code: error?.code
      });
      
      Logger.error("Groq rate limit exceeded, using fallback", error as Error, { 
        model,
        errorType: 'rate_limit'
      });
      
      try {
        // Use fallback providers
        console.log('🔄 Starting fallback provider chain...');
        const fallbackResponse = await providerManager.generateWithFallback(prompt, 2000);
        console.log('✅ Successfully generated response using fallback provider');
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('❌ Fallback providers also failed:', fallbackError);
        Logger.error("All AI providers failed", fallbackError as Error);
        throw new Error("All AI providers are currently unavailable. Please try again later.");
      }
    }
    
    // For other errors, log and throw
    Logger.error("Error calling LLM", error as Error, { 
      model,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    });
    
    if (error instanceof Error) {
      throw new Error(`Failed to generate response from AI model: ${error.message}`);
    }
    throw new Error("Failed to generate response from AI model");
  }
}