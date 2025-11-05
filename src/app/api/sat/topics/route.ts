import { NextRequest, NextResponse } from "next/server";
import { SATTopicService } from "@/lib/sat-topics";

export async function GET(_request: NextRequest) {
  try {
    // Get all available topics
    const topics = await SATTopicService.getAvailableTopics();
    
    // Get topics grouped by subject
    const topicsBySubject = await SATTopicService.getTopicsBySubject();
    
    // Get diagnostic topics
    const diagnosticTopics = await SATTopicService.getDiagnosticTopics(10);
    
    return NextResponse.json({
      topics: topics.map(t => t.topic),
      topicsBySubject,
      diagnosticTopics,
      topicCounts: topics
    });
  } catch (error) {
    console.error("Error fetching SAT topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}