import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import initialCollections from "utils/mockData";
import { CollectionItem, WordItem, UserStats, AppSettings, MasteryStatus } from "types";
import { removeAccent } from "utils/removeAccent";
import { schedule, Grade } from "utils/srs";
import { mergeCollections, mergeStats } from "utils/merge";

const STORAGE_DATA_KEY = "memcard_collections_v2";
const STORAGE_LEGACY_KEY = "appData";
const STORAGE_STATS_KEY = "memcard_stats";
const STORAGE_SETTINGS_KEY = "memcard_settings";

// One-time move of data saved under the old "memocard_*" keys
(function migrateLegacyKeys() {
  if (typeof window === "undefined") return;
  try {
    ["collections_v2", "stats", "settings"].forEach((suffix) => {
      const oldKey = `memocard_${suffix}`;
      const newKey = `memcard_${suffix}`;
      const old = localStorage.getItem(oldKey);
      if (old !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, old);
      }
      localStorage.removeItem(oldKey);
    });
  } catch (e) {}
})();

interface CollectionContextType {
  collections: CollectionItem[];
  setCollections: React.Dispatch<React.SetStateAction<CollectionItem[]>>;
  stats: UserStats;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  // Collection operations
  addCollection: (name: string, category?: string, description?: string, color?: string) => { success: boolean; message?: string; pathname?: string };
  updateCollection: (pathname: string, newName: string, category?: string, description?: string) => boolean;
  deleteCollection: (pathname: string) => void;
  // Word operations
  addWord: (collectionPathname: string, word: Omit<WordItem, "id">) => boolean;
  updateWord: (collectionPathname: string, wordId: string | number, updatedWord: Partial<WordItem>) => boolean;
  deleteWord: (collectionPathname: string, wordId: string | number) => boolean;
  toggleStar: (collectionPathname: string, wordId: string | number) => void;
  updateWordStatus: (collectionPathname: string, wordId: string | number, status: MasteryStatus, grade?: Grade) => void;
  reviewWord: (collectionPathname: string, wordId: string | number, grade: Grade) => void;
  undoReviewCount: () => void;
  recordReview: (collectionPathname: string, wordId: string | number, isCorrect?: boolean) => void;
  bulkImportWords: (collectionPathname: string, text: string) => number;
  importSharedCollection: (deck: { name: string; category?: string; description?: string; words: Omit<WordItem, "id">[] }) => string;
  // Backup & Restore
  exportToJSON: () => string;
  importFromJSON: (jsonData: string) => { success: boolean; count?: number; error?: string };
  mergeFromJSON: (jsonData: string) => { success: boolean; error?: string };
  resetToDefaultData: () => void;
}

const defaultStats: UserStats = {
  studyStreakDays: 1,
  lastStudyDate: new Date().toISOString().split("T")[0],
  totalCardsReviewed: 12,
  quizzesCompleted: 3
};

const defaultSettings: AppSettings = {
  theme: "light",
  speechRate: 0.95,
  soundEffects: true,
  autoPlayDelaySec: 4,
  dailyGoal: 20,
  reminderEnabled: false,
  reminderTime: "20:00",
  autoSync: false,
  autoSpeak: false
};

const CollectionContext = createContext<CollectionContextType>({} as CollectionContextType);

function loadInitialCollections(): CollectionItem[] {
  if (typeof window === "undefined") return initialCollections;

  try {
    const savedV2 = localStorage.getItem(STORAGE_DATA_KEY);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Try migrating legacy data
    const legacy = localStorage.getItem(STORAGE_LEGACY_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        // Upgrade structure
        const upgraded: CollectionItem[] = parsedLegacy.map((item: any, idx: number) => ({
          id: item.id || `coll-legacy-${idx}-${Date.now()}`,
          name: item.name,
          pathname: item.pathname || removeAccent(item.name),
          category: "Tổng hợp",
          color: "#3b82f6",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          words: Array.isArray(item.words)
            ? item.words.map((w: any, widx: number) => ({
                id: w.id || `w-${widx}-${Date.now()}`,
                source: w.source || "",
                target: w.target || "",
                status: w.status || "new",
                starred: Boolean(w.starred),
                reviewCount: w.reviewCount || 0
              }))
            : []
        }));
        localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(upgraded));
        return upgraded;
      }
    }
  } catch (err) {
    console.error("Failed to load collections from localStorage:", err);
  }

  return initialCollections;
}

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<CollectionItem[]>(loadInitialCollections);

  // User study stats
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultStats;
  });

  // App settings & theme
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultSettings;
  });

  // Save collections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(collections));
      // keep legacy key updated for backwards compatibility
      localStorage.setItem(STORAGE_LEGACY_KEY, JSON.stringify(collections));
    } catch (err) {
      console.error("Error saving collections to localStorage:", err);
    }
  }, [collections]);

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
    } catch (err) {
      console.error("Error saving stats to localStorage:", err);
    }
  }, [stats]);

  // Sync theme attribute to HTML document root
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
      if (settings.theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    } catch (err) {
      console.error("Error updating theme settings:", err);
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettingsState((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark"
    }));
  }, []);

  // Update streak logic
  const checkAndUpdateStreak = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setStats((prev) => {
      const reviewLog = { ...(prev.reviewLog || {}), [today]: ((prev.reviewLog || {})[today] || 0) + 1 };
      if (prev.lastStudyDate === today) {
        return {
          ...prev,
          reviewLog,
          totalCardsReviewed: prev.totalCardsReviewed + 1
        };
      }
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const isConsecutive = prev.lastStudyDate === yesterday;
      return {
        ...prev,
        studyStreakDays: isConsecutive ? prev.studyStreakDays + 1 : 1,
        lastStudyDate: today,
        reviewLog,
        totalCardsReviewed: prev.totalCardsReviewed + 1
      };
    });
  }, []);

  // Collection CRUD
  const addCollection = useCallback(
    (name: string, category = "Tổng hợp", description = "", color = "#3b82f6") => {
      const cleanName = name.trim();
      if (!cleanName) {
        return { success: false, message: "Tên bộ sưu tập không được để trống" };
      }

      const existing = collections.find(
        (c) => c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existing) {
        return { success: false, message: "Đã tồn tại bộ sưu tập với tên này" };
      }

      let pathname = removeAccent(cleanName);
      if (collections.some((c) => c.pathname === pathname)) {
        pathname = `${pathname}-${Date.now().toString(36)}`;
      }

      const newColl: CollectionItem = {
        id: `coll-${Date.now()}`,
        name: cleanName,
        pathname,
        category,
        description,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        words: []
      };

      setCollections((prev) => [newColl, ...prev]);
      return { success: true, pathname };
    },
    [collections]
  );

  const updateCollection = useCallback(
    (pathname: string, newName: string, category?: string, description?: string) => {
      const cleanName = newName.trim();
      if (!cleanName) return false;

      setCollections((prev) =>
        prev.map((c) => {
          if (c.pathname !== pathname) return c;
          const newPathname = removeAccent(cleanName);
          return {
            ...c,
            name: cleanName,
            pathname: newPathname,
            category: category ?? c.category,
            description: description ?? c.description,
            updatedAt: Date.now()
          };
        })
      );
      return true;
    },
    []
  );

  const deleteCollection = useCallback((pathname: string) => {
    setCollections((prev) => prev.filter((c) => c.pathname !== pathname));
  }, []);

  // Word CRUD
  const addWord = useCallback(
    (collectionPathname: string, word: Omit<WordItem, "id">) => {
      if (!word.source.trim() || !word.target.trim()) return false;

      const newWord: WordItem = {
        ...word,
        id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        status: word.status || "new",
        starred: Boolean(word.starred),
        reviewCount: 0
      };

      setCollections((prev) =>
        prev.map((coll) => {
          if (coll.pathname !== collectionPathname) return coll;
          return {
            ...coll,
            updatedAt: Date.now(),
            words: [newWord, ...coll.words]
          };
        })
      );
      return true;
    },
    []
  );

  const updateWord = useCallback(
    (collectionPathname: string, wordId: string | number, updatedWord: Partial<WordItem>) => {
      setCollections((prev) =>
        prev.map((coll) => {
          if (coll.pathname !== collectionPathname) return coll;
          return {
            ...coll,
            updatedAt: Date.now(),
            words: coll.words.map((w) =>
              String(w.id) === String(wordId) ? { ...w, ...updatedWord } : w
            )
          };
        })
      );
      return true;
    },
    []
  );

  const deleteWord = useCallback((collectionPathname: string, wordId: string | number) => {
    setCollections((prev) =>
      prev.map((coll) => {
        if (coll.pathname !== collectionPathname) return coll;
        return {
          ...coll,
          updatedAt: Date.now(),
          words: coll.words.filter((w) => String(w.id) !== String(wordId))
        };
      })
    );
    return true;
  }, []);

  const toggleStar = useCallback((collectionPathname: string, wordId: string | number) => {
    setCollections((prev) =>
      prev.map((coll) => {
        if (coll.pathname !== collectionPathname) return coll;
        return {
          ...coll,
          words: coll.words.map((w) =>
            String(w.id) === String(wordId) ? { ...w, starred: !w.starred } : w
          )
        };
      })
    );
  }, []);

  const updateWordStatus = useCallback(
    (collectionPathname: string, wordId: string | number, status: MasteryStatus, grade?: Grade) => {
      setCollections((prev) =>
        prev.map((coll) => {
          if (coll.pathname !== collectionPathname) return coll;
          return {
            ...coll,
            words: coll.words.map((w) =>
              String(w.id) === String(wordId)
                ? {
                    ...w,
                    ...schedule(w, grade ?? (status === "mastered" ? 3 : 1)),
                    status,
                    reviewCount: (w.reviewCount || 0) + 1,
                    lastReviewed: Date.now()
                  }
                : w
            )
          };
        })
      );
      checkAndUpdateStreak();
    },
    [checkAndUpdateStreak]
  );

  const recordReview = useCallback(
    (collectionPathname: string, wordId: string | number, isCorrect = true) => {
      setCollections((prev) =>
        prev.map((coll) => {
          if (coll.pathname !== collectionPathname) return coll;
          return {
            ...coll,
            words: coll.words.map((w) => {
              if (String(w.id) !== String(wordId)) return w;
              const count = (w.reviewCount || 0) + 1;
              let nextStatus: MasteryStatus = w.status || "new";
              if (isCorrect) {
                nextStatus = count >= 3 ? "mastered" : "learning";
              } else {
                nextStatus = "learning";
              }
              return {
                ...w,
                ...schedule(w, isCorrect ? 2 : 0),
                reviewCount: count,
                status: nextStatus,
                lastReviewed: Date.now()
              };
            })
          };
        })
      );
      checkAndUpdateStreak();
    },
    [checkAndUpdateStreak]
  );

  // Spaced-repetition review: schedule the next due date from a 0-3 grade
  const reviewWord = useCallback(
    (collectionPathname: string, wordId: string | number, grade: Grade) => {
      setCollections((prev) =>
        prev.map((coll) => {
          if (coll.pathname !== collectionPathname) return coll;
          return {
            ...coll,
            words: coll.words.map((w) =>
              String(w.id) === String(wordId)
                ? {
                    ...w,
                    ...schedule(w, grade),
                    reviewCount: (w.reviewCount || 0) + 1,
                    lastReviewed: Date.now()
                  }
                : w
            )
          };
        })
      );
      checkAndUpdateStreak();
    },
    [checkAndUpdateStreak]
  );

  // Takes back the review counters of the last answer (used by "undo" in the review session)
  const undoReviewCount = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setStats((prev) => {
      const log = { ...(prev.reviewLog || {}) };
      if (log[today]) log[today] = Math.max(0, log[today] - 1);
      return { ...prev, reviewLog: log, totalCardsReviewed: Math.max(0, prev.totalCardsReviewed - 1) };
    });
  }, []);

  // Bulk Quick Import (reads "front - back" or "front : back" or "front | back" or tab-delimited)
  const bulkImportWords = useCallback((collectionPathname: string, text: string): number => {
    if (!text || !text.trim()) return 0;
    const lines = text.split("\n");
    const newWords: WordItem[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let source = "";
      let target = "";
      let example = "";

      // Try delimiters: tab, " - ", " : ", " | ", ","
      if (line.includes("\t")) {
        const parts = line.split("\t");
        source = parts[0]?.trim();
        target = parts[1]?.trim();
        example = parts[2]?.trim() || "";
      } else if (line.includes(" - ")) {
        const parts = line.split(" - ");
        source = parts[0]?.trim();
        target = parts[1]?.trim();
        example = parts[2]?.trim() || "";
      } else if (line.includes(" : ")) {
        const parts = line.split(" : ");
        source = parts[0]?.trim();
        target = parts[1]?.trim();
      } else if (line.includes(" | ")) {
        const parts = line.split(" | ");
        source = parts[0]?.trim();
        target = parts[1]?.trim();
        example = parts[2]?.trim() || "";
      } else if (line.includes(",")) {
        const parts = line.split(",");
        source = parts[0]?.trim();
        target = parts[1]?.trim();
      }

      if (source && target) {
        newWords.push({
          id: `w-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          source,
          target,
          example: example || undefined,
          status: "new",
          starred: false,
          reviewCount: 0
        });
      }
    }

    if (newWords.length > 0) {
      setCollections((prev) =>
        prev.map((coll) => {
          if (coll.pathname !== collectionPathname) return coll;
          return {
            ...coll,
            updatedAt: Date.now(),
            words: [...newWords, ...coll.words]
          };
        })
      );
    }

    return newWords.length;
  }, []);

  // Create a brand-new collection from a shared deck (name made unique); returns its pathname
  const importSharedCollection = useCallback(
    (deck: { name: string; category?: string; description?: string; words: Omit<WordItem, "id">[] }): string => {
      let name = deck.name.trim() || "Bộ thẻ chia sẻ";
      const taken = (n: string) => collections.some((c) => c.name.toLowerCase() === n.toLowerCase() || c.pathname === removeAccent(n));
      let suffix = 2;
      const base = name;
      while (taken(name)) name = `${base} (${suffix++})`;

      const pathname = removeAccent(name);
      const now = Date.now();
      const created: CollectionItem = {
        id: `coll-${now}`,
        name,
        pathname,
        category: deck.category || "Tổng hợp",
        description: deck.description || "",
        color: "#3b82f6",
        createdAt: now,
        updatedAt: now,
        words: deck.words.map((w, i) => ({
          ...w,
          id: `w-share-${now}-${i}-${Math.random().toString(36).substr(2, 5)}`
        }))
      };
      setCollections((prev) => [created, ...prev]);
      return pathname;
    },
    [collections]
  );

  // Backup JSON export
  const exportToJSON = useCallback((): string => {
    const backupData = {
      version: 2,
      exportDate: new Date().toISOString(),
      collections,
      stats
    };
    return JSON.stringify(backupData, null, 2);
  }, [collections, stats]);

  // Restore JSON import
  const importFromJSON = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      let importedCollections: CollectionItem[] = [];

      if (Array.isArray(parsed)) {
        importedCollections = parsed;
      } else if (parsed && Array.isArray(parsed.collections)) {
        importedCollections = parsed.collections;
        if (parsed.stats) {
          setStats((prev) => ({ ...prev, ...parsed.stats }));
        }
      } else {
        return { success: false, error: "Định dạng JSON không hợp lệ" };
      }

      if (importedCollections.length === 0) {
        return { success: false, error: "Tệp không chứa bộ thẻ nào" };
      }

      setCollections(importedCollections);
      return { success: true, count: importedCollections.length };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi đọc tệp JSON" };
    }
  }, []);

  // Merge a backup into local data instead of replacing it (used by auto sync)
  const mergeFromJSON = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const remoteCollections: CollectionItem[] = Array.isArray(parsed) ? parsed : parsed?.collections;
      if (!Array.isArray(remoteCollections)) return { success: false, error: "Định dạng JSON không hợp lệ" };
      setCollections((prev) => mergeCollections(prev, remoteCollections));
      if (parsed?.stats) setStats((prev) => mergeStats(prev, parsed.stats));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi đọc dữ liệu" };
    }
  }, []);

  const resetToDefaultData = useCallback(() => {
    setCollections(initialCollections);
    setStats(defaultStats);
    try {
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(initialCollections));
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(defaultStats));
    } catch (e) {}
  }, []);

  const contextValues: CollectionContextType = {
    collections,
    setCollections,
    stats,
    settings,
    updateSettings,
    toggleTheme,
    addCollection,
    updateCollection,
    deleteCollection,
    addWord,
    updateWord,
    deleteWord,
    toggleStar,
    updateWordStatus,
    reviewWord,
    undoReviewCount,
    recordReview,
    bulkImportWords,
    importSharedCollection,
    exportToJSON,
    importFromJSON,
    mergeFromJSON,
    resetToDefaultData
  };

  return (
    <CollectionContext.Provider value={contextValues}>
      {children}
    </CollectionContext.Provider>
  );
}

const useCollectionContext = () => useContext(CollectionContext);
export default useCollectionContext;
