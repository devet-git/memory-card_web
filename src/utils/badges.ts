import { CollectionItem, UserStats } from "types";

export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  progress: string; // e.g. "42/100"
  hidden?: boolean; // secret badge: shown as "???" until earned
}

interface Rule {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: number;
  hidden?: boolean;
  value: (ctx: Ctx) => number;
}

interface Ctx {
  stats: UserStats;
  totalCards: number;
  mastered: number;
  decks: number;
  bestStreakLog: number;
  starred: number;
  goalRun: number; // longest run of days that reached the daily goal
  dawn: number; // reviews between 04:00 and 05:59
  night: number; // reviews between 23:00 and 03:59
  freezesUsed: number;
}

// Longest run of consecutive calendar days in a list of 'YYYY-MM-DD' keys
function longestRun(days: string[]): number {
  const sorted = Array.from(new Set(days)).sort();
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const d of sorted) {
    const t = Date.parse(d + "T00:00:00Z");
    run = prev && t - prev === 86400000 ? run + 1 : 1;
    prev = t;
    best = Math.max(best, run);
  }
  return best;
}

const hourReviews = (stats: UserStats, hours: number[]) => hours.reduce((a, h) => a + (stats.hourLog?.[String(h)]?.[0] || 0), 0);

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
  { id: "decks5", icon: "📁", title: "Nhà sưu tầm", description: "Tạo 5 bộ sưu tập", target: 5, value: (c) => c.decks },
  { id: "streak100", icon: "💎", title: "Kim cương", description: "Học 100 ngày liên tiếp", target: 100, value: (c) => Math.max(c.stats.studyStreakDays, c.bestStreakLog) },
  { id: "review5000", icon: "🌌", title: "5000 lượt ôn", description: "Ôn tổng cộng 5000 lượt", target: 5000, value: (c) => c.stats.totalCardsReviewed },
  { id: "master500", icon: "🏛️", title: "Thư viện sống", description: "Thuộc 500 thẻ", target: 500, value: (c) => c.mastered },
  { id: "cards500", icon: "🗄️", title: "Kho tàng từ vựng", description: "Có 500 thẻ trong các bộ", target: 500, value: (c) => c.totalCards },
  { id: "decks10", icon: "🧭", title: "Người dẫn đường", description: "Tạo 10 bộ sưu tập", target: 10, value: (c) => c.decks },
  { id: "starred20", icon: "⭐", title: "Chọn lọc", description: "Gắn sao 20 thẻ", target: 20, value: (c) => c.starred },
  { id: "goal7", icon: "🎯", title: "Đúng chỉ tiêu", description: "Đạt mục tiêu ngày 7 ngày liên tiếp", target: 7, value: (c) => c.goalRun },
  { id: "dawn", icon: "🌅", title: "Chim sớm", description: "Ôn bài lúc 4–6 giờ sáng", target: 1, hidden: true, value: (c) => c.dawn },
  { id: "night", icon: "🦉", title: "Cú đêm", description: "Ôn bài sau 23 giờ", target: 1, hidden: true, value: (c) => c.night },
  { id: "freeze", icon: "🧊", title: "Phao cứu sinh", description: "Dùng băng streak để giữ chuỗi ngày", target: 1, hidden: true, value: (c) => c.freezesUsed }
];

export function computeBadges(stats: UserStats, collections: CollectionItem[], dailyGoal = 20): Badge[] {
  const log = stats.reviewLog || {};
  const frozen = stats.frozenDays || [];
  const studied = Object.keys(log).filter((d) => log[d] > 0);
  const ctx: Ctx = {
    stats,
    totalCards: collections.reduce((a, c) => a + c.words.length, 0),
    mastered: collections.reduce((a, c) => a + c.words.filter((w) => w.status === "mastered").length, 0),
    decks: collections.length,
    // Days covered by a streak freeze keep the chain going
    bestStreakLog: longestRun([...studied, ...frozen]),
    starred: collections.reduce((a, c) => a + c.words.filter((w) => w.starred).length, 0),
    goalRun: longestRun(studied.filter((d) => log[d] >= dailyGoal)),
    dawn: hourReviews(stats, [4, 5]),
    night: hourReviews(stats, [23, 0, 1, 2, 3]),
    freezesUsed: frozen.length
  };
  return RULES.map((r) => {
    const value = r.value(ctx);
    return {
      id: r.id,
      icon: r.icon,
      title: r.title,
      description: r.description,
      earned: value >= r.target,
      progress: `${Math.min(value, r.target)}/${r.target}`,
      hidden: r.hidden
    };
  });
}
