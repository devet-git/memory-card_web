import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import initialCollections from "utils/mockData";
import { CollectionItem, WordItem, UserStats, AppSettings, MasteryStatus } from "types";
import { removeAccent } from "utils/removeAccent";
import { schedule, Grade, SrsOptions } from "utils/srs";
import {
  mergeCollections,
  mergeStats,
  mergeTombstones,
  pruneTombstones,
  normalizeTombstones,
  emptyTombstones,
  deckKey,
  wordTombstoneKey,
  Tombstones
} from "utils/merge";
import { dateKey } from "utils/dates";
import { recordStudy, undoStudy, grantMonthlyFreezes } from "utils/streak";
import { applyGameResult, GameResult, profileOf } from "utils/games";
import { purchase, equip, unequip, equippedData, applyAccent, Slot } from "utils/shop";
import { TrashEntry, pruneTrash, trashWords, trashDeck, restoreEntry } from "utils/trash";

const STORAGE_DATA_KEY = "memcard_collections_v2";
const STORAGE_LEGACY_KEY = "appData";
const STORAGE_STATS_KEY = "memcard_stats";
const STORAGE_SETTINGS_KEY = "memcard_settings";
const STORAGE_TOMBSTONES_KEY = "memcard_tombstones";
const STORAGE_TRASH_KEY = "memcard_trash";

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
  recordGame: (result: GameResult) => void;
  trash: TrashEntry[];
  restoreFromTrash: (entryId: string) => { ok: boolean; error?: string };
  removeFromTrash: (entryId: string) => void;
  emptyTrash: () => void;
  buyItem: (id: string) => { ok: boolean; error?: string };
  equipItem: (id: string) => { ok: boolean; error?: string };
  unequipSlot: (slot: Slot) => void;
  recordReview: (collectionPathname: string, wordId: string | number, isCorrect?: boolean) => void;
  bulkImportWords: (collectionPathname: string, text: string) => number;
  importSharedCollection: (deck: { name: string; category?: string; description?: string; words: Omit<WordItem, "id">[] }) => string;
  // Backup & Restore
  exportToJSON: () => string;
  importFromJSON: (jsonData: string) => { success: boolean; count?: number; error?: string };
  transferWords: (opts: {
    from: string;
    ids: (string | number)[];
    mode: "move" | "copy";
    to?: string;
    newDeckName?: string;
  }) => { moved: number; skipped: number; pathname?: string; error?: string };
  bulkUpdateWords: (collectionPathname: string, ids: (string | number)[], patch: Partial<WordItem>) => void;
  deleteWords: (collectionPathname: string, ids: (string | number)[]) => void;
  mergeFromJSON: (jsonData: string) => { success: boolean; error?: string };
  resetToDefaultData: () => void;
}

const defaultStats: UserStats = {
  studyStreakDays: 1,
  lastStudyDate: dateKey(),
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
  autoSpeak: false,
  reverseReview: true
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
  const collectionsRef = useRef(collections);
  collectionsRef.current = collections;

  // Records of deleted decks/cards, so deletions survive merging with another device's backup
  const [tombstones, setTombstones] = useState<Tombstones>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TOMBSTONES_KEY);
      if (saved) return pruneTombstones(normalizeTombstones(JSON.parse(saved)));
    } catch (e) {}
    return emptyTombstones();
  });
  const tombstonesRef = useRef(tombstones);
  tombstonesRef.current = tombstones;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TOMBSTONES_KEY, JSON.stringify(tombstones));
    } catch (e) {}
  }, [tombstones]);

  // Recently deleted cards and decks, kept on this device so a mistake can be undone
  const [trash, setTrash] = useState<TrashEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRASH_KEY);
      if (saved) return pruneTrash(JSON.parse(saved));
    } catch (e) {}
    return [];
  });
  const trashRef = useRef(trash);
  trashRef.current = trash;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(trash));
    } catch (e) {}
  }, [trash]);

  const recordDeletedWords = useCallback((deckPathname: string, ids: (string | number)[]) => {
    const deck = collectionsRef.current.find((c) => c.pathname === deckPathname);
    if (!deck || ids.length === 0) return;
    const key = deckKey(deck);
    const now = Date.now();
    setTombstones((prev) => ({
      ...prev,
      words: { ...prev.words, ...Object.fromEntries(ids.map((id) => [wordTombstoneKey(key, id), now])) }
    }));
  }, []);

  const recordDeletedDecks = useCallback((decks: CollectionItem[]) => {
    if (decks.length === 0) return;
    const now = Date.now();
    setTombstones((prev) => ({ ...prev, decks: { ...prev.decks, ...Object.fromEntries(decks.map((d) => [deckKey(d), now])) } }));
  }, []);

  // User study stats
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STATS_KEY);
      if (saved) return grantMonthlyFreezes(JSON.parse(saved));
    } catch (e) {}
    return grantMonthlyFreezes(defaultStats);
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

  // Scheduling choices are read at answer time, so the callbacks below don't change when settings do
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const srsOptions = (): SrsOptions => ({ algorithm: settingsRef.current.scheduler, retention: settingsRef.current.desiredRetention });

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettingsState((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark"
    }));
  }, []);

  // Update streak logic (streak freezes and the hour pattern live in utils/streak)
  const checkAndUpdateStreak = useCallback((correct = true) => {
    setStats((prev) => recordStudy(prev, correct));
  }, []);

  // Mini-game results: coins, records and the daily challenge live in the stats so they sync with everything else
  const recordGame = useCallback((result: GameResult) => {
    setStats((prev) => applyGameResult(prev, result));
  }, []);

  // Shop. Reads the latest stats through a ref so two quick clicks can't spend the same coins twice.
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const commitShop = useCallback((result: { stats: UserStats; error?: string }) => {
    if (result.error) return { ok: false, error: result.error };
    statsRef.current = result.stats;
    setStats(result.stats);
    return { ok: true };
  }, []);
  const buyItem = useCallback((id: string) => commitShop(purchase(statsRef.current, id)), [commitShop]);
  const equipItem = useCallback((id: string) => commitShop(equip(statsRef.current, id)), [commitShop]);
  const unequipSlot = useCallback((slot: Slot) => {
    const next = unequip(statsRef.current, slot);
    statsRef.current = next;
    setStats(next);
  }, []);

  // The equipped accent colour recolours the whole app
  const accent = equippedData(profileOf(stats), "accent");
  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

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

      // A deck without a stable id is identified by its pathname, so renaming it looks like a deletion elsewhere
      const renamed = collectionsRef.current.find((c) => c.pathname === pathname);
      if (renamed && !renamed.id && removeAccent(cleanName) !== pathname) recordDeletedDecks([renamed]);

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
    [recordDeletedDecks]
  );

  const deleteCollection = useCallback((pathname: string) => {
    const deck = collectionsRef.current.find((c) => c.pathname === pathname);
    if (deck) {
      recordDeletedDecks([deck]);
      setTrash((t) => trashDeck(t, deck));
    }
    setCollections((prev) => prev.filter((c) => c.pathname !== pathname));
  }, [recordDeletedDecks]);

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
    const deck = collectionsRef.current.find((c) => c.pathname === collectionPathname);
    const gone = deck?.words.filter((w) => String(w.id) === String(wordId)) || [];
    if (deck && gone.length) setTrash((t) => trashWords(t, deck, gone));
    recordDeletedWords(collectionPathname, [wordId]);
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
  }, [recordDeletedWords]);

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
                    ...schedule(w, grade ?? (status === "mastered" ? 3 : 1), Date.now(), srsOptions()),
                    status,
                    reviewCount: (w.reviewCount || 0) + 1,
                    lastReviewed: Date.now()
                  }
                : w
            )
          };
        })
      );
      checkAndUpdateStreak((grade ?? (status === "mastered" ? 3 : 1)) >= 2);
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
                ...schedule(w, isCorrect ? 2 : 0, Date.now(), srsOptions()),
                reviewCount: count,
                status: nextStatus,
                lastReviewed: Date.now()
              };
            })
          };
        })
      );
      checkAndUpdateStreak(isCorrect);
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
                    ...schedule(w, grade, Date.now(), srsOptions()),
                    reviewCount: (w.reviewCount || 0) + 1,
                    lastReviewed: Date.now()
                  }
                : w
            )
          };
        })
      );
      checkAndUpdateStreak(grade >= 2);
    },
    [checkAndUpdateStreak]
  );

  // Takes back the review counters of the last answer (used by "undo" in the review session)
  const undoReviewCount = useCallback(() => {
    setStats((prev) => undoStudy(prev));
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

  const restoreFromTrash = useCallback((entryId: string) => {
    const entry = trashRef.current.find((e) => e.id === entryId);
    if (!entry) return { ok: false, error: "Mục này không còn trong thùng rác." };
    const result = restoreEntry(collectionsRef.current, entry);
    if (result.error) return { ok: false, error: result.error };
    setCollections(result.collections);
    // forget the deletion record, otherwise merging a backup from another device would delete it again
    const forget = result.forget;
    if (forget) {
      setTombstones((prev) => {
        const decks = { ...prev.decks };
        const words = { ...prev.words };
        if (forget.deck) delete decks[forget.deck];
        if (forget.word) delete words[forget.word];
        return { decks, words };
      });
    }
    setTrash((t) => t.filter((e) => e.id !== entryId));
    return { ok: true };
  }, []);

  const removeFromTrash = useCallback((entryId: string) => setTrash((t) => t.filter((e) => e.id !== entryId)), []);
  const emptyTrash = useCallback(() => setTrash([]), []);

  // Backup JSON export
  const exportToJSON = useCallback((): string => {
    const backupData = {
      version: 3,
      exportDate: new Date().toISOString(),
      collections,
      stats,
      tombstones: pruneTombstones(tombstones)
    };
    return JSON.stringify(backupData, null, 2);
  }, [collections, stats, tombstones]);

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

      // Replacing everything: decks that are not in the file count as deleted for other devices
      const keptKeys = new Set(importedCollections.map(deckKey));
      const dropped = collectionsRef.current.filter((c) => !keptKeys.has(deckKey(c)));
      const fromFile = normalizeTombstones(Array.isArray(parsed) ? null : parsed.tombstones);
      const next = pruneTombstones(mergeTombstones(fromFile, { decks: Object.fromEntries(dropped.map((d) => [deckKey(d), Date.now()])) }));
      tombstonesRef.current = next;
      setTombstones(next);
      setCollections(importedCollections);
      return { success: true, count: importedCollections.length };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi đọc tệp JSON" };
    }
  }, []);

  // Move or copy cards to another (or a brand-new) collection; cards whose front already exists there are skipped
  const transferWords = useCallback(
    (opts: { from: string; ids: (string | number)[]; mode: "move" | "copy"; to?: string; newDeckName?: string }) => {
      const source = collections.find((c) => c.pathname === opts.from);
      if (!source) return { moved: 0, skipped: 0, error: "Không tìm thấy bộ thẻ nguồn" };
      const idSet = new Set(opts.ids.map(String));
      const picked = source.words.filter((w) => idSet.has(String(w.id)));
      if (picked.length === 0) return { moved: 0, skipped: 0, error: "Chưa chọn thẻ nào" };

      let target = opts.to ? collections.find((c) => c.pathname === opts.to) : undefined;
      let created: CollectionItem | null = null;
      if (!target) {
        const name = (opts.newDeckName || "").trim();
        if (!name) return { moved: 0, skipped: 0, error: "Hãy chọn bộ thẻ đích hoặc nhập tên bộ mới" };
        if (collections.some((c) => c.name.toLowerCase() === name.toLowerCase() || c.pathname === removeAccent(name))) {
          return { moved: 0, skipped: 0, error: "Đã có bộ thẻ với tên này, hãy chọn nó trong danh sách" };
        }
        const now = Date.now();
        created = { id: `coll-${now}`, name, pathname: removeAccent(name), category: source.category || "Tổng hợp", description: "", color: source.color || "#3b82f6", createdAt: now, updatedAt: now, words: [] };
        target = created;
      }
      if (target.pathname === source.pathname) return { moved: 0, skipped: 0, error: "Bộ đích trùng với bộ nguồn" };

      const existing = new Set(target.words.map((w) => w.source.trim().toLowerCase()));
      const toAdd: WordItem[] = [];
      const movedIds = new Set<string>();
      let skipped = 0;
      picked.forEach((w, i) => {
        const key = w.source.trim().toLowerCase();
        if (existing.has(key)) {
          skipped++;
          return;
        }
        existing.add(key);
        movedIds.add(String(w.id));
        const stamp = Date.now();
        toAdd.push(opts.mode === "copy" ? { ...w, addedAt: stamp, id: `w-copy-${stamp}-${i}-${Math.random().toString(36).substr(2, 5)}` } : { ...w, addedAt: stamp });
      });

      const targetPath = target.pathname;
      if (opts.mode === "move") recordDeletedWords(opts.from, Array.from(movedIds));
      setCollections((prev) => {
        const base = created ? [created, ...prev] : prev;
        return base.map((c) => {
          if (c.pathname === targetPath) return { ...c, updatedAt: Date.now(), words: [...toAdd, ...c.words] };
          if (opts.mode === "move" && c.pathname === opts.from) {
            return { ...c, updatedAt: Date.now(), words: c.words.filter((w) => !movedIds.has(String(w.id))) };
          }
          return c;
        });
      });
      return { moved: toAdd.length, skipped, pathname: targetPath };
    },
    [collections, recordDeletedWords]
  );

  const bulkUpdateWords = useCallback((collectionPathname: string, ids: (string | number)[], patch: Partial<WordItem>) => {
    const idSet = new Set(ids.map(String));
    setCollections((prev) =>
      prev.map((c) =>
        c.pathname !== collectionPathname
          ? c
          : { ...c, updatedAt: Date.now(), words: c.words.map((w) => (idSet.has(String(w.id)) ? { ...w, ...patch } : w)) }
      )
    );
  }, []);

  const deleteWords = useCallback((collectionPathname: string, ids: (string | number)[]) => {
    const idSet = new Set(ids.map(String));
    const deck = collectionsRef.current.find((c) => c.pathname === collectionPathname);
    const gone = deck?.words.filter((w) => idSet.has(String(w.id))) || [];
    if (deck && gone.length) setTrash((t) => trashWords(t, deck, gone));
    recordDeletedWords(collectionPathname, ids);
    setCollections((prev) =>
      prev.map((c) =>
        c.pathname !== collectionPathname ? c : { ...c, updatedAt: Date.now(), words: c.words.filter((w) => !idSet.has(String(w.id))) }
      )
    );
  }, [recordDeletedWords]);

  // Merge a backup into local data instead of replacing it (used by auto sync)
  const mergeFromJSON = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const remoteCollections: CollectionItem[] = Array.isArray(parsed) ? parsed : parsed?.collections;
      if (!Array.isArray(remoteCollections)) return { success: false, error: "Định dạng JSON không hợp lệ" };
      const mergedTombstones = pruneTombstones(mergeTombstones(tombstonesRef.current, normalizeTombstones(parsed?.tombstones)));
      tombstonesRef.current = mergedTombstones;
      setTombstones(mergedTombstones);
      setCollections((prev) => mergeCollections(prev, remoteCollections, mergedTombstones));
      if (parsed?.stats) setStats((prev) => mergeStats(prev, parsed.stats));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi đọc dữ liệu" };
    }
  }, []);

  const resetToDefaultData = useCallback(() => {
    // Existing decks count as deleted (so sync doesn't bring them back); the fresh defaults are stamped newer than that
    recordDeletedDecks(collectionsRef.current);
    const now = Date.now();
    const fresh = initialCollections.map((c) => ({ ...c, updatedAt: now }));
    setCollections(fresh);
    setStats(defaultStats);
    try {
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(fresh));
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(defaultStats));
    } catch (e) {}
  }, [recordDeletedDecks]);

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
    recordGame,
    trash,
    restoreFromTrash,
    removeFromTrash,
    emptyTrash,
    buyItem,
    equipItem,
    unequipSlot,
    recordReview,
    bulkImportWords,
    importSharedCollection,
    exportToJSON,
    importFromJSON,
    transferWords,
    bulkUpdateWords,
    deleteWords,
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
