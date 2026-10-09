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
  stability?: number; // FSRS: days until recall drops to 90%
  difficulty?: number; // FSRS: 1 (easy) .. 10 (hard)
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

export interface DailyResult {
  won: boolean;
  guesses: number;
  grid: string; // emoji grid for sharing, one row per guess
}

export interface GameProfile {
  coins: number;
  played: number;
  best: Record<string, number>; // game id -> best score (higher is better)
  daily: Record<string, DailyResult>; // 'YYYY-MM-DD' -> result of the daily word challenge
}

export interface UserStats {
  studyStreakDays: number;
  lastStudyDate: string; // 'YYYY-MM-DD'
  totalCardsReviewed: number;
  quizzesCompleted: number;
  reviewLog?: Record<string, number>; // 'YYYY-MM-DD' -> cards reviewed that day
  // Streak freezes: a monthly allowance that keeps the streak alive across missed days
  freezes?: number; // freezes available right now
  freezeMonth?: string; // 'YYYY-MM' of the last monthly grant
  frozenDays?: string[]; // 'YYYY-MM-DD' days that a freeze covered
  // Hour-of-day study pattern: '0'..'23' -> [reviews, correct]
  hourLog?: Record<string, [number, number]>;
  games?: GameProfile; // mini-game coins, records and the daily challenge history
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
  scheduler?: 'sm2' | 'fsrs'; // review scheduling algorithm (default 'sm2')
  desiredRetention?: number; // FSRS target recall probability, 0.7 - 0.97 (default 0.9)
  reverseReview?: boolean; // sometimes show well-known cards back-to-front (meaning -> term)
}
