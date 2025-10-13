// src/lib/types.ts

// Chat message interface for tutoring conversations
export interface Message {
  id: string;
  content: string;
  type: "user" | "ai";
  timestamp: Date;
  // Enhanced content support
  imageUrl?: string;
  links?: LinkResult[];
  keywords?: string[];
  funFact?: string;
  analogy?: string;
  metadata?: any;
}

// Link result interface for educational resources
export interface LinkResult {
  title: string;
  url: string;
  type: 'youtube' | 'wikipedia' | 'educational';
  snippet?: string;
  relevanceScore?: number;
}

export interface StudentProfile {
  gradeLevel: number;
  age?: number;
  school?: string;
  subjects: string[];
  learningGoals: string[];
  learningStyle: string;
  difficultyLevel: string;
  sessionDuration?: number;
  interests: string[];
  pastEngagement: number;
  isOnboarded: boolean;
  isInterestedInSATPrep?: boolean;
}

export interface OnboardingData {
  gradeLevel: number;
  age?: number;
  school?: string;
  subjects: string[];
  learningGoals: string[];
  learningStyle: string;
  difficultyLevel: string;
  sessionDuration?: number;
  interests: string[];
  isInterestedInSATPrep?: boolean;
}

// SAT Study Plan Interface
export interface SATStudyPlan {
  id: string;
  timeline: '3-month' | '6-month' | '1-year' | 'custom';
  focusAreas: {
    math: string[];
    reading: string[];
    writing: string[];
  };
  weeklySchedule: {
    [week: number]: {
      math: string[];
      reading: string[];
      writing: string[];
      practiceTest: boolean;
    };
  };
  resourceRecommendations: {
    books: string[];
    websites: string[];
    practiceTests: string[];
  };
  aiGeneratedPlan?: any; // AI-generated plan structure
  createdAt: Date;
  // Progress tracking fields
  completedWeeks?: number[]; // Array of completed week numbers
  completedTasks?: Record<string, Record<string, boolean>>; // Completed tasks by week and day
}

// SAT Practice Session Interface
export interface SATPracticeSession {
  id: string;
  section: 'math' | 'reading' | 'writing' | 'full';
  score?: number;
  maxScore?: number;
  answers?: any;
  timeSpent?: number;
  completedAt?: Date;
  createdAt: Date;
}

// SAT Diagnostic Result Interface
export interface SATDiagnosticResult {
  id: string;
  mathScore?: number;
  readingScore?: number;
  writingScore?: number;
  totalScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  createdAt: Date;
}

// Enum constants for client-side use
export const LEARNING_STYLES = {
  VISUAL: 'VISUAL',
  AUDITORY: 'AUDITORY',
  KINESTHETIC: 'KINESTHETIC',
  READING_WRITING: 'READING_WRITING',
  MIXED: 'MIXED'
} as const;

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED'
} as const;

export type LearningStyleType = keyof typeof LEARNING_STYLES;
export type DifficultyLevelType = keyof typeof DIFFICULTY_LEVELS;