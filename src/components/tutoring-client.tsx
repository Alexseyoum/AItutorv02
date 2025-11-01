"use client";
// Force rebuild to clear Turbopack cache
import { useState, useEffect } from "react";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import TutorChat from "@/components/tutoring/tutor-chat";
import { toast } from "sonner";
import { StudentProfile } from "@/lib/types";
import {
  Brain,
  PuzzleIcon,
  FileText,
  Compass,
  Settings,
  Flame,
  Target,
  Play,
  Zap,
  Calculator,
  BookOpen,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name?: string;
}

// Add this interface for student stats
interface StudentStats {
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: number;
  weeklyActivities: number;
  weeklyStudyTime: number;
  totalActivities: number;
  monthlyActivities: number;
  problemsSolved: number;
  totalStudyTime: number;
  completedAchievements: number;
  lastSession: {
    topic: string;
    date: string;
    duration: number;
    progress: number;
  } | null;
  dailyAverage: number;
  subjectBreakdown: {
    subject: string;
    count: number;
  }[];
}

interface TutoringClientProps {
  user: User;
  profile?: StudentProfile;
}

const featuredTopics = [
  {
    title: "Math",
    description: "Algebra, calculus, and more",
    icon: Calculator,
    difficulty: "All Levels",
  },
  {
    title: "Science",
    description: "Physics, chemistry, biology",
    icon: Zap,
    difficulty: "All Levels",
  },
  {
    title: "English",
    description: "Literature, writing, grammar",
    icon: BookOpen,
    difficulty: "All Levels",
  },
  {
    title: "History",
    description: "World and US history",
    icon: Target,
    difficulty: "All Levels",
  }
];

export default function TutoringClient({ user, profile }: TutoringClientProps) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(profile || null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conceptInput, setConceptInput] = useState("");
  const [currentTopic, setCurrentTopic] = useState<string>("");
  // Update this line to use the proper type with a default value
  const [studentStats, setStudentStats] = useState<StudentStats>({
    currentStreak: 0,
    longestStreak: 0,
    weeklyProgress: 0,
    weeklyActivities: 0,
    weeklyStudyTime: 0,
    totalActivities: 0,
    monthlyActivities: 0,
    problemsSolved: 0,
    totalStudyTime: 0,
    completedAchievements: 0,
    lastSession: null,
    dailyAverage: 0,
    subjectBreakdown: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // If profile wasn't passed in, fetch it
        if (!profile) {
          const profileResponse = await fetch("/api/profile");
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setStudentProfile(profileData.profile);
            setShowOnboarding(!profileData.profile.isOnboarded);
          }
        } else {
          setShowOnboarding(!profile.isOnboarded);
        }

        // Fetch stats
        const statsResponse = await fetch("/api/student-stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          // Update the state with the fetched stats
          setStudentStats(statsData.stats);
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load your profile");
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleOnboardingComplete = (profile: StudentProfile) => {
    setStudentProfile(profile);
    setShowOnboarding(false);
    toast.success("Welcome! Your learning journey begins now! 🚀");
  };

  const resetOnboarding = () => {
    setShowOnboarding(true);
    setStudentProfile(null);
  };

  const handleConceptExplain = () => {
    if (conceptInput.trim()) {
      setCurrentTopic(`Explaining: ${conceptInput}`);
      setShowChat(true);
      toast.success(`Let's explore: ${conceptInput}`);
    }
  };

  const handleTopicClick = (topicTitle: string) => {
    setCurrentTopic(topicTitle);
    setShowChat(true);
    toast.success(`Starting ${topicTitle} exploration!`);
  };

  const handleQuickAction = (action: string) => {
    setCurrentTopic(action);
    setShowChat(true);
    toast.success(`Let's ${action.toLowerCase()}!`);
  };

  const handleBackToDashboard = () => {
    setShowChat(false);
    setCurrentTopic("");
  };

  // Replace mock calculations with real data
  const streak = studentStats?.currentStreak || 0;
  const weeklyProgress = studentStats?.weeklyProgress || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-300 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingWizard onComplete={handleOnboardingComplete} />
    );
  }

  if (showChat) {
    return (
      <TutorChat 
        studentProfile={studentProfile || undefined} 
        onBack={handleBackToDashboard}
        initialTopic={currentTopic}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simplified Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            TutorByAI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetOnboarding}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Link href="/profile">
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
          <SignOutButton />
        </div>
      </nav>

      {/* Simplified Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Simplified Personalized Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Streak: {streak} days</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">What would you like to work on today?</p>
          
          {/* Profile Tags */}
          {studentProfile && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                Grade {studentProfile.gradeLevel}
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                {studentProfile.learningStyle?.replace('_', ' ')} Learner
              </span>
              {studentProfile.interests?.slice(0, 2).map((interest, index) => (
                <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm font-medium rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Simplified Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Continue Learning</h3>
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {studentStats?.lastSession?.topic || "Start Learning"}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {studentStats?.lastSession 
                        ? `Progress: ${studentStats.lastSession.progress}% complete`
                        : "Begin your AI tutoring journey"
                      }
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowChat(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {studentStats?.lastSession ? "Continue" : "Start"}
                  </Button>
                </div>
              </div>
            </div>

            {/* SAT Prep Card - Only shown for high school students interested in SAT prep */}
            {studentProfile && studentProfile.isInterestedInSATPrep && studentProfile.gradeLevel && studentProfile.gradeLevel >= 9 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Target className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SAT Preparation</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Personalized SAT study plan and practice tests</p>
                <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Link href="/tutoring/sat-prep">
                    Access Dashboard
                  </Link>
                </Button>
              </div>
            )}

            {/* Progress Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Progress</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Learning Streak */}
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">Day Streak</div>
                </div>

                {/* Weekly Progress */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Weekly Goals</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{weeklyProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-5 w-5 text-yellow-500 flex items-center justify-center">🏆</div>
                    <span className="font-medium text-gray-900 dark:text-white">Achievements</span>
                  </div>
                  <div className="text-center text-2xl font-bold text-gray-900 dark:text-white">
                    {studentStats?.completedAchievements || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subjects</h3>
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                  View All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredTopics.map((topic, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleTopicClick(topic.title)}
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <topic.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{topic.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{topic.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-4">
                {/* Explain Concept */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Explain Concept</h4>
                  <div className="space-y-3">
                    <Input 
                      placeholder="What do you want to learn about?"
                      value={conceptInput}
                      onChange={(e) => setConceptInput(e.target.value)}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <Button 
                      onClick={handleConceptExplain}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Explain
                    </Button>
                  </div>
                </div>

                {/* Practice Problems */}
                <div 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative"
                  onClick={() => handleQuickAction("Practice Problems")}
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <PuzzleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Practice Problems</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Get personalized practice questions</p>
                    </div>
                  </div>
                </div>

                {/* Homework Help */}
                <div 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative"
                  onClick={() => handleQuickAction("Homework Help")}
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Homework Help</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Get help with your assignments</p>
                    </div>
                  </div>
                </div>

                {/* Study Suggestions */}
                <div 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative"
                  onClick={() => handleQuickAction("Study Suggestions")}
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Compass className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Study Suggestions</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Personalized recommendations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
