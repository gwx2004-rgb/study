import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookMarked, ChevronRight, LogOut, User as UserIcon } from "lucide-react";
import {
  type CEFR,
  type DifficultyPref,
  clearSession,
  getProfile,
  updateProfile,
} from "@/lib/user-store";
import { LEARNING_GOALS } from "@/lib/learning-goals";
import { getWordbookCount } from "@/lib/wordbook-store";

export const Route = createFileRoute("/_main/me")({
  head: () => ({ meta: [{ title: "Me" }] }),
  component: MePage,
});

function MePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getProfile());
  const [wordCount, setWordCount] = useState(() => getWordbookCount());

  useEffect(() => {
    setProfile(getProfile());
    setWordCount(getWordbookCount());
  }, []);

  if (!profile) return null;

  function setLevel(lv: CEFR) {
    updateProfile({ englishLevel: lv });
    setProfile(getProfile());
  }
  function setDiff(d: DifficultyPref) {
    updateProfile({ customDifficulty: d });
    setProfile(getProfile());
  }
  function toggleGoal(g: string) {
    if (!profile) return;
    const next = profile.learningGoals.includes(g)
      ? profile.learningGoals.filter((x) => x !== g)
      : [...profile.learningGoals, g];
    updateProfile({ learningGoals: next });
    setProfile(getProfile());
  }
  function logout() {
    clearSession();
    navigate({ to: "/login" });
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 space-y-4">
      <div
        className="bg-card rounded-3xl p-5 flex items-center gap-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center text-white"
          style={{ background: "var(--gradient-avatar)" }}
        >
          <UserIcon size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold truncate">{profile.username}</div>
          <div className="text-xs text-muted-foreground">
            {labelAge(profile.ageGroup)} · {labelGender(profile.gender)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Baseline: {profile.originalScore}
            {profile.originalScoreDetail ? ` (${profile.originalScoreDetail})` : ""}
          </div>
        </div>
      </div>

      <Link
        to="/wordbook"
        className="bg-card rounded-3xl p-4 flex items-center gap-3 hover:bg-secondary transition"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <span className="h-11 w-11 shrink-0 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
          <BookMarked size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px]">Word book</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {wordCount > 0
              ? `${wordCount} saved ${wordCount === 1 ? "word" : "words"}`
              : "Your starred vocabulary"}
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground shrink-0" />
      </Link>

      <Section title="English level">
        <div className="flex gap-2">
          {(["beginner", "intermediate", "advanced"] as CEFR[]).map((lv) => (
            <Chip key={lv} active={profile!.englishLevel === lv} onClick={() => setLevel(lv)}>
              {labelLevel(lv)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Difficulty">
        <div className="flex flex-wrap gap-2">
          {(["auto", "beginner", "intermediate", "advanced"] as DifficultyPref[]).map((d) => (
            <Chip key={d} active={profile!.customDifficulty === d} onClick={() => setDiff(d)}>
              {d === "auto" ? "Auto" : labelLevel(d)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Learning goals">
        <div className="flex flex-wrap gap-2">
          {LEARNING_GOALS.map((g) => (
            <Chip
              key={g}
              active={profile!.learningGoals.includes(g)}
              onClick={() => toggleGoal(g)}
            >
              {g}
            </Chip>
          ))}
        </div>
      </Section>

      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl bg-card text-destructive font-medium flex items-center justify-center gap-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <LogOut size={16} /> Log out
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="font-semibold mb-3 text-[15px]">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 text-sm rounded-full border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground/70 border-border hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function labelLevel(l: CEFR) {
  return l === "beginner" ? "Beginner" : l === "intermediate" ? "Intermediate" : "Advanced";
}
function labelAge(a: string) {
  return (
    { under18: "Under 18", "18-25": "18-25", "26-35": "26-35", "36+": "36+" } as Record<
      string,
      string
    >
  )[a] ?? a;
}
function labelGender(g: string) {
  return ({ female: "Female", male: "Male", na: "Prefer not to say" } as Record<string, string>)[g] ?? g;
}
