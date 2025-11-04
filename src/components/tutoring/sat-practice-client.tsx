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

// Add state for dynamic topics

// Try to fetch dynamic topics
try {
  // This would be better done in a useEffect in the component
  // For now, we'll keep the hardcoded ones as fallback
} catch (error) {
  console.warn("Failed to fetch dynamic topics, using hardcoded ones:", error);
}

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

interface SATPracticeClientProps {
  isFullTest?: boolean;
}

export default function SATPracticeClient({ isFullTest = false }: SATPracticeClientProps) {
  const [session, setSession] = useState<SATSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  // Add state for dynamic sections
  const [satSections, setSatSections] = useState<SATSection[]>([
    {
      id: "math",
      name: "Math",
      topics: [
        "Algebra: Linear Equations",
        "Algebra: Quadratic Equations",
        "Algebra: Systems of Equations",
        "Geometry: Triangles",
        "Geometry: Circles",
        "Data Analysis: Statistics",
        "Data Analysis: Probability"
      ],
      timeLimit: 35 * 60
    },
    {
      id: "reading",
      name: "Reading", 
      topics: [
        "Reading Comprehension: Literature",
        "Reading Comprehension: History",
        "Reading Comprehension: Science"
      ],
      timeLimit: 32 * 60
    },
    {
      id: "writing",
      name: "Writing",
      topics: [
        "Grammar: Sentence Structure",
        "Grammar: Punctuation"
      ],
      timeLimit: 32 * 60
    }
  ]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCompletedRef = useRef(false);
  const completeSessionRef = useRef<(() => void) | null>(null);

  // Fetch dynamic topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch("/api/sat/topics");
        if (response.ok) {
          const data = await response.json();
          if (data.topicsBySubject) {
            // Update sections with actual database topics
            const updatedSections: SATSection[] = [
              {
                id: "math",
                name: "Math",
                topics: data.topicsBySubject.Math || [
                  "Algebra: Linear Equations",
                  "Algebra: Quadratic Equations",
                  "Geometry: Triangles"
                ],
                timeLimit: 35 * 60
              },
              {
                id: "reading",
                name: "Reading", 
                topics: data.topicsBySubject.Reading || [
                  "Reading Comprehension: Literature",
                  "Reading Comprehension: History"
                ],
                timeLimit: 32 * 60
              },
              {
                id: "writing",
                name: "Writing",
                topics: data.topicsBySubject.Writing || [
                  "Grammar: Sentence Structure",
                  "Grammar: Punctuation"
                ],
                timeLimit: 32 * 60
              }
            ];
            setSatSections(updatedSections);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch dynamic topics, using defaults:", error);
      }
    };
    
    fetchTopics();
  }, []);

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

  const initializeSession = useCallback(async (sectionId: string, topic: string) => {
    setLoading(true);
    setError(null);
    sessionCompletedRef.current = false;

    try {
      console.log("Initializing practice session:", { sectionId, topic });
      
      // Handle full practice test
      if (sectionId === 'full') {
        // For full practice test, we need to get questions from all sections
        const allQuestions: any[] = [];
        const sections = ['math', 'reading', 'writing'];
        const topics = {
          math: 'Algebra: Linear Equations',
          reading: 'Reading Comprehension',
          writing: 'Grammar: Sentence Structure'
        };
        
        // Get questions from each section
        for (const section of sections) {
          try {
            const response = await fetch("/api/sat/start", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                section: section, 
                topic: topics[section as keyof typeof topics] 
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.questions && Array.isArray(data.questions)) {
                // Add section identifier to each question
                const questionsWithSection = data.questions.map((q: any) => ({
                  ...q,
                  section: section
                }));
                allQuestions.push(...questionsWithSection);
              }
            }
          } catch (sectionError) {
            console.error(`Error getting questions for ${section}:`, sectionError);
          }
        }
        
        // If we don't have enough questions, create mock ones
        if (allQuestions.length < 10) {
          console.warn("Not enough questions for full test, creating mock questions");
          const mockQuestions: any[] = [];
          const totalQuestions = Math.max(15, allQuestions.length); // At least 15 questions
          
          for (let i = allQuestions.length; i < totalQuestions; i++) {
            const section = sections[i % sections.length];
            mockQuestions.push({
              id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
              question: `What is 2 + 2? (Mock full test question #${i + 1})`,
              choices: JSON.stringify(["3", "4", "5", "6"]),
              answer: "4",
              explanation: "This is a mock question for the full practice test.",
              subject: section.charAt(0).toUpperCase() + section.slice(1),
              topic: topics[section as keyof typeof topics],
              difficulty: "INTERMEDIATE",
              section: section
            });
          }
          allQuestions.push(...mockQuestions);
        }
        
        // Transform questions to match expected format
        const formattedQuestions = allQuestions
          .filter((q: any) => q && q.id) // Filter out any undefined or invalid questions
          .map((q: any, _i: number) => {
          // Ensure choices is an array
          let choicesArray: string[] = [];
          if (typeof q.choices === 'string') {
            try {
              choicesArray = JSON.parse(q.choices);
            } catch (e) {
              console.error("Error parsing choices:", e);
              choicesArray = [];
            }
          } else if (Array.isArray(q.choices)) {
            choicesArray = q.choices;
          }
          
          // Normalize answer to handle edge cases - convert string answer to index
          let correctAnswerIndex = -1;
          const normalizedAnswer = q.answer?.toString()?.trim().toLowerCase() || '';
          
          // Try exact match first
          correctAnswerIndex = choicesArray.findIndex((choice: string) => 
            choice.trim().toLowerCase() === normalizedAnswer
          );
          
          // If not found, try to extract just the answer part (in case AI returns "C) 7" format)
          if (correctAnswerIndex === -1) {
            // Remove option letters like "A)", "B)", etc.
            const cleanedAnswer = normalizedAnswer.replace(/^[a-d]\)\s*/i, '');
            correctAnswerIndex = choicesArray.findIndex((choice: string) => 
              choice.trim().toLowerCase() === cleanedAnswer ||
              choice.trim().toLowerCase().includes(cleanedAnswer)
            );
          }
          
          // Additional fallback: If answer is already a number, use it directly
          if (correctAnswerIndex === -1 && !isNaN(Number(q.answer)) && Number(q.answer) >= 0 && Number(q.answer) < choicesArray.length) {
            correctAnswerIndex = Number(q.answer);
          }
          
          // If still not found, default to 0 and log error
          if (correctAnswerIndex === -1) {
            console.error(`Could not match answer "${q.answer}" to choices:`, choicesArray);
            correctAnswerIndex = 0;
          }
          
          // Map difficulty to expected values
          let difficulty: "easy" | "medium" | "hard" = "medium";
          if (q.difficulty) {
            const lowerDiff = q.difficulty.toLowerCase();
            if (lowerDiff.includes("easy") || lowerDiff === "beginner") {
              difficulty = "easy";
            } else if (lowerDiff.includes("hard") || lowerDiff.includes("advanced")) {
              difficulty = "hard";
            } else {
              difficulty = "medium";
            }
          }
          
          return {
            id: q.id,
            question: q.question || "",
            choices: choicesArray,
            correctAnswer: correctAnswerIndex,
            explanation: q.explanation || "",
            topic: q.topic || topic,
            difficulty: difficulty,
            section: q.section || sectionId
          };
        })
        .filter((q: any) => q.id && q.question && Array.isArray(q.choices) && q.choices.length > 0); // Filter out malformed questions

        console.log("Formatted questions for full test:", formattedQuestions.length);

        // Check if we have any valid questions
        if (formattedQuestions.length === 0) {
          throw new Error("No valid questions available for full practice test");
        }

        const newSession: SATSession = {
          id: `full-test-${Date.now()}`,
          section: 'full',
          topic: 'Full SAT Practice Test',
          questions: formattedQuestions,
          currentQuestionIndex: 0,
          answers: new Array(formattedQuestions.length).fill(null),
          score: 0,
          isCompleted: false,
          startedAt: new Date()
        };

        setSession(newSession);
        setTimeRemaining(3 * 60 * 60); // 3 hours for full test
        setLoading(false);
        return;
      }
      
      const response = await fetch("/api/sat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: sectionId, topic })
      });

      // Handle response regardless of status
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        data = null;
      }

      // Check if we have valid questions, if not create mock questions
      if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        console.warn(`No valid questions received for ${sectionId}, creating mock questions`);
        const mockQuestions: SATQuestion[] = [];
        for (let i = 0; i < 10; i++) {
          mockQuestions.push({
            id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
            question: `What is 2 + 2? (Mock ${sectionId} practice question #${i + 1})`,
            choices: ["3", "4", "5", "6"],
            correctAnswer: 1, // Index of "4"
            explanation: "This is a mock question because we couldn't find real questions in the database.",
            topic: topic,
            difficulty: "medium"
          });
        }
        
        const newSession: SATSession = {
          id: `mock-session-${Date.now()}`,
          section: sectionId,
          topic,
          questions: mockQuestions,
          currentQuestionIndex: 0,
          answers: new Array(mockQuestions.length).fill(null),
          score: 0,
          isCompleted: false,
          startedAt: new Date()
        };

        setSession(newSession);
        setTimeRemaining(TIME_LIMITS[sectionId] || 35 * 60);
        setLoading(false);
        return;
      }

      // Apply the same robust filtering and validation as used in full practice test
      const validQuestionsList = data.questions
        .filter((q: any) => q && q.id && typeof q.id === 'string' && q.id.length > 0)
        .map((q: any) => {
          // Ensure choices is properly formatted
          let choicesArray: string[] = [];
          if (typeof q.choices === 'string') {
            try {
              choicesArray = JSON.parse(q.choices);
            } catch (e) {
              console.error("Error parsing choices:", e);
              choicesArray = [];
            }
          } else if (Array.isArray(q.choices)) {
            choicesArray = q.choices;
          }
          
          // Skip questions with no choices
          if (!Array.isArray(choicesArray) || choicesArray.length === 0) {
            console.warn("Skipping question with no valid choices:", q.id);
            return null;
          }
          
          // Ensure we have a valid correctAnswer (should be a number now)
          let correctAnswer = 0;
          if (typeof q.correctAnswer === 'number' && q.correctAnswer >= 0) {
            correctAnswer = q.correctAnswer;
          } else if (typeof q.answer === 'number' && q.answer >= 0) {
            // Fallback to 'answer' field if 'correctAnswer' is not available
            correctAnswer = q.answer;
          } else if (typeof q.answer === 'string') {
            // If answer is a string, find its index in choices
            const normalizedAnswer = q.answer?.toString()?.trim().toLowerCase() || '';
            correctAnswer = choicesArray.findIndex((choice: string) => 
              choice.trim().toLowerCase() === normalizedAnswer
            );
            
            // If not found, try to extract just the answer part (in case AI returns "C) 7" format)
            if (correctAnswer === -1) {
              // Remove option letters like "A)", "B)", etc.
              const cleanedAnswer = normalizedAnswer.replace(/^[a-d]\)\s*/i, '');
              correctAnswer = choicesArray.findIndex((choice: string) => 
                choice.trim().toLowerCase() === cleanedAnswer ||
                choice.trim().toLowerCase().includes(cleanedAnswer)
              );
            }
            
            // If still not found, default to 0 and log error
            if (correctAnswer === -1) {
              console.error(`Could not match answer "${q.answer}" to choices:`, choicesArray);
              correctAnswer = 0;
            }
          }
          
          return {
            id: q.id || '',
            question: q.question || '',
            choices: choicesArray,
            correctAnswer: correctAnswer,
            explanation: q.explanation || '',
            topic: q.topic || topic,
            difficulty: q.difficulty || 'medium'
          };
        })
        .filter((q: any) => 
          q && 
          typeof q === 'object' && 
          q.id && 
          typeof q.id === 'string' && 
          q.id.length > 0 &&
          q.question && 
          typeof q.question === 'string' && 
          q.question.length > 0 &&
          q.choices && 
          Array.isArray(q.choices) && 
          q.choices.length > 0
        ); // Filter out malformed questions
      
      // Additional safety check - ensure we have a valid array
      const safeQuestionsList = Array.isArray(validQuestionsList) ? validQuestionsList.filter(q => q !== null) : [];
      
      if (safeQuestionsList.length === 0) {
        // Ultimate fallback - create mock questions
        console.warn("No valid questions available, creating mock questions as ultimate fallback");
        const mockQuestions: SATQuestion[] = [];
        for (let i = 0; i < 10; i++) { // Use 10 questions like full test
          mockQuestions.push({
            id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
            question: `What is 2 + 2? (Mock ${sectionId} practice question #${i + 1})`,
            choices: ["3", "4", "5", "6"],
            correctAnswer: 1, // Index of "4"
            explanation: "This is a mock question because we couldn't find real questions in the database.",
            topic: topic,
            difficulty: "medium"
          });
        }
        
        const newSession: SATSession = {
          id: `mock-session-${Date.now()}`,
          section: sectionId,
          topic,
          questions: mockQuestions,
          currentQuestionIndex: 0,
          answers: new Array(mockQuestions.length).fill(null),
          score: 0,
          isCompleted: false,
          startedAt: new Date()
        };

        setSession(newSession);
        setTimeRemaining(TIME_LIMITS[sectionId] || 35 * 60);
        setLoading(false);
        return;
      }
      
      const newSession: SATSession = {
        id: data.sessionId || 'temp-session-id',
        section: sectionId,
        topic,
        questions: safeQuestionsList, // Use the safe filtered list
        currentQuestionIndex: 0,
        answers: new Array(safeQuestionsList.length).fill(null),
        score: 0,
        isCompleted: false,
        startedAt: new Date()
      };

      setSession(newSession);
      setTimeRemaining(TIME_LIMITS[sectionId] || 35 * 60);
    } catch (err: any) {
      console.error("Session initialization error:", err);
      // Always fallback to mock questions on any error
      console.warn("Error initializing session, creating mock questions as fallback");
      const mockQuestions: SATQuestion[] = [];
      for (let i = 0; i < 10; i++) {
        mockQuestions.push({
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
          question: `What is 2 + 2? (Mock ${sectionId} practice question #${i + 1})`,
          choices: ["3", "4", "5", "6"],
          correctAnswer: 1, // Index of "4"
          explanation: "This is a mock question because we encountered an error loading real questions.",
          topic: topic,
          difficulty: "medium"
        });
      }
      
      const newSession: SATSession = {
        id: `mock-session-${Date.now()}`,
        section: sectionId,
        topic,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: new Array(mockQuestions.length).fill(null),
        score: 0,
        isCompleted: false,
        startedAt: new Date()
      };

      setSession(newSession);
      setTimeRemaining(TIME_LIMITS[sectionId] || 35 * 60);
      setLoading(false);
      return;
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
    }
  }, []); // Empty dependency array since we don't want this to change

  // Add missing functions for full practice test
  const handleAnswer = (answerIndex: number) => {
    if (!session || session.isCompleted) return;

    const newAnswers = [...session.answers];
    newAnswers[session.currentQuestionIndex] = answerIndex;
    
    setSession({
      ...session,
      answers: newAnswers
    });
  };

  const goToNextQuestion = () => {
    if (!session) return;
    
    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex + 1
      });
    } else {
      completeSession();
    }
  };

  const goToPreviousQuestion = () => {
    if (!session || session.currentQuestionIndex === 0) return;
    
    setSession({
      ...session,
      currentQuestionIndex: session.currentQuestionIndex - 1
    });
  };

  const goToQuestion = (index: number) => {
    if (!session || index < 0 || index >= session.questions.length) return;
    
    setSession({
      ...session,
      currentQuestionIndex: index
    });
  };

  const getQuestionStatus = (index: number) => {
    if (!session) return "unvisited";
    if (!session.questions || !Array.isArray(session.questions) || 
        session.questions.length === 0 ||
        index < 0 || index >= session.questions.length || 
        index >= session.answers.length) return "unvisited";
    
    const question = session.questions[index];
    if (!question || !question.id || typeof question.id !== 'string') return "unvisited";
    
    if (session.answers[index] === null) return "skipped";
    return "answered";
  };

  const exitPractice = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSession(null);
    setError(null);
    setTimeRemaining(0);
    // Navigate back to SAT prep page
    window.location.href = "/tutoring/sat-prep";
  };

  // Add the missing fetchAIExplanation function
  const fetchAIExplanation = async (question: SATQuestion) => {
    setLoadingExplanation(true);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          choices: question.choices,
          correctAnswer: question.choices[question.correctAnswer],
          explanation: question.explanation
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiExplanation(data);
      }
    } catch (err) {
      console.error('Error fetching AI explanation:', err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Initialize session automatically for full test
  useEffect(() => {
    if (isFullTest && !session && !loading) {
      initializeSession('full', 'Full SAT Practice Test');
    }
  }, [isFullTest, session, loading, initializeSession]);

  if (!session) {
    // Show loading state for full test while initializing
    if (isFullTest) {
      return (
        <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading Full SAT Practice Test...</p>
          </div>
        </div>
      );
    }
    
    // Show section selection for regular practice
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
            {satSections.map(section => (
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

  // Keep existing full practice and completed logic
  if (session && session.isCompleted) {
    // Add safety check for questions array
    const validQuestions = Array.isArray(session.questions) ? session.questions : [];
    const validAnswers = Array.isArray(session.answers) ? session.answers : [];
    const questionCount = validQuestions.length;
    
    const correctCount = validQuestions.reduce((count, question, index) => {
      // Add safety checks for both question and answer
      if (!question || !question.correctAnswer || validAnswers[index] === undefined || validAnswers[index] === null) {
        return count;
      }
      return validAnswers[index] === question.correctAnswer ? count + 1 : count;
    }, 0);
    
    const percentage = questionCount > 0 ? (correctCount / questionCount) * 100 : 0;

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
                    {correctCount}
                  </div>
                  <div className="text-sm font-bold mt-1 text-gray-300">
                    Correct
                  </div>
                </div>
                <div className="bg-yellow-900 p-4 rounded-lg text-center border-2 border-yellow-500/40">
                  <div className="text-2xl font-bold text-gray-100">
                    {validQuestions.reduce((count, question, index) => {
                      if (!question || !question.correctAnswer || validAnswers[index] === undefined || validAnswers[index] === null) {
                        return count;
                      }
                      return validAnswers[index] !== question.correctAnswer ? count + 1 : count;
                    }, 0)}
                  </div>
                  <div className="text-sm font-bold mt-1 text-gray-300">
                    Incorrect
                  </div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg text-center border-2 border-slate-500/40">
                  <div className="text-2xl font-bold text-gray-100">
                    {validAnswers.filter(a => a === null).length}
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

  if (session && session.section === 'full') {
    // Safety check - ensure session.questions is valid and has elements
    if (!session.questions || session.questions.length === 0 || session.currentQuestionIndex < 0 || session.currentQuestionIndex >= session.questions.length) {
      return (
        <div className="min-h-screen bg-slate-900 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-800 border-2 border-red-500/40 shadow-lg shadow-red-500/10">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-red-400">
                  Error Loading Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200 mb-4">
                  There was an error loading the current question. This may be due to a network issue or missing question data.
                </p>
                <Button
                  onClick={() => {
                    setSession(null);
                    setError(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const currentAnswer = session.answers[session.currentQuestionIndex];
    const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;

    // Safety check for undefined questions
    if (!currentQuestion || !currentQuestion.id) {
      return (
        <div className="min-h-screen bg-slate-900 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-800 border-2 border-red-500/40 shadow-lg shadow-red-500/10">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-red-400">
                  Error Loading Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200 mb-4">
                  There was an error loading the current question. This may be due to a network issue or missing question data.
                </p>
                <Button
                  onClick={() => {
                    setSession(null);
                    setError(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

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
                    {currentQuestion.question || "No question text available"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.isArray(currentQuestion.choices) ? currentQuestion.choices.map((choice, index) => (
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
                          {choice || `Choice ${index + 1}`}
                        </span>
                      </div>
                    </button>
                  )) : (
                    <div className="text-gray-200">No choices available for this question</div>
                  )}
                </CardContent>
              </Card>

              {currentAnswer !== null && currentQuestion && currentQuestion.explanation && (
                <Card className={`${
                  currentAnswer === currentQuestion.correctAnswer
                    ? "bg-green-900 border-2 border-green-500/40"
                    : "bg-yellow-900 border-2 border-yellow-500/40"
                } shadow-lg`}>
                  <CardHeader>
                    <CardTitle className="font-bold text-gray-100">
                      {currentAnswer === currentQuestion.correctAnswer ? "Correct!" : "Not Quite"}
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
                    {session.questions && session.questions.length > 0 ? (
                      <>
                        {session.questions.map((question, index) => {
                          // Safety check for question object
                          if (!question || !question.id || typeof question.id !== 'string') {
                            return (
                              <button
                                key={index}
                                className="aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm bg-slate-700 border-slate-500 text-gray-300"
                                disabled={true}
                              >
                                ?
                              </button>
                            );
                          }
                          
                          const status = getQuestionStatus(index);
                          let buttonClass = "aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ";
                          
                          if (index === session.currentQuestionIndex) {
                            buttonClass += "bg-blue-600 border-blue-300 text-white scale-105";
                          } else if (status === "answered") {
                            buttonClass += "bg-green-700 border-green-500 text-white";
                          } else if (status === "skipped") {
                            buttonClass += "bg-yellow-700 border-yellow-500 text-white";
                          } else {
                            buttonClass += "bg-slate-700 border-slate-500 text-gray-300";
                          }
                          
                          return (
                            <button
                              key={index}
                              onClick={() => goToQuestion(index)}
                              className={buttonClass}
                              disabled={!question || !question.id || typeof question !== 'object' || typeof question.id !== 'string'}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {[...Array(10)].map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToQuestion(index)}
                            className={`aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${
                              index === session.currentQuestionIndex
                                ? "bg-blue-600 border-blue-300 text-white scale-105"
                                : "bg-slate-700 border-slate-500 text-gray-300"
                            }`}
                            disabled={true}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </>
                    )}
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

                      {aiExplanation.links && aiExplanation.links.length > 0 && (
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

}
