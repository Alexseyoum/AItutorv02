import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { groq } from "@/lib/groq/client";

const ONBOARDING_QUESTIONS = [
  {
    stage: 0,
    systemPrompt: "You are helping a student with their initial setup. Ask about their grade level, age, and school in a friendly, conversational way. Keep it concise."
  },
  {
    stage: 1,
    systemPrompt: "Now ask about their favorite subjects and learning goals. Be encouraging and help them think about what they want to achieve."
  },
  {
    stage: 2,
    systemPrompt: "Finally, ask about their learning preferences: learning style (visual, auditory, hands-on, etc.), preferred difficulty level, and how long they like study sessions to be."
  }
];

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stage, previousAnswers, finalProfile } = await request.json();

    // If this is the final submission with complete profile
    if (finalProfile) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          isOnboarded: true,
          gradeLevel: finalProfile.gradeLevel,
          age: finalProfile.age,
          school: finalProfile.school,
          subjects: finalProfile.subjects || [],
          learningGoals: finalProfile.learningGoals || [],
          learningStyle: finalProfile.learningStyle || "MIXED",
          difficultyLevel: finalProfile.difficultyLevel || "INTERMEDIATE",
          sessionDuration: finalProfile.sessionDuration || 30,
          interests: finalProfile.interests || [],
          pastEngagement: finalProfile.pastEngagement || 0
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: "Onboarding completed!" 
      });
    }

    // Generate next question based on stage
    if (stage >= ONBOARDING_QUESTIONS.length) {
      return NextResponse.json({
        question: "Thank you for completing the setup!",
        stage: stage,
        isComplete: true
      });
    }

    const currentQuestion = ONBOARDING_QUESTIONS[stage];
    const context = previousAnswers.length > 0 
      ? `Previous answers: ${previousAnswers.join(", ")}` 
      : "This is the first question.";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `${currentQuestion.systemPrompt} ${context}`
        },
        {
          role: "user",
          content: "Generate the next onboarding question."
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 200
    });

    const question = completion.choices[0]?.message?.content || "What would you like to learn today?";

    return NextResponse.json({
      question,
      stage: stage,
      isComplete: false
    });

  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json(
      { error: "Failed to process onboarding" },
      { status: 500 }
    );
  }
}