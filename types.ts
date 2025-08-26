export interface NoteSection {
  heading: string;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
}

export type LearningNotes = NoteSection[];

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export type Quiz = QuizQuestion[];
