export type NavTab = 'home' | 'focus' | 'generator' | 'quiz' | 'results' | 'notes' | 'flashcards' | 'progress';

export type PaperStyle = 'plain-white' | 'ruled' | 'grid' | 'dotted' | 'dark' | 'cream';
export type PenStyle = 'ballpoint' | 'gel' | 'fineliner' | 'highlighter' | 'pencil';

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  paperStyle?: PaperStyle;
  drawingData?: string;
}

export type QuestionType = 'mcq' | 'short_answer' | 'mixed';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short_answer';
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  keyConcept?: string;
}

export interface QuizPackage {
  quizTitle: string;
  topic: string;
  difficulty: DifficultyLevel;
  summary?: string;
  questions: QuizQuestion[];
}

export interface QuizResultData {
  score: number;
  total: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  userAnswers: Record<string, string>;
  questions: QuizQuestion[];
  topic: string;
  difficulty: DifficultyLevel;
  timeSpentSeconds?: number;
}

export interface AnswerGradeResult {
  scorePercentage: number;
  gradeStatus: string;
  whatWasAccurate: string;
  missingOrMisunderstood: string;
  modelImprovementTip: string;
}

export interface NoteSummaryResult {
  executiveSummary: string;
  keyTakeaways: string[];
  memoryAids: string[];
  recommendedReviewQuestions: string[];
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  subject: string;
  deckName?: string;
  difficulty?: DifficultyLevel;
  isBookmarked?: boolean;
  sourceNoteId?: string;
  masteryLevel: 'unseen' | 'learning' | 'mastered';
  lastReviewed?: number;
}

export interface ActivityItem {
  id: string;
  type: 'flashcards' | 'focus' | 'quiz' | 'note';
  title: string;
  description: string;
  subject?: string;
  timestamp: number;
}

export interface SubjectActivityData {
  questionsSolved: number;
  cardsReviewed: number;
  focusMinutes: number;
}

export interface StudyStats {
  totalMinutes: number;
  totalSessions: number;
  streakDays: number;
  lastStudyDate: string; // YYYY-MM-DD
  dailyGoalMinutes: number;
  cardsReviewedCount: number;
  questionsSolvedCount: number;
  notesCreatedCount: number;
  subjectActivity: Record<string, SubjectActivityData>;
  activities: ActivityItem[];
  weeklyFocusHistory?: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  history: {
    date: string;
    minutes: number;
    sessions: number;
  }[];
}

export type AmbientSoundType = 'none' | 'rain' | 'forest' | 'cafe' | 'binaural';
