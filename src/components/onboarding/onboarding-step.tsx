"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Getting to know you</span>
          <span>{stage + 1}/5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
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
            className="w-full"
          />
        </div>

        <Button 
          type="submit" 
          disabled={!answer.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? "Processing..." : isComplete ? "Complete Setup" : "Next"}
        </Button>
      </form>

      {/* Previous answers display */}
      {answers.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Your answers so far:
          </h3>
          <ul className="space-y-1 text-sm text-gray-600">
            {answers.map((ans, idx) => (
              <li key={idx} className="truncate">
                {idx + 1}. {ans}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}