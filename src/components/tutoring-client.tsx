"use client";

import { useState, useEffect } from "react";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import TutorChat from "@/components/tutoring/tutor-chat";
import { toast } from "sonner";
import { StudentProfile } from "@/lib/types";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface TutoringClientProps {
  user: User;
}

export default function TutoringClient({ user }: TutoringClientProps) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        const profile = data.profile;
        
        setStudentProfile(profile);
        setShowOnboarding(!profile.isOnboarded);
        
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load your profile");
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleOnboardingComplete = (profile: StudentProfile) => {
    setStudentProfile(profile);
    setShowOnboarding(false);
    toast.success("Welcome! Your learning journey begins now! 🚀");
  };

  const resetOnboarding = () => {
    setShowOnboarding(true);
    setStudentProfile(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingWizard onComplete={handleOnboardingComplete} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || user.email}! 👋
          </h1>
          <p className="text-gray-600">
            Ready to learn something new today?
          </p>
          {studentProfile && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm inline-block">
              <p className="text-sm text-gray-600">
                <strong>Your Profile:</strong> Grade {studentProfile.gradeLevel} • 
                {studentProfile.learningStyle?.toLowerCase().replace('_', ' ')} learner • 
                Interested in: {studentProfile.interests?.join(", ") || "Various topics"}
              </p>
              <button
                onClick={resetOnboarding}
                className="text-blue-600 hover:text-blue-800 text-xs underline mt-1"
              >
                Update profile
              </button>
            </div>
          )}
        </div>

        <TutorChat studentProfile={studentProfile || undefined} />
      </div>
    </div>
  );
}