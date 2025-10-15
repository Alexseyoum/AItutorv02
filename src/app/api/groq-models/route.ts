import { NextResponse } from "next/server";

interface GroqModel {
  id: string;
  // Add other properties as needed
  [key: string]: unknown;
}

interface GroqModelsResponse {
  data: GroqModel[];
}

export async function GET() {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GroqModelsResponse = await response.json();
    const modelIds = data.data.map((model: GroqModel) => model.id);
    
    return NextResponse.json({
      success: true,
      availableModels: modelIds,
      totalModels: modelIds.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("Error fetching Groq models:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}