// src/lib/types.ts
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