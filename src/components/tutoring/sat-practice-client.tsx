"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SATQuestion {
  id: string;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface SATSession {
  id: string;
  section: string;
  topic: string;
  questions: SATQuestion[];
  currentQuestionIndex: number;
  answers: (number | null)[];
  score: number;
  isCompleted: boolean;
  startedAt: Date;
}

interface AIExplanation {
  summary: string;
  keyPoints: string[];
  commonMistakes: string[];
  links: Array<{
    title: string;
    url: string;
    type: string;
  }>;
}

interface SATSection {
  id: string;
  name: string;
  topics: readonly string[];
  timeLimit: number;
}

const MATH_TOPICS = [
  "Algebra: Linear Equations",
  "Algebra: Quadratic Equations", 
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
  "Standard English Conventions: Usage",
  "Expression of Ideas: Organization",
  "Expression of Ideas: Precision",
  "Expression of Ideas: Conciseness"
] as const;

const SAT_SECTIONS: SATSection[] = [
  {
    id: "math",
    name: "Math",
    topics: [...MATH_TOPICS],
    timeLimit: 35 * 60
  },
  {
    id: "reading",
    name: "Reading", 
    topics: [...READING_TOPICS],
    timeLimit: 32 * 60
  },
  {
    id: "writing",
    name: "Writing",
    topics: [...WRITING_TOPICS],
    timeLimit: 32 * 60
  }
];

const TIME_LIMITS: Record<string, number> = {
  math: 35 * 60,
  reading: 32 * 60,
  writing: 32 * 60
};

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return "#";
  } catch {
    return "#";
  }
}

function calculateScore(answers: (number | null)[], questions: SATQuestion[]): number {
  const correctCount = answers.reduce((count: number, answer, index) => {
    if (answer !== null && questions[index] && answer === questions[index].correctAnswer) {
      return count + 1;
    }
    return count;
  }, 0);
  
  const percentage = (correctCount / questions.length) * 100;
  const scaledScore = 200 + (percentage / 100) * 600;
  return Math.round(scaledScore);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function SATPracticeClient() {
  const [session, setSession] = useState<SATSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCompletedRef = useRef(false);
  const completeSessionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const completeSession = useCallback(async () => {
    if (!session || session.isCompleted || sessionCompletedRef.current) {
      return;
    }

    // Clear the timer immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    sessionCompletedRef.current = true;

    const finalScore = calculateScore(session.answers, session.questions);
    
    // Calculate time spent
    const timeSpent = session.startedAt 
      ? Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000)
      : 0;

    try {
      const response = await fetch("/api/sat/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          answers: session.answers,
          score: finalScore,
          timeSpent: timeSpent
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save session");
      }

      setSession(prev => prev ? {
        ...prev,
        isCompleted: true,
        score: finalScore
      } : null);
    } catch (err) {
      console.error("Error completing session:", err);
      setError("Failed to save your progress. Your score: " + finalScore);
      
      setSession(prev => prev ? {
        ...prev,
        isCompleted: true,
        score: finalScore
      } : null);
    }
  }, [session]);

  // Store the callback in ref whenever it changes
  useEffect(() => {
    completeSessionRef.current = completeSession;
  }, [completeSession]);

  // Timer effect - intentionally only depends on session existence, not changing values
  useEffect(() => {
    // Only start timer if we have a session
    if (!session) {
      return;
    }

    // Set up the interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        // Check conditions inside the callback
        if (prev === null || prev <= 1) {
          completeSessionRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session]);

  const initializeSession = async (sectionId: string, topic: string)=>{
    setLoading(true);
    setError(null);
    sessionCompletedRef.current = false;

    try {
      const response = await fetch("/api/sat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sectionId, topic })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start session");
      }

      const data = await response.json();
      
      const newSession: SATSession = {
        id: data.sessionId,
        section: sectionId,
        topic,
        questions: data.questions,
        currentQuestionIndex: 0,
        answers: new Array(data.questions.length).fill(null),
        score: 0,
        isCompleted: false,
        startedAt: new Date()
      };

      setSession(newSession);
      setTimeRemaining(TIME_LIMITS[sectionId] || 35 * 60);
    } catch (err) {
      console.error("Session initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to start practice session. Please check your connection and try again.");
      // Reset loading state on error
      setLoading(false);
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (!session || session.isCompleted) return;

    const newAnswers = [...session.answers];
    newAnswers[session.currentQuestionIndex] = answerIndex;
    
    setSession({
      ...session,
      answers: newAnswers
    });
  };

  const fetchAIExplanation = async (question: SATQuestion) => {
    setLoadingExplanation(true);
    setAiExplanation(null);

    try {
      const response = await fetch("/api/sat/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          topic: question.topic,
          difficulty: question.difficulty
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await response.json();
      setAiExplanation(data);
    } catch (err) {
      console.error("Error fetching AI explanation:", err);
      setError("Failed to load AI explanation");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const goToNextQuestion = () => {
    if (!session) return;

    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex + 1
      });
      setAiExplanation(null);
    } else {
      completeSession();
    }
  };

  const goToPreviousQuestion = () => {
    if (!session) return;

    if (session.currentQuestionIndex > 0) {
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex - 1
      });
      setAiExplanation(null);
    }
  };

  // New function to exit the practice session
  const exitPractice = () => {
    if (!session) return;
    
    // Confirm exit if user has answered questions
    const answeredCount = session.answers.filter(a => a !== null).length;
    if (answeredCount > 0) {
      const confirmExit = window.confirm(
        `You have answered ${answeredCount} questions. Are you sure you want to exit? Your progress will be lost.`
      );
      if (!confirmExit) return;
    }
    
    // Reset session state
    setSession(null);
    setTimeRemaining(0);
    sessionCompletedRef.current = false;
    setAiExplanation(null);
  };

  // New function to navigate to a specific question
  const goToQuestion = (index: number) => {
    if (!session || index < 0 || index >= session.questions.length) return;
    
    setSession({
      ...session,
      currentQuestionIndex: index
    });
    setAiExplanation(null);
  };

  // New function to get question status for review panel
  const getQuestionStatus = (index: number) => {
    if (!session) return "unvisited";
    if (session.answers[index] === null) return "skipped";
    return "answered";
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">
              SAT Practice
            </h1>
            <p className="text-lg text-gray-300">
              Choose a section and topic to begin
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-900 border-2 border-red-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-bold text-gray-100">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {SAT_SECTIONS.map(section => (
              <Card key={`section-${section.id}`} className="bg-slate-800 border-2 border-green-500/40 shadow-lg shadow-green-500/10">
                <CardHeader>
                  <CardTitle key={`title-${section.id}`} className="flex items-center gap-2 text-xl font-semibold text-gray-100">
                    {section.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.topics.map(topic => (
                      <Button
                        key={topic}
                        onClick={() => initializeSession(section.id, topic)}
                        disabled={loading}
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white font-medium text-base py-4 rounded-lg disabled:opacity-50"
                      >
                        {topic}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => window.location.href = "/tutoring/sat-prep"}
              variant="outline"
              className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 font-semibold px-8 py-3 rounded-xl"
            >
              ← Back to SAT Prep
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (session.isCompleted) {
    const percentage = (session.answers.filter((a, i) => a === session.questions[i]?.correctAnswer).length / session.questions.length) * 100;

    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800 border-2 border-green-500/40 shadow-lg shadow-green-500/10">
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <CardTitle className="text-3xl text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                Practice Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                  {session.score}
                </div>
                <div className="text-lg font-bold text-gray-100">
                  SAT Score (200-800)
                </div>
                <div className="mt-2 text-base text-gray-300">
                  {percentage.toFixed(1)}% Correct
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-900 p-4 rounded-lg text-center border-2 border-green-500/40">
                  <div className="text-2xl font-bold text-gray-100">
                    {session.answers.filter((a, i) => a === session.questions[i]?.correctAnswer).length}
                  </div>
                  <div className="text-sm font-bold mt-1 text-gray-300">
                    Correct
                  </div>
                </div>
                <div className="bg-yellow-900 p-4 rounded-lg text-center border-2 border-yellow-500/40">
                  <div className="text-2xl font-bold text-gray-100">
                    {session.answers.filter((a, i) => a !== null && a !== session.questions[i]?.correctAnswer).length}
                  </div>
                  <div className="text-sm font-bold mt-1 text-gray-300">
                    Incorrect
                  </div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg text-center border-2 border-slate-500/40">
                  <div className="text-2xl font-bold text-gray-100">
                    {session.answers.filter(a => a === null).length}
                  </div>
                  <div className="text-sm font-bold mt-1 text-gray-300">
                    Skipped
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setSession(null);
                    setTimeRemaining(0);
                    sessionCompletedRef.current = false;
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                >
                  Start New Practice
                </Button>
                <Button
                  onClick={() => window.location.href = "/tutoring/sat-prep"}
                  variant="outline"
                  className="flex-1 border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 font-bold py-3 rounded-xl"
                >
                  Back to SAT Prep
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const currentAnswer = session.answers[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between bg-slate-800 border-2 border-green-500/40 shadow-lg shadow-green-500/10 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <span className="bg-green-700 border-2 border-green-400/40 font-bold px-3 py-1 rounded-lg text-gray-100 text-sm">
              Question {session.currentQuestionIndex + 1} of {session.questions.length}
            </span>
            <span className="bg-yellow-700 border-2 border-yellow-400/40 font-bold px-3 py-1 rounded-lg text-gray-100 text-sm">
              {currentQuestion.difficulty.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xl">⏰</span>
              <span className="text-lg font-bold text-gray-100">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Button
              onClick={exitPractice}
              variant="outline"
              className="border-2 border-red-500 text-red-400 hover:bg-red-500/10 font-bold py-1 px-3 rounded-lg text-sm"
            >
              Exit
            </Button>
          </div>
        </div>

        <Progress value={progress} className="mb-6 h-4 bg-slate-700 border border-slate-600">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
        </Progress>

        {error && (
          <div className="mb-6 bg-red-900 border-2 border-red-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <p className="text-sm font-bold text-gray-100">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800 border-2 border-green-500/40 shadow-lg shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-2xl font-bold leading-relaxed text-gray-50">
                  {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      currentAnswer === index
                        ? "bg-green-600 border-green-300 text-white font-bold"
                        : "bg-slate-700 border-slate-500 text-gray-200 hover:bg-slate-600 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        currentAnswer === index ? "border-white bg-green-500" : "border-gray-300 bg-slate-600"
                      }`}>
                        {currentAnswer === index && (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-semibold text-base leading-relaxed">
                        {choice}
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {currentAnswer !== null && (
              <Card className={`${
                currentAnswer === currentQuestion.correctAnswer
                  ? "bg-green-900 border-2 border-green-500/40"
                  : "bg-yellow-900 border-2 border-yellow-500/40"
              } shadow-lg`}>
                <CardHeader>
                  <CardTitle className="font-bold text-gray-100">
                    {currentAnswer === currentQuestion.correctAnswer ? "✅ Correct!" : "❌ Not Quite"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed font-medium text-gray-100 text-base">
                    {currentQuestion.explanation}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button
                onClick={goToPreviousQuestion}
                disabled={session.currentQuestionIndex === 0}
                variant="outline"
                className="flex-1 border-2 border-green-500 text-green-400 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-xl"
              >
                ← Previous
              </Button>
              <Button
                onClick={goToNextQuestion}
                disabled={currentAnswer === null}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-xl"
              >
                {session.currentQuestionIndex === session.questions.length - 1 ? "Finish →" : "Next →"}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Question Review Panel */}
            <Card className="bg-slate-800 border-2 border-purple-500/40 shadow-lg shadow-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-bold text-purple-400">
                  📋 Question Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {session.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${
                        index === session.currentQuestionIndex
                          ? "bg-blue-600 border-blue-300 text-white scale-105"
                          : getQuestionStatus(index) === "answered"
                          ? "bg-green-700 border-green-500 text-white"
                          : getQuestionStatus(index) === "skipped"
                          ? "bg-yellow-700 border-yellow-500 text-white"
                          : "bg-slate-700 border-slate-500 text-gray-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-xs text-gray-300">Current</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-700 rounded"></div>
                    <span className="text-xs text-gray-300">Answered</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-700 rounded"></div>
                    <span className="text-xs text-gray-300">Skipped</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-700 rounded border border-slate-500"></div>
                    <span className="text-xs text-gray-300">Unvisited</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-bold text-yellow-400">
                  💡 AI Tutor
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!aiExplanation ? (
                  <Button
                    onClick={() => fetchAIExplanation(currentQuestion)}
                    disabled={loadingExplanation}
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded-xl disabled:opacity-50 shadow-md"
                    style={{ color: 'white' }}
                  >
                    {loadingExplanation ? "Loading..." : "Get AI Explanation"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold mb-2 text-yellow-400">
                        Summary
                      </h4>
                      <p className="text-base leading-relaxed text-gray-100">
                        {aiExplanation.summary}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-2 text-yellow-400">
                        Key Points
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {aiExplanation.keyPoints.map((point, index) => (
                          <li key={index} className="text-base text-gray-200">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2 text-yellow-400">
                        Common Mistakes
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {aiExplanation.commonMistakes.map((mistake, index) => (
                          <li key={index} className="text-base text-gray-200">
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {aiExplanation.links.length > 0 && (
                      <div>
                        <h4 className="font-bold mb-2 text-yellow-400">
                          Learn More
                        </h4>
                        <div className="space-y-2">
                          {aiExplanation.links.slice(0, 3).map((link, index) => (
                            <a
                              key={index}
                              href={sanitizeUrl(link.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 bg-yellow-900 rounded-lg border-2 border-yellow-600/40 hover:bg-yellow-800 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-lg">🔗</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-base text-gray-100">
                                    {link.title}
                                  </div>
                                  <div className="text-sm mt-1 font-bold text-yellow-400">
                                    {link.type.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-2 border-green-500/40 shadow-lg shadow-green-500/10">
              <CardHeader>
                <CardTitle className="text-base font-bold text-green-400">
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-gray-300">
                      Answered
                    </span>
                    <span className="font-bold text-gray-100">
                      {session.answers.filter(a => a !== null).length} / {session.questions.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-gray-300">
                      Remaining
                    </span>
                    <span className="font-bold text-gray-100">
                      {session.questions.length - session.currentQuestionIndex - 1}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}