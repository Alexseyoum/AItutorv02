"use client";

import { useState, useEffect } from "react";
import OnboardingWizard from "@/components/onboarding/onboarding-wizard";
import TutorChat from "@/components/tutoring/tutor-chat";
import { toast } from "sonner";
import { StudentProfile } from "@/lib/types";
import { 
  Brain, 
  Lightbulb, 
  PuzzleIcon, 
  FileText, 
  Compass, 
  Settings, 
  Flame, 
  Trophy, 
  Target,
  ChevronRight,
  Play,
  Camera,
  Upload,
  Zap,
  Star,
  TrendingUp,
  Clock,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface TutoringClientProps {
  user: User;
}

const featuredTopics = [
  {
    title: "Artificial Intelligence",
    description: "Explore the future of technology",
    icon: Brain,
    gradient: "from-purple-500 to-pink-500",
    difficulty: "Intermediate"
  },
  {
    title: "Web Development",
    description: "Build amazing websites",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
    difficulty: "Beginner"
  },
  {
    title: "Machine Learning",
    description: "Teach computers to learn",
    icon: TrendingUp,
    gradient: "from-green-500 to-teal-500",
    difficulty: "Advanced"
  },
  {
    title: "Data Science",
    description: "Uncover insights from data",
    icon: Target,
    gradient: "from-orange-500 to-red-500",
    difficulty: "Intermediate"
  }
];

export default function TutoringClient({ user }: TutoringClientProps) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [conceptInput, setConceptInput] = useState("");
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [studentStats, setStudentStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile and stats in parallel
        const [profileResponse, statsResponse] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/student-stats")
        ]);
        
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await profileResponse.json();
        const profile = profileData.profile;
        
        setStudentProfile(profile);
        setShowOnboarding(!profile.isOnboarded);

        // Set stats if available
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-400/30 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-t-purple-400 rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-purple-200 mt-4 text-lg">Loading your learning space...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-10 w-10 text-purple-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            TutorByAI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetOnboarding}
            className="text-purple-200 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20">
            <Link href="/profile">Profile</Link>
          </Button>
          <SignOutButton />
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        {/* Personalized Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Welcome back, <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{user.name?.split(' ')[0] || 'Student'}</span>! 🚀
          </h1>
          <p className="text-xl text-purple-200 mb-6">Ready to unlock new knowledge today?</p>
          
          {/* Profile Tags */}
          {studentProfile && (
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-purple-200 font-medium hover:bg-white/20 transition-all cursor-pointer">
                Grade {studentProfile.gradeLevel}
              </span>
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-purple-200 font-medium hover:bg-white/20 transition-all cursor-pointer">
                {studentProfile.learningStyle?.replace('_', ' ')} Learner
              </span>
              {studentProfile.interests?.slice(0, 2).map((interest, index) => (
                <span key={index} className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-purple-200 font-medium hover:bg-white/20 transition-all cursor-pointer">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Your Journey */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Continue Your Journey</h3>
                  <p className="text-purple-200">Pick up where you left off</p>
                </div>
                <div className="text-cyan-400">
                  <Play className="h-8 w-8" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {studentStats?.lastSession?.topic || "Start Learning"}
                    </h4>
                    <p className="text-purple-200 text-sm">
                      {studentStats?.lastSession 
                        ? `Progress: ${studentStats.lastSession.progress}% complete`
                        : "Begin your AI tutoring journey"
                      }
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowChat(true)}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 rounded-xl px-6"
                  >
                    {studentStats?.lastSession ? "Continue" : "Start"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Featured Topics Carousel */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Featured Topics</h3>
                  <p className="text-purple-200">Explore trending subjects</p>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-200 hover:text-white">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredTopics.map((topic, index) => (
                  <div 
                    key={index}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 p-6 hover:scale-105 transition-all duration-300 cursor-pointer"
                    onClick={() => handleTopicClick(topic.title)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${topic.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <topic.icon className="h-8 w-8 text-white" />
                        <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                          {topic.difficulty}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">{topic.title}</h4>
                      <p className="text-purple-200 text-sm">{topic.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Progress */}
          <div className="space-y-6">
            {/* Quick Start Learning Cards */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Quick Start</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Explain Concept Card */}
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/30 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-300" />
                    </div>
                    <h4 className="font-semibold text-white">Explain Concept</h4>
                  </div>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Enter concept..."
                      value={conceptInput}
                      onChange={(e) => setConceptInput(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-10 rounded-xl"
                    />
                    <Button 
                      onClick={handleConceptExplain}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl h-10"
                    >
                      Explain
                    </Button>
                  </div>
                </div>

                {/* Practice Problems Card */}
                <div 
                  className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all cursor-pointer"
                  onClick={() => handleQuickAction("Practice Problems")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-500/30 rounded-lg">
                      <PuzzleIcon className="h-5 w-5 text-green-300" />
                    </div>
                    <h4 className="font-semibold text-white">Practice Problems</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">Get personalized practice questions</p>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-0 rounded-xl h-10">
                    Start Practice
                  </Button>
                </div>

                {/* Homework Help Card */}
                <div 
                  className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all cursor-pointer"
                  onClick={() => handleQuickAction("Homework Help")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-500/30 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-300" />
                    </div>
                    <h4 className="font-semibold text-white">Homework Help</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-8 text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-8 text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Study Suggestions Card */}
                <div 
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all cursor-pointer"
                  onClick={() => handleQuickAction("Study Suggestions")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-500/30 rounded-lg">
                      <Compass className="h-5 w-5 text-purple-300" />
                    </div>
                    <h4 className="font-semibold text-white">Study Suggestions</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">Personalized recommendations for you</p>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl h-10">
                    Get Suggestions
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress Tracker Widget */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Your Progress</h3>
              
              <div className="space-y-6">
                {/* Learning Streak */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center mb-3 mx-auto shadow-lg">
                      <Flame className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-900">{streak}</span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-white">Learning Streak</h4>
                  <p className="text-purple-200 text-sm">{streak} days in a row!</p>
                </div>

                {/* Weekly Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Weekly Goals</span>
                    <span className="text-cyan-400 font-bold">{weeklyProgress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-purple-200 text-xs mt-1">
                    {weeklyProgress >= 100 ? "Goal achieved! 🎉" : "Keep it up! You're doing great!"}
                  </p>
                </div>

                {/* Achievement Badge */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/30 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Latest Achievement</h4>
                      <p className="text-yellow-200 text-xs">
                        {studentStats?.completedAchievements > 0 ? "Problem Solver" : "Getting Started"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <div className="text-cyan-400 font-bold text-lg">
                      {studentStats?.problemsSolved || 0}
                    </div>
                    <div className="text-purple-200 text-xs">Problems Solved</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <div className="text-purple-400 font-bold text-lg">
                      {Math.round((studentStats?.totalStudyTime || 0) / 60)}h
                    </div>
                    <div className="text-purple-200 text-xs">Study Time</div>
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