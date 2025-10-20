import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import SATDiagnosticClient from "@/components/tutoring/sat-diagnostic-client";
import { prisma } from "@/lib/prisma";

export default async function SATDiagnosticPage() {
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

  const profileData = {
    profile: {
      gradeLevel: user.gradeLevel || 0,
      age: user.age !== null ? user.age : undefined,
      school: user.school !== null ? user.school : undefined,
      subjects: user.subjects,
      learningGoals: user.learningGoals,
      learningStyle: user.learningStyle,
      difficultyLevel: user.difficultyLevel,
      sessionDuration: user.sessionDuration !== null ? user.sessionDuration : undefined,
      interests: user.interests,
      pastEngagement: user.pastEngagement || 0,
      isOnboarded: user.isOnboarded,
      isInterestedInSATPrep: user.isInterestedInSATPrep
    }
  };

  return <SATDiagnosticClient profile={profileData.profile} />;
}
