import { groq, GROQ_MODELS } from "@/lib/groq/client";
import { GroqModel } from "@/lib/groq/client";
import { Logger } from "@/lib/logger";

export async function callLLM(prompt: string, model: GroqModel = GROQ_MODELS.LLAMA3_70B) {
  try {
    const response = await groq.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are a helpful AI tutor and academic planner." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000, // Increased from 1500 to reduce truncation
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    Logger.error("Error calling LLM", error as Error, { prompt, model });
    throw new Error("Failed to generate response from AI model");
  }
}