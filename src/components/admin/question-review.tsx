// File: src/components/admin/question-review.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  status: string;
  usageCount: number;
  avgCorrectRate?: number;
  createdAt: Date;
}

export default function QuestionReview() {
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState<Partial<Question> | null>(null);

  // Fetch pending questions for review
  const fetchPendingQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/questions?status=pending_review");
      const data = await response.json();
      
      if (data.success) {
        setPendingQuestions(data.questions);
        if (data.questions.length > 0) {
          setEditedQuestion({ ...data.questions[0] });
        }
      } else {
        toast.error(data.message || "Failed to fetch questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions");
    } finally {
      setIsLoading(false);
    }
  };

  // Update question status
  const updateQuestionStatus = async (questionId: string, status: string) => {
    try {
      const response = await fetch("/api/questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: questionId, status })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Question ${status === "APPROVED" ? "approved" : "rejected"}`);
        // Remove the question from the list
        const updatedQuestions = pendingQuestions.filter(q => q.id !== questionId);
        setPendingQuestions(updatedQuestions);
        
        // Move to next question
        if (updatedQuestions.length > 0) {
          setCurrentQuestionIndex(Math.min(currentQuestionIndex, updatedQuestions.length - 1));
          setEditedQuestion({ ...updatedQuestions[Math.min(currentQuestionIndex, updatedQuestions.length - 1)] });
        } else {
          setEditedQuestion(null);
        }
      } else {
        toast.error(data.message || "Failed to update question");
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question");
    }
  };

  // Save edits to question
  const saveEdits = async () => {
    if (!editedQuestion || !editedQuestion.id) return;
    
    try {
      const response = await fetch("/api/questions/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedQuestion)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Question updated successfully");
        // Update the question in the list
        const updatedQuestions = [...pendingQuestions];
        const index = updatedQuestions.findIndex(q => q.id === editedQuestion.id);
        if (index !== -1) {
          updatedQuestions[index] = { ...updatedQuestions[index], ...editedQuestion } as Question;
          setPendingQuestions(updatedQuestions);
        }
      } else {
        toast.error(data.message || "Failed to update question");
      }
    } catch (error) {
      console.error("Error saving edits:", error);
      toast.error("Failed to save edits");
    }
  };

  // Move to next question
  const nextQuestion = () => {
    if (pendingQuestions.length > 0) {
      const nextIndex = (currentQuestionIndex + 1) % pendingQuestions.length;
      setCurrentQuestionIndex(nextIndex);
      setEditedQuestion({ ...pendingQuestions[nextIndex] });
    }
  };

  // Move to previous question
  const prevQuestion = () => {
    if (pendingQuestions.length > 0) {
      const prevIndex = (currentQuestionIndex - 1 + pendingQuestions.length) % pendingQuestions.length;
      setCurrentQuestionIndex(prevIndex);
      setEditedQuestion({ ...pendingQuestions[prevIndex] });
    }
  };

  useEffect(() => {
    fetchPendingQuestions();
  }, []);

  const currentQuestion = pendingQuestions[currentQuestionIndex];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentQuestion && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No pending questions for review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Review</CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {pendingQuestions.length > 0 
              ? `Question ${currentQuestionIndex + 1} of ${pendingQuestions.length}` 
              : "No questions"}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevQuestion}
              disabled={pendingQuestions.length <= 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextQuestion}
              disabled={pendingQuestions.length <= 1}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentQuestion && editedQuestion && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Subject</Label>
                <Input 
                  value={editedQuestion.subject || ""} 
                  onChange={(e) => setEditedQuestion({...editedQuestion, subject: e.target.value})}
                />
              </div>
              <div>
                <Label>Topic</Label>
                <Input 
                  value={editedQuestion.topic || ""} 
                  onChange={(e) => setEditedQuestion({...editedQuestion, topic: e.target.value})}
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Input 
                  value={editedQuestion.difficulty || ""} 
                  onChange={(e) => setEditedQuestion({...editedQuestion, difficulty: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Question</Label>
              <textarea
                value={editedQuestion.question || ""} 
                onChange={(e) => setEditedQuestion({...editedQuestion, question: e.target.value})}
                rows={4}
                className="flex w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base transition-all duration-150 ease-out placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300 dark:hover:border-gray-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-primary selection:text-primary-foreground w-full min-h-[120px]"
              />
            </div>

            <div>
              <Label>Choices</Label>
              {Array.isArray(editedQuestion.choices) && editedQuestion.choices.map((choice, index) => (
                <div key={index} className="mt-2">
                  <Input 
                    value={choice} 
                    onChange={(e) => {
                      const newChoices = [...editedQuestion.choices!];
                      newChoices[index] = e.target.value;
                      setEditedQuestion({...editedQuestion, choices: newChoices});
                    }}
                    placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <Label>Answer</Label>
              <Input 
                value={editedQuestion.answer || ""} 
                onChange={(e) => setEditedQuestion({...editedQuestion, answer: e.target.value})}
              />
            </div>

            <div>
              <Label>Explanation</Label>
              <textarea
                value={editedQuestion.explanation || ""} 
                onChange={(e) => setEditedQuestion({...editedQuestion, explanation: e.target.value})}
                rows={3}
                className="flex w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base transition-all duration-150 ease-out placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300 dark:hover:border-gray-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground selection:bg-primary selection:text-primary-foreground w-full min-h-[100px]"
              />
            </div>

            <div className="flex justify-between">
              <Button onClick={saveEdits}>
                Save Edits
              </Button>
              <div className="space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={() => updateQuestionStatus(currentQuestion.id, "rejected")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => updateQuestionStatus(currentQuestion.id, "approved")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}