import { getActiveUsername, normalizeUsername } from "./user-store";

export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  corrected?: string;
  reason?: string;
  savedAt: number;
}

function storageKey(username: string) {
  return `ial.wordbook.v1.${normalizeUsername(username)}`;
}

function readAll(): SavedWord[] {
  if (typeof window === "undefined") return [];
  const username = getActiveUsername();
  if (!username) return [];
  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? (JSON.parse(raw) as SavedWord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(words: SavedWord[]) {
  if (typeof window === "undefined") return;
  const username = getActiveUsername();
  if (!username) return;
  localStorage.setItem(storageKey(username), JSON.stringify(words));
}

export function normalizeWordKey(word: string): string {
  return word.trim().toLowerCase();
}

export function getWordbook(): SavedWord[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function getWordbookCount(): number {
  return readAll().length;
}

export function isWordSaved(word: string): boolean {
  const key = normalizeWordKey(word);
  return readAll().some((w) => normalizeWordKey(w.word) === key);
}

export function saveToWordbook(entry: Omit<SavedWord, "id" | "savedAt">): SavedWord {
  const key = normalizeWordKey(entry.word);
  const all = readAll();
  const existing = all.find((w) => normalizeWordKey(w.word) === key);
  if (existing) return existing;

  const saved: SavedWord = {
    ...entry,
    id: `wb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    savedAt: Date.now(),
  };
  all.unshift(saved);
  writeAll(all);
  return saved;
}

export function removeFromWordbook(wordOrId: string) {
  const key = normalizeWordKey(wordOrId);
  writeAll(
    readAll().filter(
      (w) => w.id !== wordOrId && normalizeWordKey(w.word) !== key
    )
  );
}

export function toggleWordbook(entry: Omit<SavedWord, "id" | "savedAt">): boolean {
  if (isWordSaved(entry.word)) {
    removeFromWordbook(entry.word);
    return false;
  }
  saveToWordbook(entry);
  return true;
}
