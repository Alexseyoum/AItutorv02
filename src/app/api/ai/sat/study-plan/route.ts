// src/app/api/ai/sat/study-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Fetch the study plan with all fields
    const studyPlan = await prisma.sATStudyPlan.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ studyPlan });
  } catch (error) {
    console.error("SAT study plan fetch error:", error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : "No stack trace available";
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : "Unknown error type"
    });
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

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
    const { gradeLevel, timeline } = body;

    // Check if there's already an AI-generated plan
    const existingAIPlan = await prisma.sATStudyPlan.findFirst({
      where: { 
        userId: session.user.id,
        aiGeneratedPlan: {
          not: undefined
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingAIPlan) {
      return NextResponse.json({ studyPlan: existingAIPlan });
    }

    // Generate a basic study plan based on grade level
    const studyPlan = await prisma.sATStudyPlan.create({
      data: {
        userId: session.user.id,
        timeline: timeline || "6-month",
        focusAreas: {
          math: getMathFocusAreas(gradeLevel),
          reading: getReadingFocusAreas(gradeLevel),
          writing: getWritingFocusAreas(gradeLevel)
        },
        // Fix the type issue by using proper typing
        weeklySchedule: generateWeeklySchedule(timeline || "6-month"),
        resourceRecommendations: {
          books: [
            "The Official SAT Study Guide",
            "Khan Academy SAT Prep"
          ],
          websites: [
            "https://satsuite.collegeboard.org/sat/practice-preparation/khan-academy",
            "https://satsuite.collegeboard.org/sat/practice-preparation/practice-tests"
          ],
          practiceTests: [
            "Official SAT Practice Test 1",
            "Official SAT Practice Test 2"
          ]
        }
      }
    });

    return NextResponse.json({ studyPlan });
  } catch (error) {
    console.error("SAT study plan creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add PUT method to update study plan progress
export async function PUT(request: NextRequest) {
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
    const { id, completedWeeks, completedTasks } = body;

    // Verify the study plan belongs to the user
    const existingPlan = await prisma.sATStudyPlan.findUnique({
      where: { id }
    });

    if (!existingPlan || existingPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Study plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the study plan with progress tracking
    const updatedPlan = await prisma.sATStudyPlan.update({
      where: { id },
      data: {
        completedWeeks: completedWeeks || existingPlan.completedWeeks,
        completedTasks: completedTasks || existingPlan.completedTasks
      }
    });

    return NextResponse.json({ studyPlan: updatedPlan });
  } catch (error) {
    console.error("SAT study plan update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add PATCH method for partial updates
export async function PATCH(request: NextRequest) {
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
    const { id, week, task, completed } = body;

    // Verify the study plan belongs to the user
    const existingPlan = await prisma.sATStudyPlan.findUnique({
      where: { id }
    });

    if (!existingPlan || existingPlan.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Study plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get current completed tasks
    const currentTasks = existingPlan.completedTasks as Record<string, Record<string, boolean>> || {};
    
    // Update the specific task completion status
    if (completed) {
      // Mark task as completed
      if (!currentTasks[week]) {
        currentTasks[week] = {};
      }
      currentTasks[week][task] = true;
      
      // Add week to completed weeks if not already there
      const completedWeeks: number[] = existingPlan.completedWeeks || [];
      if (!completedWeeks.includes(week)) {
        completedWeeks.push(week);
        completedWeeks.sort((a, b) => a - b);
      }
    } else {
      // Mark task as not completed
      if (currentTasks[week] && currentTasks[week][task]) {
        delete currentTasks[week][task];
      }
      
      // Remove week from completed weeks if no tasks are left for that week
      if (currentTasks[week] && Object.keys(currentTasks[week]).length === 0) {
        delete currentTasks[week];
        const completedWeeks: number[] = (existingPlan.completedWeeks || []).filter((w: number) => w !== week);
      }
    }

    // Update the study plan
    const updatedPlan = await prisma.sATStudyPlan.update({
      where: { id },
      data: {
        completedTasks: currentTasks,
        completedWeeks: Object.keys(currentTasks).map(Number).sort((a, b) => a - b)
      }
    });

    return NextResponse.json({ studyPlan: updatedPlan });
  } catch (error) {
    console.error("SAT study plan task update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for generating study plan content
function getMathFocusAreas(gradeLevel: number): string[] {
  if (gradeLevel <= 9) {
    return ["Algebra Basics", "Linear Equations", "Geometry Fundamentals"];
  } else if (gradeLevel === 10) {
    return ["Algebra I & II", "Geometry", "Basic Trigonometry"];
  } else {
    return ["Advanced Algebra", "Geometry & Trigonometry", "Data Analysis", "Pre-Calculus"];
  }
}

function getReadingFocusAreas(gradeLevel: number): string[] {
  if (gradeLevel <= 9) {
    return ["Reading Comprehension", "Vocabulary Building", "Main Ideas"];
  } else if (gradeLevel === 10) {
    return ["Literary Analysis", "Informational Texts", "Inference Skills"];
  } else {
    return ["Complex Passages", "Rhetorical Analysis", "Comparative Reading", "Evidence-Based Reading"];
  }
}

function getWritingFocusAreas(gradeLevel: number): string[] {
  if (gradeLevel <= 9) {
    return ["Grammar Basics", "Sentence Structure", "Paragraph Organization"];
  } else if (gradeLevel === 10) {
    return ["Standard English Conventions", "Expression of Ideas", "Essay Writing"];
  } else {
    return ["Advanced Grammar", "Rhetorical Skills", "Argumentative Writing", "Analytical Essay"];
  }
}

interface WeeklyScheduleItem {
  math: string[];
  reading: string[];
  writing: string[];
  practiceTest: boolean;
}

// Change the return type to be compatible with Prisma's Json type
function generateWeeklySchedule(timeline: string): Record<string, any> {
  const weeks = timeline === "3-month" ? 12 : timeline === "6-month" ? 24 : 52;
  const schedule: Record<string, any> = {};
  
  for (let i = 1; i <= weeks; i++) {
    schedule[i.toString()] = {
      math: i % 2 === 0 ? ["Practice Problems"] : ["Concept Review"],
      reading: i % 3 === 0 ? ["Passage Analysis"] : ["Vocabulary"],
      writing: i % 4 === 0 ? ["Essay Practice"] : ["Grammar Drills"],
      practiceTest: i % 4 === 0 // Practice test every 4 weeks
    };
  }
  
  return schedule;
}
