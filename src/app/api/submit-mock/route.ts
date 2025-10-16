import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreQuestion, aggregateResults, approximateSatScale } from "@/lib/utils/scoring";

// Add interfaces for the mock submission
interface MockSubmission {
  answers: Array<{
    questionId: string;
    selectedOption: string;
    timeSpent: number;
  }>;
  sessionId: string;
  examId: string;
  startedAt: string;
  finishedAt: string;
}

interface QuestionData {
  id: string;
  correctAnswer: string;
  explanation: string;
}

interface AnswerData {
  answer: string;
  timeSpentSeconds: number;
}

interface ExamSection {
  name: string;
  questions: QuestionData[];
}

/**
Expected POST body:
{
  userId: "user_123",
  examId: "mock_....",
  exam: { id, goal, grade, sections: [{ name, questions: [{id, ...}] }] },
  answers: {
    "<questionId>": { answer: "A", timeSpentSeconds: 45 },
    ...
  },
  startedAt: "ISO",
  finishedAt: "ISO"
}
*/

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { examId, answers = {}, startedAt, finishedAt } = body;
    
    if (!examId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Fetch the exam from database
    const exam = await prisma.mockExam.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    // Build question list from exam
    const flatQuestionIds: string[] = [];
    JSON.parse(JSON.stringify(exam.sections)).forEach((s: ExamSection) => (s.questions || []).forEach((q: QuestionData) => flatQuestionIds.push(q.id)));

    // Score each question (use DB question record to verify correct answer & topic)
    const scored = [];
    for (const qid of flatQuestionIds) {
      const dbQuestion = await prisma.question.findUnique({
        where: { id: qid }
      });
      
      if (dbQuestion) {
        const userAns = answers[qid]?.answer || null;
        const timeSpent = answers[qid]?.timeSpentSeconds || 0;
        scored.push(scoreQuestion(dbQuestion, userAns, timeSpent));
      }
    }

    // Aggregate
    const agg = aggregateResults(scored);

    // Approx SAT projection (very rough)
    const projectedTotal = approximateSatScale(agg.accuracy);

    // Build per-section summary
    const sectionsSummary = [];
    for (const section of JSON.parse(JSON.stringify(exam.sections)) as ExamSection[]) {
      const sectionQids = (section.questions || []).map((q: QuestionData) => q.id);
      const sectionScored = scored.filter((s) => sectionQids.includes(s.qid));
      const secAgg = aggregateResults(sectionScored);
      sectionsSummary.push({
        name: section.name,
        questionCount: sectionQids.length,
        correct: secAgg.totalCorrect,
        accuracy: secAgg.accuracy,
        avgTimePerQuestion: secAgg.avgTimePerQuestion,
      });
    }

    // Persist attempt
    const attempt = await prisma.mockAttempt.create({
      data: {
        userId: session.user.id,
        mockExamId: examId,
        answers: answers,
        scored: scored,
        summary: {
          totalQuestions: agg.totalQuestions,
          totalCorrect: agg.totalCorrect,
          accuracy: agg.accuracy,
          avgTimePerQuestion: agg.avgTimePerQuestion,
          projectedTotal,
          sections: sectionsSummary,
        },
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        finishedAt: finishedAt ? new Date(finishedAt) : new Date()
      }
    });

    // Update topic mastery
    const now = new Date().toISOString();
    // Collate topic deltas with proper typing
    const topicDeltas: Record<string, { correctDelta: number; totalDelta: number }> = {};
    for (const s of scored) {
      topicDeltas[s.topic] = topicDeltas[s.topic] || { correctDelta: 0, totalDelta: 0 };
      topicDeltas[s.topic].correctDelta += s.points;
      topicDeltas[s.topic].totalDelta += 1;
    }
    
    // Update or create topic mastery records
    for (const topic of Object.keys(topicDeltas)) {
      const existingMastery = await prisma.topicMastery.findUnique({
        where: {
          userId_topic: {
            userId: session.user.id,
            topic: topic
          }
        }
      });
      
      if (existingMastery) {
        await prisma.topicMastery.update({
          where: {
            userId_topic: {
              userId: session.user.id,
              topic: topic
            }
          },
          data: {
            correct: existingMastery.correct + topicDeltas[topic].correctDelta,
            total: existingMastery.total + topicDeltas[topic].totalDelta,
            lastSeenAt: new Date(now)
          }
        });
      } else {
        await prisma.topicMastery.create({
          data: {
            userId: session.user.id,
            topic: topic,
            correct: topicDeltas[topic].correctDelta,
            total: topicDeltas[topic].totalDelta,
            lastSeenAt: new Date(now)
          }
        });
      }
    }

    // Build response
    const response = {
      success: true,
      attemptId: attempt.id,
      summary: attempt.summary,
      byTopic: agg.byTopic,
      byDifficulty: agg.byDifficulty,
      projectedTotal,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("submit-mock error:", err);
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}