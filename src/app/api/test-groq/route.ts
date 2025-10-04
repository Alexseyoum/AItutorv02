// src/app/api/test-groq/route.ts
import { NextResponse } from "next/server";
import { groq } from "@/lib/groq/client";

export async function GET() {
  try {
    console.log("Testing Groq API...");
    console.log("API Key present:", !!process.env.GROQ_API_KEY);
    console.log("API Key preview:", process.env.GROQ_API_KEY?.substring(0, 10) + "...");

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hello" }],
      model: "llama3-70b-8192", // Use the model name directly
      temperature: 0.7,
      max_tokens: 50,
      stream: false,
    });

    return NextResponse.json({
      success: true,
      response: completion.choices[0]?.message?.content,
      model: "llama3-70b-8192"
    });

  } catch (error: any) {
    console.error("Groq test error:", error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      status: error.status,
      errorDetails: error.error,
      hasApiKey: !!process.env.GROQ_API_KEY
    }, { status: 500 });
  }
}