// File: src/lib/sat-topics.ts
import { prisma } from "@/lib/prisma";

export interface TopicInfo {
  subject: string;
  topic: string;
  count: number;
}

export class SATTopicService {
  // Get all available topics from the database
  static async getAvailableTopics(): Promise<TopicInfo[]> {
    try {
      const topicCounts = await prisma.question.groupBy({
        by: ['subject', 'topic'],
        where: {
          status: "APPROVED",
          isActive: true
        },
        _count: {
          id: true
        }
      });
      
      return topicCounts.map(tc => ({
        subject: tc.subject,
        topic: tc.topic,
        count: tc._count.id
      })).sort((a, b) => b.count - a.count); // Sort by count descending
    } catch (error) {
      console.error("Error fetching topics:", error);
      return []; // Return empty array as fallback
    }
  }

  // Get topics grouped by subject
  static async getTopicsBySubject(): Promise<Record<string, string[]>> {
    try {
      const topics = await this.getAvailableTopics();
      const grouped: Record<string, string[]> = {};
      
      topics.forEach(topicInfo => {
        if (!grouped[topicInfo.subject]) {
          grouped[topicInfo.subject] = [];
        }
        grouped[topicInfo.subject].push(topicInfo.topic);
      });
      
      return grouped;
    } catch (error) {
      console.error("Error grouping topics by subject:", error);
      return {}; // Return empty object as fallback
    }
  }

  // Get a sample of topics for diagnostic test (ensuring we have enough questions)
  static async getDiagnosticTopics(limit: number = 8): Promise<string[]> {
    try {
      const topics = await this.getAvailableTopics();
      // Filter to ensure we have topics with sufficient questions
      const filteredTopics = topics.filter(t => t.count >= 3); // At least 3 questions per topic
      // Return top topics up to limit
      return filteredTopics.slice(0, limit).map(t => t.topic);
    } catch (error) {
      console.error("Error getting diagnostic topics:", error);
      // Fallback to some default topics
      return [
        "Algebra: Linear Equations",
        "Geometry: Triangles",
        "Reading Comprehension: Literature",
        "Grammar: Sentence Structure"
      ];
    }
  }
}