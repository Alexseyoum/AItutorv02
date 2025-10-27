// src/app/api/sat/explain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callLLM } from "@/lib/utils/llmClient";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { question, topic, difficulty } = body;

    if (!question || !topic) {
      return NextResponse.json(
        { error: "Question and topic are required" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert SAT tutor. Provide a detailed explanation for this ${difficulty || "medium"} difficulty SAT question on the topic of ${topic}.

Question: ${question}

Provide your response in JSON format with the following structure:
{
  "summary": "Brief 2-3 sentence explanation of the concept",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "links": [
    {"title": "Resource title", "url": "https://example.com", "type": "article"}
  ]
}

Include 2-3 helpful learning resources (Khan Academy, College Board, etc.) with real URLs.`;

    const llmResponse = await callLLM(prompt);

    let data;
    try {
      const startIdx = llmResponse.indexOf("{");
      const endIdx = llmResponse.lastIndexOf("}");
      const jsonPart = llmResponse.slice(startIdx, endIdx + 1);
      data = JSON.parse(jsonPart);
    } catch {
      data = {
        summary: "This question tests your understanding of " + topic + ".",
        keyPoints: [
          "Review the fundamental concepts",
          "Practice similar problems",
          "Pay attention to details"
        ],
        commonMistakes: [
          "Rushing through the question",
          "Not reading all answer choices"
        ],
        links: [
          {
            title: "Khan Academy SAT Prep",
            url: "https://www.khanacademy.org/sat",
            type: "practice"
          },
          {
            title: "College Board SAT Practice",
            url: "https://satsuite.collegeboard.org/sat/practice-preparation",
            type: "official"
          }
        ]
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("SAT explanation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to generate explanation", details: errorMessage },
      { status: 500 }
    );
  }
}