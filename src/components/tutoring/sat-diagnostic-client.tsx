"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle,
  Brain,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateQuestions } from "@/lib/utils/questionBank";

interface _User {
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

interface DiagnosticSession {
  questions: Question[];
  userAnswers: UserAnswer[];
  startTime: Date;
  currentTime: Date;
  timeSpent: number; // in seconds
  isCompleted: boolean;
}

const MATH_TOPICS = [
  "Algebra: Linear Equations",
  "Algebra: Systems of Equations",
  "Geometry: Triangles",
  "Geometry: Circles",
  "Data Analysis: Statistics",
  "Data Analysis: Probability"
] as const;

const READING_TOPICS = [
  "Reading Comprehension: Literature",
  "Reading Comprehension: History",
  "Reading Comprehension: Science",
  "Command of Evidence",
  "Words in Context"
] as const;

const WRITING_TOPICS = [
  "Standard English Conventions: Grammar",
  "Standard English Conventions: Punctuation",
  "Expression of Ideas: Organization",
  "Expression of Ideas: Precision"
] as const;

const _ALL_TOPICS = [...MATH_TOPICS, ...READING_TOPICS, ...WRITING_TOPICS] as const;

const DIAGNOSTIC_TOPICS = [
  "Algebra: Linear Equations",
  "Algebra: Quadratic Equations",
  "Geometry: Triangles",
  "Geometry: Circles",
  "Data Analysis: Statistics",
  "Data Analysis: Probability",
  "Reading Comprehension: Literature",
  "Reading Comprehension: History",
  "Reading Comprehension: Science",
  "Vocabulary: Context Clues",
  "Grammar: Sentence Structure",
  "Grammar: Punctuation",
  "Rhetoric: Argument Analysis"
];

export default function SATDiagnosticClient({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const completeSessionRef = useRef<(() => void) | null>(null);
  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize a new diagnostic session
  const initializeSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Generate questions for diagnostic
      const questions: Question[] = [];
      
      // Process topics one by one to better handle errors
      for (const topic of DIAGNOSTIC_TOPICS.slice(0, 8)) {
        try {
          const generatedQuestions = await generateQuestions({
            grade: profile.gradeLevel || 11,
            topic,
            subject: "Mixed",
            difficulty: profile.difficultyLevel?.toLowerCase() || 'medium',
            goal: 'SAT',
            questionCount: 1
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
        throw new Error("Failed to generate any questions for the diagnostic test");
      }
      
      // Create session
      const newSession: DiagnosticSession = {
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
      
      // Set time limit (45 minutes for diagnostic)
      setTimeRemaining(45 * 60);
      
      toast.success(`Started diagnostic test with ${questions.length} questions!`);
    } catch (error: any) {
      console.error("Failed to initialize diagnostic session:", error);
      toast.error(`Failed to start diagnostic test: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Complete session
  const completeSession = useCallback(async () => {
    if (!session || session.isCompleted) return;
    
    // Clear timer
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    // Mark session as completed
    const completedSession = {
      ...session,
      isCompleted: true,
      currentTime: new Date()
    };
    
    setSession(completedSession);
    
    // Save diagnostic results to database
    try {
      // Calculate scores by section
      let mathCorrect = 0;
      let readingCorrect = 0;
      let writingCorrect = 0;
      let mathTotal = 0;
      let readingTotal = 0;
      let writingTotal = 0;
      
      session.questions.forEach((question, index) => {
        const userAnswer = session.userAnswers[index];
        if (question.subject.toLowerCase().includes('math')) {
          mathTotal += 1;
          if (userAnswer && userAnswer.isCorrect) {
            mathCorrect += 1;
          }
        } else if (question.subject.toLowerCase().includes('reading')) {
          readingTotal += 1;
          if (userAnswer && userAnswer.isCorrect) {
            readingCorrect += 1;
          }
        } else if (question.subject.toLowerCase().includes('writing') || question.subject.toLowerCase().includes('grammar')) {
          writingTotal += 1;
          if (userAnswer && userAnswer.isCorrect) {
            writingCorrect += 1;
          }
        }
      });
      
      // Scale scores to SAT scale (200-800 per section)
      const scaleScore = (correct: number, total: number) => {
        if (total === 0) return 0;
        // Scale to 200-800 range
        return Math.round(200 + (correct / total) * 600);
      };
      
      const mathScaled = mathTotal > 0 ? scaleScore(mathCorrect, mathTotal) : 0;
      const readingScaled = readingTotal > 0 ? scaleScore(readingCorrect, readingTotal) : 0;
      const writingScaled = writingTotal > 0 ? scaleScore(writingCorrect, writingTotal) : 0;
      const totalScore = mathScaled + readingScaled + writingScaled;
      
      // Log the scores for debugging
      console.log("Diagnostic scores calculated:", {
        mathScaled,
        readingScaled,
        writingScaled,
        totalScore,
        mathCorrect,
        mathTotal,
        readingCorrect,
        readingTotal,
        writingCorrect,
        writingTotal
      });
      
      // Identify strengths and weaknesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      if (mathTotal > 0) {
        if (mathScaled > 500) strengths.push("Math");
        else weaknesses.push("Math");
      }
      
      if (readingTotal > 0) {
        if (readingScaled > 500) strengths.push("Reading");
        else weaknesses.push("Reading");
      }
      
      if (writingTotal > 0) {
        if (writingScaled > 500) strengths.push("Writing");
        else weaknesses.push("Writing");
      }
      
      const response = await fetch("/api/ai/sat/diagnostic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mathScore: mathScaled,
          readingScore: readingScaled,
          writingScore: writingScaled,
          totalScore,
          strengths,
          weaknesses
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save diagnostic results");
      }
      
      const data = await response.json();
      console.log("Diagnostic results saved:", data);
      // Update the diagnostic result in the parent component
      window.dispatchEvent(new CustomEvent('diagnosticCompleted', { detail: data.diagnostic }));
      toast.success("Diagnostic test completed and results saved!");
    } catch (error: any) {
      console.error("Failed to save diagnostic results:", error);
      toast.error("Diagnostic completed but failed to save results. You can try again.");
    }
  }, [session, timer]);

  useEffect(() => {
    completeSessionRef.current = completeSession;
  }, [completeSession]);

  // Start timer
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && session && !session.isCompleted) {
      const newTimer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (completeSessionRef.current) {
              completeSessionRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimer(newTimer);
      return () => {
        clearInterval(newTimer);
      };
    }
  }, [timeRemaining, session]);

  // Cleanup answer timeout on unmount
  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
      }
    };
  }, []);

  // Handle answer selection
  const handleAnswerSelect = useCallback((answer: string) => {
    if (showExplanation || !session) return;
    
    setSelectedAnswer(answer);
    
    // Clear any existing timeout
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
    }
    
    // Auto-submit after a short delay
    answerTimeoutRef.current = setTimeout(() => {
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
    }, 1000);
  }, [showExplanation, session, currentQuestionIndex]);

  // Move to next question
  const handleNextQuestion = useCallback(() => {
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
  }, [session, currentQuestionIndex, completeSession]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Go back to SAT prep dashboard
  const goBack = () => {
    router.push('/tutoring/sat-prep');
  };

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // If no session or still loading, show loading state
  if (!session || isLoading) {
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
              Back to SAT Prep
            </Button>
            <h1 className="text-3xl font-bold text-white">SAT Diagnostic Test</h1>
            <div></div> {/* Spacer */}
          </div>

          <div className="text-center py-12">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-purple-400/30 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-t-purple-400 rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="text-purple-200 mt-4 text-lg">Preparing your diagnostic test...</p>
          </div>
        </div>
      </div>
    );
  }

  // If session is completed, show results
  if (session.isCompleted) {
    // Calculate scores
    let mathScore = 0;
    let readingScore = 0;
    let writingScore = 0;
    let mathCount = 0;
    let readingCount = 0;
    let writingCount = 0;
    
    session.questions.forEach((question, index) => {
      const userAnswer = session.userAnswers[index];
      if (userAnswer && userAnswer.isCorrect) {
        if (question.subject.toLowerCase().includes('math')) {
          mathScore += 1;
          mathCount += 1;
        } else if (question.subject.toLowerCase().includes('reading')) {
          readingScore += 1;
          readingCount += 1;
        } else if (question.subject.toLowerCase().includes('writing') || question.subject.toLowerCase().includes('grammar')) {
          writingScore += 1;
          writingCount += 1;
        }
      }
    });
    
    // Scale scores to SAT scale (200-800 per section)
    const scaleScore = (correct: number, total: number) => {
      if (total === 0) return 0;
      // Scale to 200-800 range
      return Math.round(200 + (correct / total) * 600);
    };
    
    const mathScaled = mathCount > 0 ? scaleScore(mathScore, mathCount) : 0;
    const readingScaled = readingCount > 0 ? scaleScore(readingScore, readingCount) : 0;
    const writingScaled = writingCount > 0 ? scaleScore(writingScore, writingCount) : 0;
    const totalScore = mathScaled + readingScaled + writingScaled;
    
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
              Back to SAT Prep
            </Button>
            <h1 className="text-3xl font-bold text-white">Diagnostic Results</h1>
            <div></div> {/* Spacer */}
          </div>

          {/* Results */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-6 w-6 text-purple-400" />
                SAT Diagnostic Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-white mb-2">{totalScore}</div>
                <div className="text-2xl font-bold text-cyan-400 mb-4">Total Score</div>
                <p className="text-purple-200">
                  Time spent: {Math.floor(session.timeSpent / 60)} minutes {session.timeSpent % 60} seconds
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{mathScaled || 'N/A'}</div>
                  <div className="text-sm text-gray-400">Math Score</div>
                </div>
                <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-green-400 mb-1">{readingScaled || 'N/A'}</div>
                  <div className="text-sm text-gray-400">Reading Score</div>
                </div>
                <div className="bg-white/5 glass rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-purple-400 mb-1">{writingScaled || 'N/A'}</div>
                  <div className="text-sm text-gray-400">Writing Score</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={goBack}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show current question
  const currentQuestion = session.questions[currentQuestionIndex];
  const userAnswer = session.userAnswers.find(a => a.questionId === currentQuestion.id);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={goBack}
            variant="ghost"
            className="text-purple-200 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Exit Test
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">SAT Diagnostic Test</h1>
            <p className="text-purple-200 text-sm">
              Question {currentQuestionIndex + 1} of {session.questions.length}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
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
                              ? "bg-purple-500/20 border-purple-500/50"
                              : "bg-white/5 border-white/10"
                        : isSelected
                          ? "bg-purple-500/30 border-purple-500/70"
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
                              : "bg-purple-500"
                          : isSelected
                            ? "bg-purple-500"
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
                  {currentQuestionIndex < session.questions.length - 1 ? "Next Question" : "Finish Test"}
                </Button>
              ) : (
                <div className="text-purple-200 text-sm">
                  {selectedAnswer ? "Processing answer..." : "Select an answer to continue"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}