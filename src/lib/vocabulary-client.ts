import { getAllStoredMessages } from "./chat-store";
import { lookupVocabularyMeanings } from "./api/vocabulary.functions";
import {
  collectWeeklyWeakVocabulary,
  type VocabularyMeaning,
  type WeakVocabularyItem,
} from "./vocabulary-weakness";

export interface VocabularyDisplayEntry {
  word: string;
  meaning?: string;
  example?: string;
  corrected?: string;
  reason: string;
}

function mergeEntries(
  items: WeakVocabularyItem[],
  meanings: VocabularyMeaning[]
): VocabularyDisplayEntry[] {
  const meaningByWord = new Map(
    meanings.map((m) => [m.word.trim().toLowerCase(), m])
  );

  return items.map((item) => {
    const key = item.phrase.trim().toLowerCase();
    const meaning = meaningByWord.get(key);
    return {
      word: meaning?.word ?? item.phrase,
      meaning: meaning?.meaning,
      example: meaning?.example,
      corrected: item.corrected,
      reason: item.reason,
    };
  });
}

export async function fetchWeeklyWeakVocabulary(): Promise<{
  items: WeakVocabularyItem[];
  entries: VocabularyDisplayEntry[];
}> {
  const messages = getAllStoredMessages();
  const items = collectWeeklyWeakVocabulary(messages);
  if (items.length === 0) {
    return { items: [], entries: [] };
  }

  const { meanings } = await lookupVocabularyMeanings({ data: { items } });
  return { items, entries: mergeEntries(items, meanings) };
}
