export type VocabItem = {
  sr: string;
  en: string;
};

export type DialogueLine = {
  speaker: string;
  sr: string;
  en: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type Lesson = {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  vocab: VocabItem[];
  dialogue: DialogueLine[];
  quiz: QuizQuestion[];
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_slug: string;
  score: number;
  total: number;
  completed_at: string;
};
