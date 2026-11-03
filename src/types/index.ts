export type MathSubject =
  | 'algebra'
  | 'geometry'
  | 'trigonometry'
  | 'calculus'
  | 'linear_algebra'
  | 'statistics'
  | 'physics';

export type SolutionStep = {
  stepNumber: number;
  title: string;
  latex?: string;
  explanation: string;
};

export type MathSolution = {
  id: string;
  query: string;
  subject?: MathSubject;
  interpretation: string;
  steps: SolutionStep[];
  boxedAnswer: string;
  graphableFunctions?: string[];
  suggestedFollowUps?: string[];
  confidence?: number;
  timestamp: number;
};

export type InlinePracticeQuestion = {
  id: string;
  question: string;
  latex?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  selectedOptionIndex?: number;
  isAnswered?: boolean;
  showSteps?: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  solution?: MathSolution;
  practiceQuestion?: InlinePracticeQuestion;
  imageUrl?: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type ArtifactType = 'practice_test' | 'study_sheet' | 'ap_unit' | 'video_explainer';

export type ArtifactData = {
  id: string;
  type: ArtifactType;
  title: string;
  subtitle?: string;
  data: any;
};

export type Flashcard = {
  id: string;
  front: string; // Question or concept
  back: string;  // Formula, proof or answer
  latexFront?: string;
  latexBack?: string;
  subject: MathSubject;
  // SM-2 Spaced Repetition fields
  repetitions: number;
  interval: number; // days
  easeFactor: number;
  nextReviewDate: number;
};

export type ExamQuestion = {
  id: string;
  question: string;
  latex?: string;
  type: 'multiple_choice' | 'free_response';
  options?: string[];
  correctOptionIndex?: number;
  rubricCriteria?: string[];
  correctAnswerLatex: string;
  explanation: string;
  subject: MathSubject;
};

export type FRQGradingResult = {
  id: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  rubricBreakdown: {
    criterion: string;
    score: number;
    maxPoints: number;
    feedback: string;
  }[];
  overallFeedback: string;
  correctedSolutionLatex?: string;
};
