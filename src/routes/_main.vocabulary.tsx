import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Star } from "lucide-react";
import {
  fetchWeeklyWeakVocabulary,
  type VocabularyDisplayEntry,
} from "@/lib/vocabulary-client";
import {
  isWordSaved,
  saveToWordbook,
  removeFromWordbook,
} from "@/lib/wordbook-store";

export const Route = createFileRoute("/_main/vocabulary")({
  head: () => ({ meta: [{ title: "Weekly vocabulary" }] }),
  component: VocabularyPage,
});

function VocabularyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<VocabularyDisplayEntry[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const { entries: next } = await fetchWeeklyWeakVocabulary();
      setEntries(next);
      setSavedKeys(
        new Set(next.filter((e) => isWordSaved(e.word)).map((e) => e.word.toLowerCase()))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load vocabulary");
    } finally {
      setLoading(false);
    }
  }

  function toggleSave(entry: VocabularyDisplayEntry) {
    const key = entry.word.toLowerCase();
    if (savedKeys.has(key)) {
      removeFromWordbook(entry.word);
      setSavedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      return;
    }

    saveToWordbook({
      word: entry.word,
      meaning: entry.meaning ?? entry.reason,
      example: entry.example,
      corrected: entry.corrected,
      reason: entry.reason,
    });
    setSavedKeys((prev) => new Set(prev).add(key));
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-8">
      <header className="flex items-center gap-2 mb-5">
        <Link
          to="/assessment"
          className="h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition"
        >
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Weekly vocabulary</h1>
          <p className="text-xs text-muted-foreground">Words & phrases from the last 7 days</p>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-sm">Analyzing your chats…</p>
        </div>
      ) : error ? (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium"
          >
            Try again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-16 px-4">
          No weak vocabulary flagged this week. Keep chatting with Sofia!
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const saved = savedKeys.has(entry.word.toLowerCase());
            return (
              <li
                key={entry.word}
                className="rounded-2xl bg-card p-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[16px]">{entry.word}</div>
                    {entry.meaning ? (
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        {entry.meaning}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1.5">{entry.reason}</p>
                    )}
                    {entry.corrected && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium text-foreground/80">Usage: </span>
                        {entry.corrected}
                      </p>
                    )}
                    {entry.example && (
                      <p className="text-xs text-muted-foreground/80 mt-1.5 italic">
                        e.g. {entry.example}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSave(entry)}
                    className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition ${
                      saved
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}
                    aria-label={saved ? "Remove from word book" : "Save to word book"}
                  >
                    <Star size={16} fill={saved ? "currentColor" : "none"} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
