import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { studyPlanPrompt } from "@/lib/prompts/studyPlanPrompt";
import { callLLM } from "@/lib/utils/llmClient";
import { prisma } from "@/lib/prisma";

interface PlanResource {
  title: string;
  url?: string;
}

interface DailyPlanTask {
  task: string;
}

interface PlanWeek {
  focus: string;
  daily_plan: DailyPlanTask[];
  resources: PlanResource[];
}

interface GeneratedPlan {
  weeks: PlanWeek[];
}

interface WeeklySchedule {
  [week: number]: {
    math: string[];
    reading: string[];
    writing: string[];
    practiceTest: boolean;
  };
}

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
    const plan: GeneratedPlan = JSON.parse(jsonPart);

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
        weeklySchedule: plan.weeks.reduce((acc: WeeklySchedule, week: PlanWeek, index: number) => {
          acc[index + 1] = {
            math: week.daily_plan.filter((task: DailyPlanTask) => task.task.includes("Math")).map((task: DailyPlanTask) => task.task),
            reading: week.daily_plan.filter((task: DailyPlanTask) => task.task.includes("Reading")).map((task: DailyPlanTask) => task.task),
            writing: week.daily_plan.filter((task: DailyPlanTask) => task.task.includes("Writing")).map((task: DailyPlanTask) => task.task),
            practiceTest: week.daily_plan.some((task: DailyPlanTask) => task.task.includes("mock") || task.task.includes("test")),
          };
          return acc;
        }, {}) as any,
        resourceRecommendations: {
          books: plan.weeks.flatMap((week: PlanWeek) => 
            week.resources.filter((r: PlanResource) => r.title.toLowerCase().includes("book")).map((r: PlanResource) => r.title)
          ),
          websites: plan.weeks.flatMap((week: PlanWeek) => 
            week.resources.filter((r: PlanResource) => r.url).map((r: PlanResource) => r.url || "")
          ),
          practiceTests: plan.weeks.flatMap((week: PlanWeek) => 
            week.daily_plan.filter((task: DailyPlanTask) => task.task.includes("mock") || task.task.includes("test"))
              .map((task: DailyPlanTask) => task.task)
          ),
        },
        aiGeneratedPlan: JSON.parse(JSON.stringify(plan)),
      },
    });

    return NextResponse.json({ success: true, plan: savedPlan });
  } catch (error: unknown) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate plan", error: error instanceof Error ? error.message : "Unknown error" },
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
  } catch (error: unknown) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch plan", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}