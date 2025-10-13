import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LearningStyle, DifficultyLevel } from "@/generated/prisma";
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        isOnboarded: true,
        gradeLevel: true,
        age: true,
        school: true,
        subjects: true,
        learningGoals: true,
        learningStyle: true,
        difficultyLevel: true,
        sessionDuration: true,
        interests: true,
        pastEngagement: true,
        isInterestedInSATPrep: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        gradeLevel: user.gradeLevel,
        age: user.age,
        school: user.school,
        subjects: user.subjects,
        learningGoals: user.learningGoals,
        learningStyle: user.learningStyle,
        difficultyLevel: user.difficultyLevel,
        sessionDuration: user.sessionDuration,
        interests: user.interests,
        pastEngagement: user.pastEngagement || 0,
        isOnboarded: user.isOnboarded,
        isInterestedInSATPrep: user.isInterestedInSATPrep || false
      }
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const {
      gradeLevel,
      age,
      school,
      subjects,
      learningGoals,
      learningStyle,
      difficultyLevel,
      sessionDuration,
      interests,
      pastEngagement,
      isInterestedInSATPrep
    } = body;

    // Validate required fields
    if (!gradeLevel || gradeLevel < 1 || gradeLevel > 12) {
      return NextResponse.json(
        { error: "Valid grade level is required (1-12)" },
        { status: 400 }
      );
    }

    // Validate learning style enum
    if (learningStyle && !Object.values(LearningStyle).includes(learningStyle)) {
      return NextResponse.json(
        { error: "Invalid learning style" },
        { status: 400 }
      );
    }

    // Validate difficulty level enum
    if (difficultyLevel && !Object.values(DifficultyLevel).includes(difficultyLevel)) {
      return NextResponse.json(
        { error: "Invalid difficulty level" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        gradeLevel: parseInt(gradeLevel),
        age: age ? parseInt(age) : null,
        school: school || null,
        subjects: subjects || [],
        learningGoals: learningGoals || [],
        learningStyle: learningStyle || LearningStyle.MIXED,
        difficultyLevel: difficultyLevel || DifficultyLevel.INTERMEDIATE,
        sessionDuration: sessionDuration ? parseInt(sessionDuration) : null,
        interests: interests || [],
        pastEngagement: pastEngagement || 0,
        isOnboarded: true,
        isInterestedInSATPrep: isInterestedInSATPrep !== undefined ? isInterestedInSATPrep : false
      },
      select: {
        id: true,
        isOnboarded: true,
        gradeLevel: true,
        age: true,
        school: true,
        subjects: true,
        learningGoals: true,
        learningStyle: true,
        difficultyLevel: true,
        sessionDuration: true,
        interests: true,
        pastEngagement: true,
        isInterestedInSATPrep: true
      }
    });

    return NextResponse.json({
      profile: {
        gradeLevel: updatedUser.gradeLevel,
        age: updatedUser.age,
        school: updatedUser.school,
        subjects: updatedUser.subjects,
        learningGoals: updatedUser.learningGoals,
        learningStyle: updatedUser.learningStyle,
        difficultyLevel: updatedUser.difficultyLevel,
        sessionDuration: updatedUser.sessionDuration,
        interests: updatedUser.interests,
        pastEngagement: updatedUser.pastEngagement || 0,
        isOnboarded: updatedUser.isOnboarded,
        isInterestedInSATPrep: updatedUser.isInterestedInSATPrep || false
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}