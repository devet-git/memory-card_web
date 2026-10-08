import { CollectionItem, UserStats } from "types";

export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  progress: string; // e.g. "42/100"
}

interface Rule {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: number;
  value: (ctx: Ctx) => number;
}

interface Ctx {
  stats: UserStats;
  totalCards: number;
  mastered: number;
  decks: number;
  bestStreakLog: number;
}

// Longest run of consecutive days in the review log
function longestRun(log: Record<string, number> = {}): number {
  const days = Object.keys(log).filter((d) => log[d] > 0).sort();
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const d of days) {
    const t = Date.parse(d + "T00:00:00Z");
    run = prev && t - prev === 86400000 ? run + 1 : 1;
    prev = t;
    best = Math.max(best, run);
  }
  return best;
}

const RULES: Rule[] = [
  { id: "streak3", icon: "🔥", title: "Khởi động", description: "Học 3 ngày liên tiếp", target: 3, value: (c) => Math.max(c.stats.studyStreakDays, c.bestStreakLog) },
  { id: "streak7", icon: "⚡", title: "Một tuần bền bỉ", description: "Học 7 ngày liên tiếp", target: 7, value: (c) => Math.max(c.stats.studyStreakDays, c.bestStreakLog) },
  { id: "streak30", icon: "🏆", title: "Thói quen thép", description: "Học 30 ngày liên tiếp", target: 30, value: (c) => Math.max(c.stats.studyStreakDays, c.bestStreakLog) },
  { id: "review100", icon: "📚", title: "100 lượt ôn", description: "Ôn tổng cộng 100 lượt", target: 100, value: (c) => c.stats.totalCardsReviewed },
  { id: "review1000", icon: "🚀", title: "1000 lượt ôn", description: "Ôn tổng cộng 1000 lượt", target: 1000, value: (c) => c.stats.totalCardsReviewed },
  { id: "master10", icon: "🌱", title: "Hạt giống", description: "Thuộc 10 thẻ", target: 10, value: (c) => c.mastered },
  { id: "master50", icon: "🌳", title: "Cây tri thức", description: "Thuộc 50 thẻ", target: 50, value: (c) => c.mastered },
  { id: "master200", icon: "🧠", title: "Bộ nhớ thép", description: "Thuộc 200 thẻ", target: 200, value: (c) => c.mastered },
  { id: "cards100", icon: "🗂️", title: "Thư viện nhỏ", description: "Có 100 thẻ trong các bộ", target: 100, value: (c) => c.totalCards },
  { id: "decks5", icon: "📁", title: "Nhà sưu tầm", description: "Tạo 5 bộ sưu tập", target: 5, value: (c) => c.decks }
];

export function computeBadges(stats: UserStats, collections: CollectionItem[]): Badge[] {
  const ctx: Ctx = {
    stats,
    totalCards: collections.reduce((a, c) => a + c.words.length, 0),
    mastered: collections.reduce((a, c) => a + c.words.filter((w) => w.status === "mastered").length, 0),
    decks: collections.length,
    bestStreakLog: longestRun(stats.reviewLog)
  };
  return RULES.map((r) => {
    const value = r.value(ctx);
    return {
      id: r.id,
      icon: r.icon,
      title: r.title,
      description: r.description,
      earned: value >= r.target,
      progress: `${Math.min(value, r.target)}/${r.target}`
    };
  });
}
