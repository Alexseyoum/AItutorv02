"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  CheckCircle, 
  XCircle,
  Brain,
  ArrowLeft,
  Trophy,
  BookOpen,
  Zap,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { generateQuestions } from "@/lib/utils/questionBank";
import Image from "next/image";

// URL sanitization helper to prevent XSS
const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '#';
  } catch {
    // If URL parsing fails, return a safe default
    return '#';
  }
};

interface User {
  id: string;
  email: string;
  name?: string;
}

interface StudentProfile {
  gradeLevel: number;
  learningStyle: string;
  interests: string[];
  pastEngagement: number;
  isInterestedInSATPrep?: boolean;
  [key: string]: any;
}

interface Question {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  source: string;
}

interface UserAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

interface PracticeSession {
  id?: string;
  section: 'math' | 'reading' | 'writing' | 'full';
  questions: Question[];
  userAnswers: UserAnswer[];
  startTime: Date;
  currentTime: Date;
  timeSpent: number; // in seconds
  isCompleted: boolean;
}

// Add new interface for AI tutoring
interface AIExplanation {
  content: string;
  imageUrl?: string;
  links?: Array<{ title: string; url: string; type: string }>;
  keywords?: string[];
}

const SUBJECT_TOPICS = {
  math: [
    "Algebra: Linear Equations",
    "Algebra: Quadratic Equations",
    "Geometry: Triangles",
    "Geometry: Circles",
    "Data Analysis: Statistics",
    "Data Analysis: Probability"
  ],
  reading: [
    "Reading Comprehension: Literature",
    "Reading Comprehension: History",
    "Reading Comprehension: Science",
    "Vocabulary: Context Clues",
    "Vocabulary: Word Relationships"
  ],
  writing: [
    "Grammar: Sentence Structure",
    "Grammar: Punctuation",
    "Rhetoric: Argument Analysis",
    "Rhetoric: Text Structure",
    "Expression of Ideas: Word Choice"
  ]
};

export default function SATPracticeClient({ user: _user, profile }: { user: User; profile: StudentProfile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [_isAiLoading, setIsAiLoading] = useState(false);
  const [showAiTutor, setShowAiTutor] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    abortControllerRef.current = new AbortController();
    
    return () => {
      isComponentMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Complete session
  const completeSession = useCallback(async () => {
    const currentSession = session;
    if (!currentSession || currentSession.isCompleted) return;
    
    // Clear timer
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    // Mark session as completed
    const completedSession = {
      ...currentSession,
      isCompleted: true,
      currentTime: new Date()
    };
    
    setSession(completedSession);
    
    // Save session to database
    try {
      const response = await fetch("/api/ai/sat/practice-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: currentSession.section,
          score: calculateScore(completedSession),
          maxScore: currentSession.questions.length,
          // Save only user answers and session progress (not questions)
          answers: {
            userAnswers: currentSession.userAnswers
          },
          timeSpent: completedSession.timeSpent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save practice session");
      }
      
      const _data = await response.json();
      toast.success("Practice session completed and saved!");
    } catch (error: any) {
      console.error("Failed to save session:", error);
      toast.error("Session completed but failed to save. You can try again.");
    }
  }, [session, timer]);

  // Initialize a new practice session
  const initializeSession = useCallback(async (section: 'math' | 'reading' | 'writing' | 'full' = 'math') => {
    setIsLoading(true);
    try {
      // Determine topics based on section
      let topics: string[] = [];
      let subject = 'Math';
      
      switch (section) {
        case 'math':
          topics = SUBJECT_TOPICS.math;
          subject = 'Math';
          break;
        case 'reading':
          topics = SUBJECT_TOPICS.reading;
          subject = 'Reading';
          break;
        case 'writing':
          topics = SUBJECT_TOPICS.writing;
          subject = 'Writing';
          break;
        case 'full':
          // For full test, we'll do a mix
          topics = [...SUBJECT_TOPICS.math, ...SUBJECT_TOPICS.reading, ...SUBJECT_TOPICS.writing];
          subject = 'Mixed';
          break;
      }
      
      // Generate questions
      const questions: Question[] = [];
      const questionsPerTopic = section === 'full' ? 1 : 3;
      
      // Process topics one by one to better handle errors
      for (const topic of topics.slice(0, section === 'full' ? 10 : 3)) {
        try {
          const generatedQuestions = await generateQuestions({
            grade: profile.gradeLevel || 11,
            topic,
            subject,
            difficulty: profile.difficultyLevel?.toLowerCase() || 'medium',
            goal: 'SAT',
            questionCount: questionsPerTopic,
            signal: abortControllerRef.current?.signal
          });
          
          // Check again before updating state
          if (!isComponentMounted.current || abortControllerRef.current?.signal.aborted) {
            console.log('Question generation cancelled after receiving response');
            return;
          }
          
          questions.push(...generatedQuestions);
        } catch (topicError: any) {
          // Don't show errors if aborted
          if (abortControllerRef.current?.signal.aborted || topicError.name === 'AbortError') {
            return;
          }
          
          console.error(`Failed to generate questions for topic "${topic}":`, topicError);
          toast.error(`Failed to generate questions for topic: ${topic}. Continuing with available questions.`);
        }
      }
      
      // Check if we have any questions
      if (questions.length === 0) {
        throw new Error("Failed to generate any questions for the practice session");
      }
      
      // Create session
      const newSession: PracticeSession = {
        section,
        questions,
        userAnswers: [],
        startTime: new Date(),
        currentTime: new Date(),
        timeSpent: 0,
        isCompleted: false
      };
      
      setSession(newSession);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      
      // Set time limit (25 minutes for math, 35 for reading/writing, 60 for full)
      const timeLimit = section === 'math' ? 25 * 60 : 
                       section === 'reading' || section === 'writing' ? 35 * 60 :
                       60 * 60;
      setTimeRemaining(timeLimit);
      
      toast.success(`Started ${section} practice session with ${questions.length} questions!`);
    } catch (error: any) {
      console.error("Failed to initialize session:", error);
      toast.error(`Failed to start practice session: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Load existing practice session by ID
  const loadSessionById = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/sat/practice-sessions?id=${sessionId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load practice session");
      }
      
      const data = await response.json();
      const sessionData = data.session;
      
      console.log("Loaded session data:", sessionData);
      console.log("Answers object:", sessionData.answers);
      
      // For existing sessions, we only load the session metadata (section, timeSpent, etc.)
      // Questions will be generated by AI each time
      const loadedSessionMetadata = {
        id: sessionData.id,
        section: sessionData.section,
        timeSpent: sessionData.timeSpent || 0,
        userAnswers: sessionData.answers?.userAnswers || [],
        startTime: new Date(),
        currentTime: new Date(),
        isCompleted: false
      };
      
      // Generate questions for the session using AI
      let topics: string[] = [];
      let subject = 'Math';
      
      switch (loadedSessionMetadata.section) {
        case 'math':
          topics = SUBJECT_TOPICS.math;
          subject = 'Math';
          break;
        case 'reading':
          topics = SUBJECT_TOPICS.reading;
          subject = 'Reading';
          break;
        case 'writing':
          topics = SUBJECT_TOPICS.writing;
          subject = 'Writing';
          break;
        case 'full':
          // For full test, we'll do a mix
          topics = [...SUBJECT_TOPICS.math, ...SUBJECT_TOPICS.reading, ...SUBJECT_TOPICS.writing];
          subject = 'Mixed';
          break;
      }
      
      // Generate questions
      const questions: Question[] = [];
      const questionsPerTopic = loadedSessionMetadata.section === 'full' ? 1 : 3;
      
      // Process topics one by one to better handle errors
      for (const topic of topics.slice(0, loadedSessionMetadata.section === 'full' ? 10 : 3)) {
        try {
          const generatedQuestions = await generateQuestions({
            grade: profile.gradeLevel || 11,
            topic,
            subject,
            difficulty: profile.difficultyLevel?.toLowerCase() || 'medium',
            goal: 'SAT',
            questionCount: questionsPerTopic
          });
          
          questions.push(...generatedQuestions);
        } catch (topicError: any) {
          console.error(`Failed to generate questions for topic "${topic}":`, topicError);
          // Continue with other topics instead of failing the entire session
          toast.error(`Failed to generate questions for topic: ${topic}. Continuing with available questions.`);
        }
      }
      
      // Check if we have any questions
      if (questions.length === 0) {
        throw new Error("Failed to generate any questions for the practice session");
      }
      
      // Create the complete session with generated questions and loaded metadata
      const loadedSession: PracticeSession = {
        ...loadedSessionMetadata,
        questions,
      };
      
      console.log("Loaded session with questions:", loadedSession.questions?.length || 0);
      
      setSession(loadedSession);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      
      // Set time limit based on section
      const timeLimit = loadedSession.section === 'math' ? 25 * 60 : 
                       loadedSession.section === 'reading' || loadedSession.section === 'writing' ? 35 * 60 :
                       60 * 60;
      setTimeRemaining(timeLimit);
      
      toast.success(`Loaded ${loadedSession.section} practice session!`);
    } catch (error: any) {
      console.error("Failed to load session:", error);
      toast.error(`Failed to load practice session: ${error.message || "Unknown error"}`);
      // If loading fails, redirect to SAT prep dashboard
      router.push('/tutoring/sat-prep');
    } finally {
      setIsLoading(false);
    }
  }, [profile, router]);

  // Initialize session on component mount
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId) {
      loadSessionById(sessionId);
    }
  }, [loadSessionById, searchParams]);

  // Start timer
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && session && !session.isCompleted) {
      const newTimer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Time's up
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimer(newTimer);
      return () => {
        if (newTimer) clearInterval(newTimer);
      };
    }
  }, [timeRemaining, session, completeSession]);

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (showExplanation || !session) return;
    
    setSelectedAnswer(answer);
    
    // Auto-submit after a short delay
    setTimeout(() => {
      handleSubmitAnswer(answer);
    }, 1000);
  };

  // Submit answer
  const handleSubmitAnswer = (answer: string) => {
    if (!session || showExplanation) return;
    
    const currentQuestion = session.questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.answer;
    
    const newUserAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: answer,
      isCorrect,
      timeSpent: Math.floor((new Date().getTime() - session.currentTime.getTime()) / 1000)
    };
    
    // Update session
    const updatedSession = {
      ...session,
      userAnswers: [...session.userAnswers, newUserAnswer],
      currentTime: new Date(),
      timeSpent: session.timeSpent + newUserAnswer.timeSpent
    };
    
    setSession(updatedSession);
    setSelectedAnswer(null);
    setShowExplanation(true);
  };

  // Get AI explanation for a question
  const getAIExplanation = async () => {
    if (!session) return;
    
    setIsAiLoading(true);
    try {
      const currentQuestion = session.questions[currentQuestionIndex];
      
      // Prepare the message for AI
      const message = `I need help understanding this SAT question:
      
Question: ${currentQuestion.question}

My answer: ${selectedAnswer || 'I haven\'t answered yet'}
Correct answer: ${currentQuestion.answer}

Can you explain the concept and why the correct answer is right? Also, if my answer was wrong, explain why it's incorrect.`;
      
      // Prepare conversation history
      const history = [
        {
          role: "system",
          content: "You are an expert SAT tutor helping students understand concepts and improve their test-taking skills."
        },
        {
          role: "user",
          content: message
        }
      ];
      
      // Call AI API
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history,
          profile: {
            gradeLevel: profile.gradeLevel,
            learningStyle: profile.learningStyle?.toLowerCase().replace('_', ' '),
            interests: profile.interests,
            pastEngagement: profile.pastEngagement || 0
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI explanation");
      }
      
      const data = await response.json();
      
      // Set AI explanation
      setAiExplanation({
        content: data.data.message,
        imageUrl: data.data.imageUrl,
        links: data.data.links,
        keywords: data.data.keywords
      });
      
      setShowAiTutor(true);
    } catch (error: any) {
      console.error("Failed to get AI explanation:", error);
      toast.error("Failed to get AI explanation. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle AI tutor
  const toggleAiTutor = () => {
    if (!showAiTutor && !aiExplanation) {
      getAIExplanation();
    } else {
      setShowAiTutor(!showAiTutor);
    }
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (!session) return;
    
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setSession({
        ...session,
        currentTime: new Date()
      });
    } else {
      // Last question - complete session
      completeSession();
    }
  };

  // Calculate score
  const calculateScore = (sessionData: PracticeSession): number => {
    return sessionData.userAnswers.filter(answer => answer.isCorrect).length;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Restart session
  const restartSession = () => {
    // Abort any ongoing API calls
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for new session
    abortControllerRef.current = new AbortController();
    
    // Clear timer
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    if (session) {
      initializeSession(session.section);
    }
  };

  // Go back to main tutoring dashboard
  const goBack = () => {
    router.push('/');
  };

  // Exit practice and go to SAT prep page
  const exitPractice = () => {
    router.push('/tutoring/sat-prep');
  };

  // If no session, show section selection
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <Button 
              onClick={goBack}
              variant="ghost"
              className="text-purple-200 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-white">SAT Practice</h1>
            <div></div> {/* Spacer */}
          </div>

          {/* Section Selection */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Choose a Practice Section</h2>
            <p className="text-purple-200 mb-8">Select the SAT section you&#39;d like to practice</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => initializeSession('math')}
              >
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">Math</h3>
                  <p className="text-blue-200 text-sm mb-4">Algebra, geometry, and data analysis</p>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">
                    {isLoading ? "Starting..." : "Start Practice"}
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => initializeSession('reading')}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">Reading</h3>
                  <p className="text-green-200 text-sm mb-4">Comprehension and analysis</p>
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    {isLoading ? "Starting..." : "Start Practice"}
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
                onClick={() => initializeSession('writing')}
              >
                <CardContent className="p-6 text-center">
                  <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="font-bold text-white mb-2">Writing</h3>
                  <p className="text-yellow-200 text-sm mb-4">Grammar and expression</p>
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600">
                    {isLoading ? "Starting..." : "Start Practice"}
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card 
              className="mt-6 bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
              onClick={() => initializeSession('full')}
            >
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Full Practice Test</h3>
                <p className="text-orange-200 text-sm mb-4">Simulate real test conditions with all sections</p>
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  {isLoading ? "Starting..." : "Start Full Test"}
                </Button>
              </CardContent>
            </Card>
            
            <Card 
              className="mt-6 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push('/tutoring/sat-prep/diagnostic')}
            >
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Take Diagnostic Test</h3>
                <p className="text-purple-200 text-sm mb-4">Assess your current SAT level</p>
                <Button className="w-full bg-purple-500 hover:bg-purple-600">
                  Start Diagnostic
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If session is completed, show results
  if (session.isCompleted) {
    const score = calculateScore(session);
    const percentage = Math.round((score / session.questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <Button 
              onClick={goBack}
              variant="ghost"
              className="text-purple-200 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-white">Practice Results</h1>
            <div></div> {/* Spacer */}
          </div>

          {/* Results */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-6 w-6 text-purple-400" />
                {session.section.charAt(0).toUpperCase() + session.section.slice(1)} Practice Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-white mb-2">{score}/{session.questions.length}</div>
                <div className="text-2xl font-bold text-cyan-400 mb-4">{percentage}% Correct</div>
                <Progress value={percentage} className="h-4 mb-2" />
                <p className="text-purple-200">
                  Time spent: {Math.floor(session.timeSpent / 60)} minutes {session.timeSpent % 60} seconds
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{score}</div>
                  <div className="text-sm text-gray-400">Correct Answers</div>
                </div>
                <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-orange-400 mb-1">{session.questions.length - score}</div>
                  <div className="text-sm text-gray-400">Incorrect Answers</div>
                </div>
                <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">{Math.floor(session.timeSpent / 60)}m {session.timeSpent % 60}s</div>
                  <div className="text-sm text-gray-400">Time Spent</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={restartSession}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Practice Again
                </Button>
                <Button 
                  onClick={goBack}
                  variant="outline"
                  className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show current question
  // Add a guard clause to ensure we have questions
  if (!session.questions || session.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <div className="text-white text-xl mb-4">No questions available for this practice session</div>
            <Button 
              onClick={goBack}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const userAnswer = session.userAnswers.find(a => a.questionId === currentQuestion.id);
  
  // Add a guard clause to ensure currentQuestion exists
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <div className="text-white text-xl mb-4">Invalid question index</div>
            <Button 
              onClick={goBack}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={exitPractice}
            variant="ghost"
            className="text-purple-200 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Exit Practice
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white capitalize">{session.section} Practice</h1>
            <p className="text-purple-200 text-sm">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={toggleAiTutor}
              variant="outline"
              className="border-cyan-500 text-cyan-300 hover:bg-cyan-500/20"
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Tutor
            </Button>
            <div className="text-right">
              <div className="text-white font-bold">{formatTime(timeRemaining || 0)}</div>
              <div className="text-xs text-purple-200">Time Remaining</div>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-purple-200 mb-2">
            <span>Progress</span>
            <span>{currentQuestionIndex + 1}/{session.questions.length}</span>
          </div>
          <Progress 
            value={((currentQuestionIndex + 1) / session.questions.length) * 100} 
            className="h-2" 
          />
        </div>
        
        {/* AI Tutor Panel */}
        {showAiTutor && aiExplanation && (
          <Card className="bg-white/10 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 shadow-2xl mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-cyan-400" />
                  AI Tutor Explanation
                </span>
                <Button
                  onClick={() => setShowAiTutor(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="text-cyan-100 whitespace-pre-wrap">{aiExplanation.content}</p>
                
                {aiExplanation.imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-cyan-500/30">
                    <Image 
                      src={aiExplanation.imageUrl} 
                      alt="AI Generated Illustration" 
                      className="w-full h-auto"
                      width={500}
                      height={300}
                    />
                  </div>
                )}
                
                {aiExplanation.links && aiExplanation.links.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-cyan-300 font-medium mb-2">Related Resources:</h4>
                    <div className="space-y-2">
                      {aiExplanation.links.slice(0, 3).map((link, index) => (
                        <a
                          key={index}
                          href={sanitizeUrl(link.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                        >
                          <div className="font-medium text-cyan-200">{link.title}</div>
                          <div className="text-xs text-cyan-400 mt-1">{link.type.toUpperCase()}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Question Card */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedAnswer === choice;
               const _isCorrect = userAnswer?.isCorrect && userAnswer.selectedAnswer === choice;
                const isIncorrect = !userAnswer?.isCorrect && userAnswer?.selectedAnswer === choice;
                const showCorrect = showExplanation && choice === currentQuestion.answer;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(choice)}
                    disabled={showExplanation || !!userAnswer}
                    className={`
                      w-full text-left p-4 rounded-xl border transition-all
                      ${showExplanation || userAnswer
                        ? showCorrect
                          ? "bg-green-500/20 border-green-500/50"
                          : isIncorrect
                            ? "bg-red-500/20 border-red-500/50"
                            : isSelected
                              ? "bg-yellow-500/20 border-yellow-500/50"
                              : "bg-white/5 border-white/10"
                        : isSelected
                          ? "bg-yellow-500/30 border-yellow-500/70"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }
                      ${showExplanation && choice === currentQuestion.answer ? "ring-2 ring-green-500/50" : ""}
                    `}
                  >
                    <div className="flex items-center">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0
                        ${showExplanation || userAnswer
                          ? showCorrect
                            ? "bg-green-500"
                            : isIncorrect
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          : isSelected
                            ? "bg-yellow-500"
                            : "bg-white/20"
                        }
                      `}>
                        {showExplanation || userAnswer ? (
                          showCorrect || (isIncorrect && choice === currentQuestion.answer) ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : isIncorrect ? (
                            <XCircle className="h-4 w-4 text-white" />
                          ) : null
                        ) : isSelected ? (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        ) : null}
                      </div>
                      <span className="text-white">{choice}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  Explanation
                </h3>
                <p className="text-purple-200">{currentQuestion.explanation}</p>
              </div>
            )}
            
            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
              >
                Previous
              </Button>
              
              {showExplanation ? (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  {currentQuestionIndex < session.questions.length - 1 ? "Next Question" : "Finish Practice"}
                </Button>
              ) : (
                <Button
                  onClick={() => selectedAnswer && handleSubmitAnswer(selectedAnswer)}
                  disabled={!selectedAnswer}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  Submit Answer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}