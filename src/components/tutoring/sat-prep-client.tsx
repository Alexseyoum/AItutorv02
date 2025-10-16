"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Calendar, 
  Target, 
  Trophy, 
  Clock, 
  FileText, 
  Play, 
  Brain,
  Zap,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  BookMarked,
  Check
} from "lucide-react";
import { StudentProfile, SATStudyPlan, SATPracticeSession, SATDiagnosticResult } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface SATPrepClientProps {
  user: User;
  profile: StudentProfile;
}

const SAT_RESOURCES = [
  {
    title: "Official SAT Practice (Khan Academy)",
    description: "Free personalized SAT practice, progress tracking, and college readiness resources",
    url: "https://satsuite.collegeboard.org/sat/practice-preparation/khan-academy",
    type: "official",
    icon: BookOpen
  },
  {
    title: "College Board Official SAT Study Guide",
    description: "The official study guide with 8 real practice tests",
    url: "https://satsuite.collegeboard.org/sat/practice-preparation/study-guide",
    type: "official",
    icon: BookMarked
  },
  {
    title: "SAT Practice Tests",
    description: "Free official SAT practice tests from College Board",
    url: "https://satsuite.collegeboard.org/sat/practice-preparation/practice-tests",
    type: "official",
    icon: FileText
  }
];

export default function SATPrepClient({ user, profile }: SATPrepClientProps) {
  const { data: session } = useSession();
  const [studyPlan, setStudyPlan] = useState<SATStudyPlan | null>(null);
  const [practiceSessions, setPracticeSessions] = useState<SATPracticeSession[]>([]);
  const [diagnosticResult, setDiagnosticResult] = useState<SATDiagnosticResult | null>(null);
  const [satStats, setSatStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study-plan' | 'practice' | 'resources'>('dashboard');

  // Add new state for practice session
  const [currentSession, setCurrentSession] = useState<{section: string, startTime: Date} | null>(null);

  // Function to update study plan progress
  const updateStudyPlanProgress = async (week: number, task: string, completed: boolean) => {
    if (!studyPlan) return;

    try {
      const response = await fetch("/api/ai/sat/study-plan", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: studyPlan.id,
          week,
          task,
          completed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast.error("Please log in to update your study plan");
          return;
        }
        throw new Error(errorData.error || "Failed to update study plan");
      }

      const data = await response.json();
      setStudyPlan(data.studyPlan);
      toast.success(completed ? "Task marked as completed!" : "Task marked as not completed");
    } catch (error: unknown) {
      console.error("Error updating study plan:", error);
      toast.error("Failed to update study plan");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch SAT data in parallel
        const [studyPlanRes, sessionsRes, diagnosticRes, statsRes] = await Promise.all([
          fetch("/api/ai/sat/study-plan"),
          fetch("/api/ai/sat/practice-sessions"),
          fetch("/api/ai/sat/diagnostic"),
          fetch("/api/ai/sat/stats")
        ]);

        if (studyPlanRes.ok) {
          const data = await studyPlanRes.json();
          setStudyPlan(data.studyPlan);
        } else if (studyPlanRes.status === 401) {
          toast.error("Please log in to view your study plan");
        } else {
          const errorText = await studyPlanRes.text().catch(() => 'Unknown error');
          console.error("Failed to fetch study plan:", studyPlanRes.status, errorText);
          try {
            const errorData = JSON.parse(errorText);
            toast.error(`Failed to load study plan: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch {
            toast.error(`Failed to load study plan: ${studyPlanRes.status} ${errorText}`);
          }
        }

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setPracticeSessions(data.sessions);
        } else if (sessionsRes.status === 401) {
          toast.error("Please log in to view your practice sessions");
        } else {
          const errorText = await sessionsRes.text().catch(() => 'Unknown error');
          console.error("Failed to fetch practice sessions:", sessionsRes.status, errorText);
          try {
            const errorData = JSON.parse(errorText);
            toast.error(`Failed to load practice sessions: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch {
            toast.error(`Failed to load practice sessions: ${sessionsRes.status} ${errorText}`);
          }
        }

        if (diagnosticRes.ok) {
          const data = await diagnosticRes.json();
          setDiagnosticResult(data.diagnostic);
        } else if (diagnosticRes.status === 401) {
          toast.error("Please log in to view your diagnostic results");
        } else {
          const errorText = await diagnosticRes.text().catch(() => 'Unknown error');
          console.error("Failed to fetch diagnostic results:", diagnosticRes.status, errorText);
          try {
            const errorData = JSON.parse(errorText);
            toast.error(`Failed to load diagnostic results: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch {
            toast.error(`Failed to load diagnostic results: ${diagnosticRes.status} ${errorText}`);
          }
        }
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setSatStats(data.stats);
        } else if (statsRes.status === 401) {
          toast.error("Please log in to view your SAT stats");
        } else {
          const errorText = await statsRes.text().catch(() => 'Unknown error');
          console.error("Failed to fetch SAT stats:", statsRes.status, errorText);
          try {
            const errorData = JSON.parse(errorText);
            toast.error(`Failed to load SAT statistics: ${errorData.error || errorData.message || 'Unknown error'}`);
          } catch {
            toast.error(`Failed to load SAT statistics: ${statsRes.status} ${errorText}`);
          }
        }

      } catch (error: unknown) {
        console.error("Error fetching SAT data:", error);
        toast.error("Failed to load SAT preparation data. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateStudyPlan = async () => {
    setIsLoading(true);
    try {
      // Get user profile data for the AI prompt
      const promptData = {
        studentName: user.name || "Student",
        grade: profile.gradeLevel || 10,
        goals: profile.learningGoals || ["SAT Preparation"],
        baselineScores: diagnosticResult 
          ? { 
              math: diagnosticResult.mathScore, 
              ebrw: Math.round(((diagnosticResult.readingScore || 0) + (diagnosticResult.writingScore || 0)) / 2) 
            } 
          : null,
        weeklyHours: profile.sessionDuration || 5,
        targetDate: null, // Could be customized
        learningStyle: profile.learningStyle || "mixed"
      };

      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Check if it's an authentication error
        if (response.status === 401) {
          toast.error("Please log in to generate a study plan");
          return;
        }
        throw new Error(errorData.error || "Failed to generate study plan");
      }

      const data = await response.json();
      setStudyPlan(data.plan);
      toast.success("Study plan generated successfully!");
    } catch (error: unknown) {
      console.error("Error generating study plan:", error);
      toast.error("Failed to generate study plan");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to start a practice session
  const startPracticeSession = async (section: 'math' | 'reading' | 'writing' | 'full') => {
    try {
      const response = await fetch("/api/ai/sat/practice-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          score: 0,
          maxScore: section === 'full' ? 1600 : 800,
          answers: {},
          timeSpent: 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        // Check if it's an authentication error
        if (response.status === 401) {
          toast.error("Please log in to start a practice session");
          return;
        }
        throw new Error(errorData.error || "Failed to start practice session");
      }

      const data = await response.json();
      setCurrentSession({section, startTime: new Date()});
      setPracticeSessions([data.session, ...practiceSessions]);
      
      // Navigate to the practice page with the session ID
      window.location.href = `/tutoring/sat-prep/practice?sessionId=${data.session.id}`;
    } catch (error: unknown) {
      console.error("Error starting practice session:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to start practice session");
      } else {
        toast.error("Failed to start practice session");
      }
    }
  };

  // Function to start diagnostic test
  const startDiagnosticTest = async () => {
    try {
      // Navigate to the diagnostic test page
      window.location.href = '/tutoring/sat-prep/diagnostic';
    } catch (error: unknown) {
      console.error("Error starting diagnostic test:", error);
      toast.error("Failed to start diagnostic test");
    }
  };

  // Function to complete diagnostic test (for demo purposes)
  const completeDiagnosticTest = async () => {
    try {
      const mockScores = {
        mathScore: Math.floor(Math.random() * 200) + 200, // 200-400
        readingScore: Math.floor(Math.random() * 200) + 200, // 200-400
        writingScore: Math.floor(Math.random() * 200) + 200, // 200-400
        totalScore: 0,
        strengths: ["Algebra", "Grammar"],
        weaknesses: ["Geometry", "Reading Comprehension"]
      };
      
      mockScores.totalScore = mockScores.mathScore + mockScores.readingScore + mockScores.writingScore;

      const response = await fetch("/api/ai/sat/diagnostic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockScores),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Check if it's an authentication error
        if (response.status === 401) {
          toast.error("Please log in to save diagnostic results");
          return;
        }
        throw new Error(errorData.error || "Failed to save diagnostic results");
      }

      const data = await response.json();
      setDiagnosticResult(data.diagnostic);
      toast.success("Diagnostic test completed! Check your results.");
    } catch (error: unknown) {
      console.error("Error completing diagnostic test:", error);
      toast.error("Failed to complete diagnostic test");
    }
  };

  // Function to complete practice session (for demo purposes)
  const completePracticeSession = async (sessionId: string) => {
    try {
      // Find the session in our local state
      const session = practiceSessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Generate a mock score
      const maxScore = session.section === 'full' ? 1600 : 800;
      const score = Math.floor(Math.random() * maxScore * 0.5) + Math.floor(maxScore * 0.3); // 30-80% of max

      // Update the session
      const response = await fetch(`/api/ai/sat/practice-sessions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: sessionId,
          score: score,
          maxScore: maxScore,
          completedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Check if it's an authentication error
        if (response.status === 401) {
          toast.error("Please log in to complete practice sessions");
          return;
        }
        throw new Error(errorData.error || "Failed to complete practice session");
      }

      const data = await response.json();
      
      // Update local state
      setPracticeSessions(practiceSessions.map(s => 
        s.id === sessionId ? {...s, ...data.session} : s
      ));
      
      toast.success(`Practice session completed! Score: ${score}/${maxScore}`);
    } catch (error: unknown) {
      console.error("Error completing practice session:", error);
      toast.error("Failed to complete practice session");
    }
  };

  // Function to calculate study plan progress
  const calculateStudyPlanProgress = () => {
    if (!studyPlan || !studyPlan.aiGeneratedPlan) return 0;
    
    // Type assertion to tell TypeScript that aiGeneratedPlan is an object with weeks property
    const aiPlan = studyPlan.aiGeneratedPlan as { weeks?: any[] };
    if (!aiPlan.weeks) return 0;
    
    const totalWeeks = aiPlan.weeks.length;
    const completedWeeks = studyPlan.completedWeeks?.length || 0;
    
    return totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
  };

  const overallProgress = diagnosticResult 
    ? Math.round((diagnosticResult.totalScore || 0) / 1600 * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-400/30 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-t-purple-400 rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-purple-200 mt-4 text-lg">Loading your SAT prep dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
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
            <Brain className="h-10 w-10 text-purple-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-bounce">
              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
            </div>
          </div>
          <span className="text-2xl font-bold gradient-text-primary">
            SAT Prep
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="text-purple-200 hover:text-white hover:bg-white/10 glass border border-white/20 transition-all duration-300 ease-bounce rounded-xl"
          >
            Back to Dashboard
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-display text-white mb-4 animate-bounce-in">
            SAT Preparation, <span className="gradient-text-fun">{user.name?.split(' ')[0] || 'Student'}</span>! 🎓
          </h1>
          <p className="text-xl text-purple-200 mb-6">Your personalized path to SAT success</p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="secondary" className="px-4 py-2 bg-white/10 glass border border-white/20 text-purple-200 font-medium">
              🎯 Grade {profile.gradeLevel}
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-white/10 glass border border-white/20 text-purple-200 font-medium">
              📚 {profile.learningStyle?.replace('_', ' ')} Learner
            </Badge>
            {profile.interests?.slice(0, 2).map((interest, index) => (
              <Badge key={index} variant="secondary" className="px-4 py-2 bg-white/10 glass border border-white/20 text-purple-200 font-medium">
                🌟 {interest}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/10 glass border border-white/20 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('study-plan')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'study-plan'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Study Plan
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'practice'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Practice
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'resources'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Resources
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Progress Overview */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                  Your SAT Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {satStats ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Overall Progress</span>
                        <span className="text-cyan-400 font-bold">{satStats.studyPlanProgress || 0}%</span>
                      </div>
                      <Progress value={satStats.studyPlanProgress || 0} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-blue-500/30 rounded">
                            <Target className="h-4 w-4 text-blue-300" />
                          </div>
                          <span className="text-sm font-medium text-white">Math</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-400">
                          {satStats.latestDiagnostic?.mathScore || diagnosticResult?.mathScore || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                      
                      <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-green-500/30 rounded">
                            <BookOpen className="h-4 w-4 text-green-300" />
                          </div>
                          <span className="text-sm font-medium text-white">Reading</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">
                          {satStats.latestDiagnostic?.readingScore || diagnosticResult?.readingScore || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                      
                      <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-purple-500/30 rounded">
                            <FileText className="h-4 w-4 text-purple-300" />
                          </div>
                          <span className="text-sm font-medium text-white">Writing</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-400">
                          {satStats.latestDiagnostic?.writingScore || diagnosticResult?.writingScore || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">Score</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-300">Strengths:</span>
                      {(satStats.latestDiagnostic?.strengths || diagnosticResult?.strengths)?.slice(0, 3).map((strength: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-300">Areas to Improve:</span>
                      {(satStats.latestDiagnostic?.weaknesses || diagnosticResult?.weaknesses)?.slice(0, 3).map((weakness: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          {weakness}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        onClick={startDiagnosticTest}
                        variant="outline"
                        className="w-full border-purple-500 text-purple-300 hover:bg-purple-500/20"
                      >
                        Retake Diagnostic Test
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Take a Diagnostic Test</h3>
                    <p className="text-purple-200 mb-4">
                      Start with a diagnostic test to identify your strengths and areas for improvement.
                    </p>
                    <Button 
                      onClick={startDiagnosticTest}
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                    >
                      Start Diagnostic
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Practice Sessions */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Clock className="h-6 w-6 text-purple-400" />
                  Recent Practice
                </CardTitle>
              </CardHeader>
              <CardContent>
                {satStats ? (
                  <div className="space-y-6">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 glass rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xl font-bold text-cyan-400">{satStats.totalSessions}</div>
                        <div className="text-xs text-gray-400">Total Sessions</div>
                      </div>
                      <div className="bg-white/5 glass rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xl font-bold text-green-400">{satStats.completionRate}%</div>
                        <div className="text-xs text-gray-400">Completion Rate</div>
                      </div>
                      <div className="bg-white/5 glass rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xl font-bold text-purple-400">{Math.floor((satStats.totalStudyTime || 0) / 60)}h</div>
                        <div className="text-xs text-gray-400">Study Time</div>
                      </div>
                      <div className="bg-white/5 glass rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-xl font-bold text-orange-400">{satStats.weeklyStudyTime || 0}m</div>
                        <div className="text-xs text-gray-400">This Week</div>
                      </div>
                    </div>
                    
                    {/* Recent Sessions */}
                    {practiceSessions.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-medium text-white">Recent Sessions</h3>
                        {practiceSessions.slice(0, 3).map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                            <div>
                              <div className="font-medium text-white capitalize">{session.section} Practice</div>
                              <div className="text-sm text-gray-400">
                                {session.completedAt 
                                  ? new Date(session.completedAt).toLocaleDateString() 
                                  : 'In progress'}
                              </div>
                            </div>
                            {session.score && session.maxScore ? (
                              <div className="text-right">
                                <div className="font-bold text-cyan-400">{session.score}/{session.maxScore}</div>
                                <div className="text-xs text-gray-400">
                                  {Math.round((session.score / session.maxScore) * 100)}% correct
                                </div>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => completePracticeSession(session.id)}
                                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Play className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <h3 className="text-md font-medium text-white mb-1">No Practice Sessions Yet</h3>
                        <p className="text-purple-200 text-sm">
                          Start practicing to build your skills.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Practice Data Available</h3>
                    <p className="text-purple-200 mb-4">
                      Complete practice sessions to see your statistics.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('practice')}
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                    >
                      Start Practicing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Study Plan Tab */}
        {activeTab === 'study-plan' && (
          <div className="space-y-8">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-purple-400" />
                    Your SAT Study Plan
                  </span>
                  {!studyPlan && (
                    <Button 
                      onClick={generateStudyPlan}
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                    >
                      Generate Plan
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studyPlan ? (
                  <div className="space-y-6">
                    {studyPlan.aiGeneratedPlan ? (
                      // Display AI-generated plan
                      <div className="space-y-6">
                        <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-white">AI-Powered Personalized Plan</span>
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              Generated
                            </Badge>
                          </div>
                          <p className="text-purple-200 text-sm">
                            Custom plan based on your profile and goals
                          </p>
                          
                          {/* Progress indicator */}
                          {studyPlan.aiGeneratedPlan.weeks && (
                            <div className="mt-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">Overall Progress</span>
                                <span className="text-sm font-medium text-cyan-400">
                                  {calculateStudyPlanProgress()}% Complete
                                </span>
                              </div>
                              <Progress 
                                value={calculateStudyPlanProgress()} 
                                className="h-2" 
                              />
                              <div className="text-xs text-gray-400 mt-1">
                                {studyPlan.completedWeeks?.length || 0} of {(studyPlan.aiGeneratedPlan as { weeks?: any[] })?.weeks?.length || 0} weeks completed
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {studyPlan.aiGeneratedPlan.tips && (
                          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                              <Zap className="h-5 w-5 text-yellow-400" />
                              Pro Tips
                            </h3>
                            <ul className="space-y-1">
                              {studyPlan.aiGeneratedPlan.tips.map((tip: string, index: number) => (
                                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <h3 className="font-bold text-white text-lg">Weekly Plan</h3>
                          {studyPlan.aiGeneratedPlan && studyPlan.aiGeneratedPlan.weeks && studyPlan.aiGeneratedPlan.weeks.map((week, index: number) => (
                            <Card key={index} className="bg-white/5 border border-white/10 rounded-xl">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-bold text-white">Week {week.week}: {week.focus}</h4>
                                  <Badge 
                                    variant="secondary" 
                                    className={
                                      studyPlan.completedWeeks?.includes(week.week) 
                                        ? "bg-green-500/20 text-green-300 border-green-500/30" 
                                        : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                    }
                                  >
                                    {studyPlan.completedWeeks?.includes(week.week) ? (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Completed
                                      </span>
                                    ) : (
                                      <span>{week.daily_plan.length} tasks</span>
                                    )}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-2 mb-3">
                                  {week.daily_plan.map((task, taskIndex: number) => {
                                    // Check if task is completed
                                    const isCompleted = studyPlan.completedTasks && 
                                      studyPlan.completedTasks[week.week.toString()] && 
                                      studyPlan.completedTasks[week.week.toString()][task.day];
                                      
                                    return (
                                      <div 
                                        key={taskIndex} 
                                        className={`flex items-center gap-2 p-2 rounded border transition-all ${
                                          isCompleted 
                                            ? "bg-green-500/10 border-green-500/30" 
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                        }`}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`w-6 h-6 p-0 rounded-full ${
                                            isCompleted 
                                              ? "bg-green-500 hover:bg-green-600" 
                                              : "border border-gray-400 hover:bg-gray-600"
                                          }`}
                                          onClick={() => updateStudyPlanProgress(week.week, task.day, !isCompleted)}
                                        >
                                          {isCompleted && <Check className="h-3 w-3 text-white" />}
                                        </Button>
                                        <div className="flex-1">
                                          <div className={`text-sm ${isCompleted ? "text-green-300 line-through" : "text-white"}`}>
                                            {task.task}
                                          </div>
                                          <div className="text-xs text-gray-400">{task.duration_minutes} minutes</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {week.resources && week.resources.length > 0 && (
                                  <div className="pt-2 border-t border-white/10">
                                    <h5 className="text-xs font-medium text-gray-400 mb-1">RESOURCES</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {week.resources.map((resource, resIndex: number) => (
                                        <a 
                                          key={resIndex}
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1 text-purple-300 transition-colors flex items-center gap-1"
                                        >
                                          {resource.title}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Display basic plan
                      <div className="space-y-6">
                        <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-white">Timeline</span>
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {studyPlan.timeline}
                            </Badge>
                          </div>
                          <p className="text-purple-200 text-sm">
                            Personalized study plan based on your current level and goals
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-400" />
                              Math Focus Areas
                            </h3>
                            <ul className="space-y-2">
                              {studyPlan.focusAreas.math.map((area, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                  {area}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-green-400" />
                              Reading Focus Areas
                            </h3>
                            <ul className="space-y-2">
                              {studyPlan.focusAreas.reading.map((area, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                  {area}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-400" />
                              Writing Focus Areas
                            </h3>
                            <ul className="space-y-2">
                              {studyPlan.focusAreas.writing.map((area, index) => (
                                <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                  {area}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                          <h3 className="font-bold text-white mb-3">Weekly Schedule Preview</h3>
                          <div className="space-y-3">
                            {Object.entries(studyPlan.weeklySchedule).slice(0, 3).map(([week, schedule]) => (
                              <div key={week} className="p-3 bg-white/5 rounded border border-white/10">
                                <div className="font-medium text-white mb-2">Week {week}</div>
                                <div className="flex flex-wrap gap-2">
                                  {schedule.math.length > 0 && (
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                      Math: {schedule.math.length} topics
                                    </Badge>
                                  )}
                                  {schedule.reading.length > 0 && (
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                                      Reading: {schedule.reading.length} topics
                                    </Badge>
                                  )}
                                  {schedule.writing.length > 0 && (
                                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                      Writing: {schedule.writing.length} topics
                                    </Badge>
                                  )}
                                  {schedule.practiceTest && (
                                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                                      Practice Test
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-purple-400 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Personalized Study Plan</h3>
                    <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
                      Generate a personalized SAT study plan based on your diagnostic results, 
                      target test date, and available study time.
                    </p>
                    <Button 
                      onClick={generateStudyPlan}
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white px-8 py-3 text-lg"
                    >
                      Generate My Study Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <div className="space-y-8">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Play className="h-6 w-6 text-purple-400" />
                  Practice Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card 
                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  >
                    <CardContent className="p-6 text-center">
                      <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="font-bold text-white mb-2">Math Practice</h3>
                      <p className="text-blue-200 text-sm mb-4">Algebra, geometry, and data analysis</p>
                      <Button 
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        onClick={() => startPracticeSession('math')}
                      >
                        Start Practice
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  >
                    <CardContent className="p-6 text-center">
                      <BookOpen className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="font-bold text-white mb-2">Reading Practice</h3>
                      <p className="text-green-200 text-sm mb-4">Comprehension and analysis</p>
                      <Button 
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => startPracticeSession('reading')}
                      >
                        Start Practice
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  >
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                      <h3 className="font-bold text-white mb-2">Writing Practice</h3>
                      <p className="text-purple-200 text-sm mb-4">Grammar and expression</p>
                      <Button 
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() => startPracticeSession('writing')}
                      >
                        Start Practice
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                  >
                    <CardContent className="p-6 text-center">
                      <Trophy className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                      <h3 className="font-bold text-white mb-2">Full Practice Test</h3>
                      <p className="text-orange-200 text-sm mb-4">Simulate real test conditions with all sections</p>
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        onClick={() => startPracticeSession('full')}
                      >
                        Start Test
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-6 w-6 text-purple-400" />
                  Quick Diagnostic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-16 w-16 text-purple-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-2">Take a Quick Diagnostic</h3>
                  <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
                    Identify your current SAT level with a quick diagnostic test 
                    covering all sections of the SAT.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white px-8 py-3 text-lg"
                    onClick={startDiagnosticTest}
                  >
                    Start Diagnostic
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-purple-400" />
                  Official SAT Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SAT_RESOURCES.map((resource, index) => {
                    const Icon = resource.icon;
                    return (
                      <Card key={index} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:scale-105 transition-transform">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <Icon className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{resource.title}</h3>
                              <Badge 
                                variant="secondary" 
                                className={`mt-1 text-xs ${
                                  resource.type === 'official' 
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {resource.type}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-4">{resource.description}</p>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-purple-300 hover:text-purple-200 transition-colors"
                          >
                            Visit Resource <ExternalLink className="h-3 w-3" />
                          </a>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookMarked className="h-6 w-6 text-purple-400" />
                  Recommended Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 glass rounded-lg p-5 border border-white/10">
                    <h3 className="font-bold text-white mb-2">The Official SAT Study Guide</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      The official study guide from College Board with 8 real practice tests.
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                        Official
                      </Badge>
                      <a 
                        href="https://store.collegeboard.org/sto/productdetail.do?Itemkey=1000001008" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-1"
                      >
                        View on Store <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 glass rounded-lg p-5 border border-white/10">
                    <h3 className="font-bold text-white mb-2">Khan Academy SAT Prep</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      Free personalized SAT practice, progress tracking, and college readiness resources.
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        Free
                      </Badge>
                      <a 
                        href="https://satsuite.collegeboard.org/sat/practice-preparation/khan-academy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-1"
                      >
                        Visit Site <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}