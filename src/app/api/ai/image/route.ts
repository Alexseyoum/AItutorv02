// src/app/api/ai/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/ai-providers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check if image generation is enabled
    const imageGenerationEnabled = process.env.ENABLE_IMAGE_GENERATION === 'true';
    
    if (!imageGenerationEnabled) {
      return NextResponse.json(
        { 
          error: "Image generation is temporarily disabled", 
          message: "Image generation will be available when premium LLMs are integrated" 
        },
        { status: 503 }
      );
    }

    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { prompt, width = 512, height = 512, gradeLevel = 8 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const aiManager = new AIProviderManager();
    const result = await aiManager.generateImage(prompt, { 
      width, 
      height, 
      gradeLevel,
      style: gradeLevel < 8 ? 'illustration' : 'diagram'
    });

    if (!result) {
      return NextResponse.json(
        { error: "Image generation failed - no providers available" },
        { status: 503 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      meta: { gradeLevel, dimensions: { width, height } }
    });

  } catch (error: unknown) {
    console.error("Image generation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}