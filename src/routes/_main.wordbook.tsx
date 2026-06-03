import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Star } from "lucide-react";
import { getWordbook, removeFromWordbook, type SavedWord } from "@/lib/wordbook-store";

export const Route = createFileRoute("/_main/wordbook")({
  head: () => ({ meta: [{ title: "Word book" }] }),
  component: WordbookPage,
});

function WordbookPage() {
  const [words, setWords] = useState<SavedWord[]>(() => getWordbook());

  useEffect(() => {
    setWords(getWordbook());
  }, []);

  function handleRemove(id: string) {
    removeFromWordbook(id);
    setWords(getWordbook());
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-8">
      <header className="flex items-center gap-2 mb-5">
        <Link
          to="/me"
          className="h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-secondary transition"
        >
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Word book</h1>
          <p className="text-xs text-muted-foreground">
            {words.length} saved {words.length === 1 ? "word" : "words"}
          </p>
        </div>
      </header>

      {words.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-16 px-4">
          No saved words yet. Tap the star on the weekly vocabulary page to collect words
          here.
        </div>
      ) : (
        <ul className="space-y-3">
          {words.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl bg-card p-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[16px]">{entry.word}</div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {entry.meaning}
                  </p>
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
                  onClick={() => handleRemove(entry.id)}
                  className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
                  aria-label="Remove from word book"
                >
                  <Star size={16} fill="currentColor" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
