import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in environment variables");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Updated to use currently supported models (based on API response)
export const GROQ_MODELS = {
  LLAMA3_70B: "llama-3.3-70b-versatile",  // Latest 70B model available
  LLAMA3_8B: "llama-3.1-8b-instant",     // Fast 8B model for quick responses
  MIXTRAL: "gemma2-9b-it",                // Alternative model (mixtral not in current list)
} as const;

// Type for supported models
export type GroqModel = typeof GROQ_MODELS[keyof typeof GROQ_MODELS];