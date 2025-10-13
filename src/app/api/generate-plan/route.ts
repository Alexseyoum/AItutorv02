import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { studyPlanPrompt } from "@/lib/prompts/studyPlanPrompt";
import { callLLM } from "@/lib/utils/llmClient";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      studentName = "Student",
      grade = 10,
      goals = ["Academic Improvement"],
      baselineScores = null,
      weeklyHours = 6,
      targetDate = null,
      learningStyle = "mixed",
    } = body;

    // Build the prompt
    const prompt = studyPlanPrompt({
      studentName,
      grade,
      goals,
      baselineScores,
      weeklyHours,
      targetDate,
      learningStyle,
    });

    // Call LLM
    const llmResponse = await callLLM(prompt);

    // Try parsing JSON from the LLM response
    const startIdx = llmResponse.indexOf("{");
    const endIdx = llmResponse.lastIndexOf("}");
    const jsonPart = llmResponse.slice(startIdx, endIdx + 1);
    const plan = JSON.parse(jsonPart);

    // Save the plan to the database
    const savedPlan = await prisma.sATStudyPlan.create({
      data: {
        userId: session.user.id,
        timeline: targetDate ? "custom" : "6-month",
        focusAreas: {
          math: plan.weeks[0]?.focus.includes("Math") ? [plan.weeks[0].focus] : ["Math Fundamentals"],
          reading: plan.weeks[0]?.focus.includes("Reading") ? [plan.weeks[0].focus] : ["Reading Comprehension"],
          writing: plan.weeks[0]?.focus.includes("Writing") ? [plan.weeks[0].focus] : ["Writing Basics"],
        },
        weeklySchedule: plan.weeks.reduce((acc: any, week: any, index: number) => {
          acc[index + 1] = {
            math: week.daily_plan.filter((task: any) => task.task.includes("Math")).map((task: any) => task.task),
            reading: week.daily_plan.filter((task: any) => task.task.includes("Reading")).map((task: any) => task.task),
            writing: week.daily_plan.filter((task: any) => task.task.includes("Writing")).map((task: any) => task.task),
            practiceTest: week.daily_plan.some((task: any) => task.task.includes("mock") || task.task.includes("test")),
          };
          return acc;
        }, {}),
        resourceRecommendations: {
          books: plan.weeks.flatMap((week: any) => 
            week.resources.filter((r: any) => r.title.toLowerCase().includes("book")).map((r: any) => r.title)
          ),
          websites: plan.weeks.flatMap((week: any) => 
            week.resources.filter((r: any) => r.url).map((r: any) => r.url)
          ),
          practiceTests: plan.weeks.flatMap((week: any) => 
            week.daily_plan.filter((task: any) => task.task.includes("mock") || task.task.includes("test"))
              .map((task: any) => task.task)
          ),
        },
        aiGeneratedPlan: plan,
      },
    });

    return NextResponse.json({ success: true, plan: savedPlan });
  } catch (error: any) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate plan", error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch the latest AI-generated plan
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const studyPlan = await prisma.sATStudyPlan.findFirst({
      where: { 
        userId: session.user.id,
        aiGeneratedPlan: {
          not: undefined
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, plan: studyPlan });
  } catch (error: any) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch plan", error: error.message },
      { status: 500 }
    );
  }
}