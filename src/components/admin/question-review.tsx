"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  createdAt: string;
}

export default function QuestionReview() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingQuestions();
  }, []);

  const fetchPendingQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/generate-question");
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuestionStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/questions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the question from the list
        setQuestions(questions.filter(q => q.id !== id));
      }
    } catch (error) {
      console.error("Failed to update question status:", error);
    }
  };

  if (loading) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Question Review</h1>
      
      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No pending questions for review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{question.question}</CardTitle>
                  <Badge variant="secondary">{question.status}</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge>{question.subject}</Badge>
                  <Badge>{question.topic}</Badge>
                  <Badge>{question.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {question.choices.map((choice, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded ${choice === question.answer ? 'bg-green-100 border border-green-300' : 'bg-gray-100'}`}
                    >
                      {choice}
                    </div>
                  ))}
                </div>
                
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="font-medium">Explanation:</p>
                  <p>{question.explanation}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => updateQuestionStatus(question.id, "approved")}
                    variant="default"
                  >
                    Approve
                  </Button>
                  <Button 
                    onClick={() => updateQuestionStatus(question.id, "rejected")}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}