import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import SATPracticeClient from "@/components/tutoring/sat-practice-client";
import { prisma } from "@/lib/prisma";

export default async function SATPracticePage() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList
  });

  if (!session) {
    redirect('/auth/login');
  }

  // Fetch user profile directly from database
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

  // If we couldn't fetch the user or user is not interested in SAT prep or not in high school, redirect to main tutoring
  if (!user || !user.isInterestedInSATPrep || (user.gradeLevel && user.gradeLevel < 9)) {
    redirect('/tutoring');
  }

  return <SATPracticeClient />;
}
