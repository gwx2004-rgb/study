import type { ChatMessage, SessionStats } from "./chat-types";
import { analyzeSession } from "./analysis";

export interface WeakVocabularyItem {
  /** Word or short phrase the learner struggled with */
  phrase: string;
  /** Sofia's corrected form, if available */
  corrected?: string;
  /** Why it was flagged */
  reason: string;
}

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getWeekCutoff(): number {
  return Date.now() - WEEK_MS;
}

export function filterMessagesFromLastWeek(messages: ChatMessage[]): ChatMessage[] {
  const cutoff = getWeekCutoff();
  return messages.filter((m) => m.timestamp >= cutoff);
}

export function analyzeWeeklySession(messages: ChatMessage[]): SessionStats {
  const recent = filterMessagesFromLastWeek(messages);
  return analyzeSession(recent, getWeekCutoff());
}

const STOP = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "can", "to", "of", "in", "for", "on",
  "with", "at", "by", "from", "as", "i", "you", "he", "she", "it", "we",
  "they", "me", "my", "your", "his", "her", "our", "their", "this", "that",
  "what", "which", "who", "am", "and", "but", "or", "so", "if", "not", "no",
  "yes", "ok", "okay", "like", "just", "very", "really",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function keyDiffWords(original: string, corrected: string): string[] {
  const orig = new Set(tokenize(original));
  return [...new Set(tokenize(corrected))].filter(
    (w) => !orig.has(w) && !STOP.has(w) && w.length > 2
  );
}

/** Collect vocabulary the learner used incorrectly or imprecisely */
export function collectWeakVocabulary(stats: SessionStats): WeakVocabularyItem[] {
  const items: WeakVocabularyItem[] = [];
  const seen = new Set<string>();

  for (const recast of stats.recastFeedback) {
    const key = recast.original.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    const diffWords = keyDiffWords(recast.original, recast.corrected);
    items.push({
      phrase: diffWords[0] ?? recast.original.slice(0, 48),
      corrected: recast.corrected,
      reason: "Sofia naturally recast your phrasing",
    });
  }

  for (const issue of stats.grammarIssues) {
    if (issue.category !== "同音词" && issue.category !== "冠词") continue;
    const excerpt = issue.excerpt?.trim();
    if (!excerpt || seen.has(excerpt.toLowerCase())) continue;
    seen.add(excerpt.toLowerCase());
    items.push({
      phrase: excerpt,
      corrected: issue.suggestion,
      reason: issue.description,
    });
  }

  // Words used only once — likely new or shaky vocabulary
  const onceWords = stats.topWords.filter((w) => w.count === 1 && w.word.length > 4);
  for (const { word } of onceWords.slice(0, 5)) {
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      phrase: word,
      reason: "Used once — worth reviewing",
    });
  }

  return items.slice(0, 20);
}

/** Weak vocabulary from the last 7 days of chat */
export function collectWeeklyWeakVocabulary(messages: ChatMessage[]): WeakVocabularyItem[] {
  return collectWeakVocabulary(analyzeWeeklySession(messages));
}

export interface VocabularyMeaning {
  word: string;
  meaning: string;
  example?: string;
}
