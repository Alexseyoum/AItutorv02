"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface OnboardingStepProps {
  question: string;
  stage: number;
  isComplete: boolean;
  onAnswer: (answer: string) => void;
  onComplete: (answers: string[]) => void;
  isLoading?: boolean;
}

export default function OnboardingStep({
  question,
  stage,
  isComplete,
  onAnswer,
  onComplete,
  isLoading = false
}: OnboardingStepProps) {
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (isComplete) {
      onComplete(newAnswers);
    } else {
      onAnswer(answer);
      setAnswer("");
    }
  };

  const progressPercentage = Math.min(((stage + 1) / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-6 right-6 z-50">
        <ModeToggle className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 shadow-lg" />
      </div>

      <div className="max-w-md mx-auto p-6 bg-white/90 dark:bg-gray-800/90 glass-strong rounded-lg shadow-lg border border-white/30 dark:border-gray-700/30">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Getting to know you</span>
            <span>{stage + 1}/5</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {question}
          </h2>
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="answer" className="sr-only">
              Your answer
            </Label>
            <Input
              id="answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={isLoading}
              className="w-full h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <Button 
            type="submit" 
            disabled={!answer.trim() || isLoading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? "Processing..." : isComplete ? "Complete Setup" : "Next"}
          </Button>
        </form>

        {/* Previous answers display */}
        {answers.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your answers so far:
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {answers.map((ans, idx) => (
                <li key={idx} className="truncate">
                  {idx + 1}. {ans}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
