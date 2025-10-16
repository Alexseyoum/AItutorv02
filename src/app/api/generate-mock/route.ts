import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { callLLM } from "@/lib/utils/llmClient";
import { mockExamBlueprintPrompt } from "@/lib/prompts/mockExamPrompt";
import { prisma } from "@/lib/prisma";

// Add the interface for the mock request
interface _MockRequest {
  goal?: string;
  grade?: number;
  subject: string;
  difficulty: string;
  questionCount: number;
}

export async function POST(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: _request.headers
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await _request.json();
    const { goal = "SAT", grade = 11 } = body;

    // 1️⃣ Generate the exam blueprint
    const blueprintPrompt = mockExamBlueprintPrompt({ goal });
    const blueprintResponse = await callLLM(blueprintPrompt);
    const startIdx = blueprintResponse.indexOf("{");
    const endIdx = blueprintResponse.lastIndexOf("}");
    const blueprint = JSON.parse(blueprintResponse.slice(startIdx, endIdx + 1));

    const exam = {
      id: `mock_${Date.now()}`,
      goal,
      grade,
      sections: [] as Array<{
        name: string;
        subject: string;
        time_limit_minutes: number;
        question_count: number;
        questions: Array<unknown>;
      }>,
      total_time: 0,
      createdAt: new Date().toISOString(),
    };

    // 2️⃣ For each section, fill with questions
    for (const section of blueprint.sections) {
      const { name, subject, topics, question_count, time_limit_minutes, difficulty_ratio } = section;
      const sectionQuestions = [];

      // Convert difficulty ratio to counts
      const diffCounts = {} as Record<string, number>;
      for (const [level, ratio] of Object.entries(difficulty_ratio as Record<string, number>))
        diffCounts[level] = Math.round(question_count * ratio);

      // For each topic & difficulty, fetch or generate questions
      for (const topic of topics) {
        for (const [difficulty, count] of Object.entries(diffCounts)) {
          if (count <= 0) continue;

          // Try fetch existing questions from DB
          const existing = await prisma.question.findMany({
            where: {
              topic: { contains: topic, mode: "insensitive" },
              subject: { equals: subject },
              difficulty: { equals: difficulty },
              status: "approved"
            },
            take: count
          });

          const shortage = count - existing.length;

          // Generate if shortage
          if (shortage > 0) {
            // In a real implementation, we would call the generate-question API here
            // For now, we'll just note that we need to generate more questions
            console.log(`Need to generate ${shortage} more questions for ${topic} (${difficulty})`);
          }

          sectionQuestions.push(...existing.slice(0, count));
        }
      }

      exam.sections.push({
        name,
        subject,
        time_limit_minutes,
        question_count: sectionQuestions.length,
        questions: sectionQuestions,
      });

      exam.total_time += time_limit_minutes;
    }

    // Save the mock exam to the database
    const savedExam = await prisma.mockExam.create({
      data: {
        userId: session.user.id,
        goal,
        grade,
        sections: JSON.parse(JSON.stringify(exam.sections)),
        totalTime: exam.total_time
      }
    });

    return NextResponse.json({ success: true, exam: savedExam });
  } catch (error: unknown) {
    console.error("Mock exam generation failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate mock exam", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}