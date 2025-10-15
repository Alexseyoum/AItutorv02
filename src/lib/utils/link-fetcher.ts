// src/lib/utils/link-fetcher.ts
import { Logger } from '@/lib/logger';

export interface LinkResult {
  title: string;
  url: string;
  type: 'youtube' | 'wikipedia' | 'educational';
  snippet?: string;
  relevanceScore?: number;
}

export class LinkFetcher {
  async fetchRelevantLinks(topic: string, gradeLevel: number, maxPerSource: number = 2): Promise<LinkResult[]> {
    const refinedQuery = this.refineQueryForGrade(topic, gradeLevel);
    Logger.info(`🔗 Fetching links for: "${refinedQuery}" (Grade ${gradeLevel})`, { topic, gradeLevel, refinedQuery });

    const [wikiLinks, youtubeLinks] = await Promise.all([
      this.fetchWikipediaLinks(refinedQuery, maxPerSource),
      this.fetchYouTubeLinks(refinedQuery, maxPerSource),
    ]);

    return [...wikiLinks, ...youtubeLinks];
  }

  private refineQueryForGrade(topic: string, gradeLevel: number): string {
    if (gradeLevel < 8) {
      return `${topic} basics for kids grade ${gradeLevel} simple explanation`;
    } else {
      return `${topic} detailed explanation grade ${gradeLevel} advanced`;
    }
  }

  private async fetchWikipediaLinks(query: string, maxResults: number): Promise<LinkResult[]> {
    try {
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        return [{
          title: data.title,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
          type: 'wikipedia' as const,
          snippet: data.extract,
          relevanceScore: 0.8
        }];
      }
    } catch (error) {
      Logger.error('Wikipedia fetch error', error as Error, { query });
    }
    return [];
  }

  private async fetchYouTubeLinks(query: string, maxResults: number): Promise<LinkResult[]> {
    if (!process.env.YOUTUBE_API_KEY) {
      Logger.info('📺 YouTube API key not available');
      return [];
    }

    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' educational')}&type=video&maxResults=${maxResults}&key=${process.env.YOUTUBE_API_KEY}`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) throw new Error('YouTube API error');
      
      const data = await response.json();
      
      return data.items?.map((item: { snippet: { title: string; description: string }; id: { videoId: string } }) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        type: 'youtube' as const,
        snippet: item.snippet.description.substring(0, 150),
        relevanceScore: 0.7
      })) || [];
    } catch (error) {
      Logger.error('YouTube fetch error', error as Error, { query, maxResults });
      return [];
    }
  }
}

export const linkFetcher = new LinkFetcher();