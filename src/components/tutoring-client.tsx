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
  Award,
  Calculator,
  BookOpen,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";
import VoiceInteraction from "@/components/tutoring/voice-interaction";

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
    title: "Math Magic 🧙‍♂️",
    description: "Make numbers your best friends!",
    icon: Calculator,
    gradient: "from-purple-500 to-pink-500",
    difficulty: "Fun",
    emoji: "🔢"
  },
  {
    title: "Science Adventures 🔬",
    description: "Discover how the world works!",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
    difficulty: "Cool",
    emoji: "⚙️"
  },
  {
    title: "English Stories 📚",
    description: "Read, write, and create amazing tales!",
    icon: BookOpen,
    gradient: "from-green-500 to-teal-500",
    difficulty: "Creative",
    emoji: "✍️"
  },
  {
    title: "History Heroes 🏰",
    description: "Meet amazing people from the past!",
    icon: Target,
    gradient: "from-orange-500 to-red-500",
    difficulty: "Epic",
    emoji: "🗺️"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Enhanced Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-3/4 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Additional floating elements for more depth */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-float"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full animate-float delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-full animate-float delay-500"></div>
      </div>

      {/* Enhanced Navigation with Glassmorphism */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-10 w-10 text-purple-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-bounce">
              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
            </div>
          </div>
          <span className="text-2xl font-bold gradient-text-primary">
            TutorByAI
          </span>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 glass border border-white/20 rounded-full px-3 py-1">
            <span className="text-xs font-semibold text-purple-200">✨ AI Powered</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetOnboarding}
            className="text-purple-200 hover:text-white hover:bg-white/10 glass border border-white/20 transition-all duration-300 ease-bounce rounded-xl"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-white/10 glass border border-white/20 transition-all duration-300 ease-bounce rounded-xl">
            <Link href="/profile">
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>
          <SignOutButton />
        </div>
      </nav>

      {/* Enhanced Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        {/* Enhanced Personalized Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 glass border border-orange-500/30 rounded-full px-4 py-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-bold text-white">Streak: {streak} days! 🔥</span>
          </div>
          
          <h1 className="text-display text-white mb-4 animate-bounce-in">
            Hey there, <span className="gradient-text-fun">{user.name?.split(' ')[0] || 'Champion'}</span>! 🎆
          </h1>
          <p className="text-xl text-purple-200 mb-6">What awesome thing do you want to learn today?</p>
          
          {/* Enhanced Profile Tags */}
          {studentProfile && (
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="px-4 py-2 bg-white/10 glass border border-white/20 rounded-full text-purple-200 font-medium card-hover transition-all duration-300">
                🎯 Grade {studentProfile.gradeLevel}
              </span>
              <span className="px-4 py-2 bg-white/10 glass border border-white/20 rounded-full text-purple-200 font-medium card-hover transition-all duration-300">
                🧠 {studentProfile.learningStyle?.replace('_', ' ')} Learner
              </span>
              {studentProfile.interests?.slice(0, 2).map((interest, index) => (
                <span key={index} className="px-4 py-2 bg-white/10 glass border border-white/20 rounded-full text-purple-200 font-medium card-hover transition-all duration-300">
                  🌟 {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Continue Your Journey */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl card-hover transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Continue Your Journey</h3>
                  <p className="text-purple-200">Pick up where you left off</p>
                </div>
                <div className="text-cyan-400 animate-pulse">
                  <Play className="h-8 w-8" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 glass rounded-2xl p-6 border border-white/10">
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
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white border-0 rounded-xl px-6 transition-all duration-300 hover:scale-105"
                  >
                    {studentStats?.lastSession ? "Continue" : "Start"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Tracker Widget */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl card-hover transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-6">Your Progress</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Enhanced Learning Streak */}
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

                {/* Enhanced Weekly Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Weekly Goals</span>
                    <span className="text-cyan-400 font-bold">{weeklyProgress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 mb-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${weeklyProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-purple-200 text-xs">
                    {weeklyProgress >= 100 ? "Goal achieved! 🎉" : "Keep it up! You're doing great!"}
                  </p>
                  
                  {/* Enhanced Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-white/5 glass rounded-lg p-2 text-center border border-white/10 card-hover transition-all duration-300">
                      <div className="text-cyan-400 font-bold text-sm">
                        {studentStats?.problemsSolved || 0}
                      </div>
                      <div className="text-purple-200 text-xs">Problems</div>
                    </div>
                    <div className="bg-white/5 glass rounded-lg p-2 text-center border border-white/10 card-hover transition-all duration-300">
                      <div className="text-purple-400 font-bold text-sm">
                        {Math.round((studentStats?.totalStudyTime || 0) / 60)}h
                      </div>
                      <div className="text-purple-200 text-xs">Study Time</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Achievement Badge */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 glass rounded-2xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-500/30 rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Latest Achievement</h4>
                    </div>
                  </div>
                  <p className="text-yellow-200 text-xs text-center">
                    {studentStats?.completedAchievements > 0 ? "Problem Solver" : "Getting Started"}
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Featured Topics Carousel */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl card-hover transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Featured Topics</h3>
                  <p className="text-purple-200">Explore trending subjects</p>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-200 hover:text-white hover:bg-white/10 glass border border-white/20 rounded-xl transition-all duration-300">
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
                    <div className={`absolute inset-0 bg-gradient-to-br ${topic.gradient} opacity-10 group-hover:opacity-20 transition-opacity rounded-2xl`}></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <topic.icon className="h-8 w-8 text-white" />
                        <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full border border-white/10">
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

          {/* Enhanced Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Enhanced Quick Start Learning Cards */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl card-hover transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-6">Quick Start</h3>
              
              <div className="grid grid-cols-1 gap-4">

                {/* SAT Prep Card - Only shown for high school students interested in SAT prep */}
                {studentProfile && studentProfile.isInterestedInSATPrep && studentProfile.gradeLevel && studentProfile.gradeLevel >= 9 && (
                  <div 
                    className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 glass rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-yellow-500/30 rounded-lg">
                        <Target className="h-5 w-5 text-yellow-300" />
                      </div>
                      <h4 className="font-semibold text-white">SAT Preparation</h4>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">Personalized SAT study plan and practice tests</p>
                    <Button asChild className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 rounded-xl h-10 transition-all duration-300 hover:scale-105">
                      <Link href="/tutoring/sat-prep">
                        Access Dashboard
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Enhanced Explain Concept Card */}
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 glass rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-500/30 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-300" />
                    </div>
                    <h4 className="font-semibold text-white">Explain Concept</h4>
                  </div>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Enter concept or speak..."
                      value={conceptInput}
                      onChange={(e) => setConceptInput(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 h-10 rounded-xl"
                    />
                    
                    {/* Voice Interaction Component */}
                    <VoiceInteraction
                      onVoiceInput={(text) => {
                        setConceptInput(text);
                        // Optionally auto-submit after voice input
                        setTimeout(() => {
                          if (text.trim()) {
                            setCurrentTopic(`Explaining: ${text}`);
                            setShowChat(true);
                          }
                        }, 500);
                      }}
                    />
                    
                    <Button 
                      onClick={handleConceptExplain}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl h-10 transition-all duration-300 hover:scale-105"
                    >
                      Explain
                    </Button>
                  </div>
                </div>

                {/* Enhanced Practice Problems Card */}
                <div 
                  className="bg-gradient-to-br from-green-500/20 to-teal-500/20 glass rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => handleQuickAction("Practice Problems")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-500/30 rounded-lg">
                      <PuzzleIcon className="h-5 w-5 text-green-300" />
                    </div>
                    <h4 className="font-semibold text-white">Practice Problems</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">Get personalized practice questions</p>
                  
                  {/* Add voice option for specific subjects */}
                  <div className="mb-3">
                    <VoiceInteraction
                      onVoiceInput={(text) => {
                        handleQuickAction(`Practice Problems: ${text}`);
                      }}
                    />
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-0 rounded-xl h-10 transition-all duration-300 hover:scale-105">
                    Start Practice
                  </Button>
                </div>

                {/* Enhanced Homework Help Card */}
                <div 
                  className="bg-gradient-to-br from-orange-500/20 to-red-500/20 glass rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => handleQuickAction("Homework Help")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-500/30 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-300" />
                    </div>
                    <h4 className="font-semibold text-white">Homework Help</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-8 text-xs transition-all duration-300 hover:scale-105">
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-8 text-xs transition-all duration-300 hover:scale-105">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Enhanced Study Suggestions Card */}
                <div 
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 glass rounded-2xl p-4 border border-white/10 group hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => handleQuickAction("Study Suggestions")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-500/30 rounded-lg">
                      <Compass className="h-5 w-5 text-purple-300" />
                    </div>
                    <h4 className="font-semibold text-white">Study Suggestions</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">Personalized recommendations for you</p>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl h-10 transition-all duration-300 hover:scale-105">
                    Get Suggestions
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}