// src/lib/utils/keyword-extractor.ts
import { AIProviderManager } from '@/lib/ai/ai-providers';
import { Logger } from '@/lib/logger';

export class KeywordExtractor {
  private aiManager: AIProviderManager;

  constructor() {
    this.aiManager = new AIProviderManager();
  }

  async extractKeywords(text: string, gradeLevel: number): Promise<string[]> {
    // Try Groq-based extraction first
    try {
      const groqKeywords = await this.extractWithGroq(text, gradeLevel);
      if (groqKeywords.length > 0) {
        Logger.info('🔤 Keywords extracted with Groq', { keywords: groqKeywords });
        return groqKeywords;
      }
    } catch (error) {
      Logger.info('❌ Groq keyword extraction failed, falling back to regex');
    }

    // Fallback to regex-based extraction
    return this.extractWithRegex(text);
  }

  private async extractWithGroq(text: string, gradeLevel: number): Promise<string[]> {
    const availableProviders = this.aiManager.getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    const prompt = `Extract 3-5 key educational terms from: "${text}". 
    Grade ${gradeLevel}-appropriate (simple for kids <8, detailed for >=8). 
    Return only comma-separated terms, no explanations.`;

    const response = await this.aiManager.generateWithFallback(prompt, 50);
    
    return response
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 2 && keyword.length < 20)
      .slice(0, 5);
  }

  private extractWithRegex(text: string): string[] {
    // Enhanced regex that filters for educational terms
    const educationalTerms = text.match(/\b([A-Z][a-z]{3,}|[a-z]{4,})\b/g) || [];
    
    // Filter out common words and keep meaningful terms
    const stopWords = new Set(['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other']);
    
    const filtered = [...new Set(educationalTerms)]
      .filter(term => !stopWords.has(term.toLowerCase()))
      .slice(0, 5);
    
    Logger.info('🔍 Regex-extracted keywords', { keywords: filtered });
    return filtered;
  }
}

export const keywordExtractor = new KeywordExtractor();