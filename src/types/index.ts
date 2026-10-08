export type MasteryStatus = 'new' | 'learning' | 'mastered';

export interface WordItem {
  id: number | string;
  source: string; // Mặt trước (Thuật ngữ / Từ vựng / Câu hỏi)
  target: string; // Mặt sau (Định nghĩa / Dịch nghĩa / Đáp án)
  phonetic?: string; // Phiên âm (IPA)
  example?: string; // Ví dụ ngữ cảnh
  notes?: string; // Ghi chú bổ sung
  starred?: boolean; // Đánh dấu sao yêu thích
  status?: MasteryStatus; // 'new' | 'learning' | 'mastered'
  reviewCount?: number;
  lastReviewed?: number; // timestamp
  addedAt?: number; // when the card was (re)placed in its deck: created, copied or moved in (used for sync deletions)
  // Spaced repetition
  dueDate?: number; // timestamp when the card is next due
  intervalDays?: number;
  ease?: number;
  lapses?: number;
  wrongCount?: number; // times answered wrong (for "hard words")
  // Memory aids
  image?: string; // image URL
  mnemonic?: string; // memory hint
}

export interface CollectionItem {
  id?: string;
  name: string;
  pathname: string;
  description?: string;
  category?: string; // e.g., 'Tiếng Anh', 'Công nghệ', 'Giao tiếp'
  color?: string; // Thẻ màu chủ đạo
  createdAt?: number;
  updatedAt?: number;
  words: WordItem[];
}

export interface UserStats {
  studyStreakDays: number;
  lastStudyDate: string; // 'YYYY-MM-DD'
  totalCardsReviewed: number;
  quizzesCompleted: number;
  reviewLog?: Record<string, number>; // 'YYYY-MM-DD' -> cards reviewed that day
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  speechRate: number; // 0.8 - 1.2
  soundEffects: boolean;
  autoPlayDelaySec: number;
  dailyGoal?: number; // cards per day
  reminderEnabled?: boolean;
  reminderTime?: string; // 'HH:MM'
  autoSync?: boolean; // auto upload to Google Drive
  autoSpeak?: boolean; // read the front of a card aloud when it appears
  reverseReview?: boolean; // sometimes show well-known cards back-to-front (meaning -> term)
}
