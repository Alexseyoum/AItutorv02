// Export types for use in other files
export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  style?: 'illustration' | 'diagram' | 'realistic';
  gradeLevel?: number;
}

export interface ImageResult {
  url: string;
  alt: string;
  provider: string;
}

export interface LinkResult {
  title: string;
  url: string;
  type: 'youtube' | 'wikipedia' | 'educational';
  snippet?: string;
  relevanceScore?: number;
}

export interface EnhancedChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
  links?: LinkResult[];
  keywords?: string[];
  metadata?: Record<string, unknown>;
}

export interface TutorResponseEnhanced {
  content: string;
  imageUrl?: string;
  links?: LinkResult[];
  keywords?: string[];
  funFact?: string;
  analogy?: string;
}