/**
 * Generate questions using the API
 */
import { Logger } from '@/lib/logger';

export async function generateQuestions(params: {
  grade?: number;
  topic: string;
  subject?: string;
  difficulty?: string;
  goal?: string;
  questionCount?: number;
}) {
  // Add retry logic
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grade: params.grade || 11,
          topic: params.topic,
          subject: params.subject || "Math",
          difficulty: params.difficulty || "medium",
          goal: params.goal || "SAT",
          questionCount: params.questionCount || 1,
        }),
        // Include credentials for authentication
        credentials: "include"
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        throw new Error(`Expected JSON response but got ${contentType}. Response: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to generate questions");
      }

      return data.questions;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        Logger.error("Question generation failed after", error as Error, { attempts: maxAttempts, params });
        // Re-throw with more context
        if (error instanceof Error) {
          throw new Error(`Question generation failed: ${error.message}`);
        }
        throw new Error("Question generation failed due to an unknown error");
      }
      // Wait before retrying with exponential backoff
      // Increase delay to give LLM more time to generate proper response
      await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
    }
  }
  throw new Error("Question generation failed due to an unknown error");
}

/**
 * Create a mock exam
 */
export async function createMockExam(params: {
  goal?: string;
  grade?: number;
}) {
  try {
    const response = await fetch("/api/generate-mock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal: params.goal || "SAT",
        grade: params.grade || 11,
      }),
      // Include credentials for authentication
      credentials: "include"
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to generate mock exam");
    }

    return data.exam;
  } catch (error) {
    Logger.error("Mock exam generation failed", error as Error, { params });
    throw error;
  }
}

/**
 * Submit a completed mock exam
 */
export async function submitMockExam(params: {
  examId: string;
  answers: Record<string, { answer: string; timeSpentSeconds: number }>;
  startedAt: string;
  finishedAt: string;
}) {
  try {
    const response = await fetch("/api/submit-mock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        examId: params.examId,
        answers: params.answers,
        startedAt: params.startedAt,
        finishedAt: params.finishedAt,
      }),
      // Include credentials for authentication
      credentials: "include"
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to submit mock exam");
    }

    return data;
  } catch (error) {
    Logger.error("Mock exam submission failed", error as Error, { examId: params.examId });
    throw error;
  }
}