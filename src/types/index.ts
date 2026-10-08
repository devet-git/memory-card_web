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
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  speechRate: number; // 0.8 - 1.2
  soundEffects: boolean;
  autoPlayDelaySec: number;
}
