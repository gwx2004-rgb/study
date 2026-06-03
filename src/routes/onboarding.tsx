import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  type AgeGroup,
  type CEFR,
  type ExamKind,
  type Gender,
  type UserProfile,
  getSession,
  saveProfile,
} from "@/lib/user-store";
import { LEARNING_GOALS } from "@/lib/learning-goals";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Your profile · Fluento" }],
  }),
  component: Onboarding,
});

const AGE_OPTIONS: { v: AgeGroup; label: string }[] = [
  { v: "under18", label: "Under 18" },
  { v: "18-25", label: "18–25" },
  { v: "26-35", label: "26–35" },
  { v: "36+", label: "36+" },
];

const GENDER_OPTIONS: { v: Gender; label: string }[] = [
  { v: "female", label: "Female" },
  { v: "male", label: "Male" },
  { v: "na", label: "Prefer not to say" },
];

const EXAM_OPTIONS: { v: ExamKind; label: string }[] = [
  { v: "TOEFL", label: "TOEFL" },
  { v: "IELTS", label: "IELTS" },
  { v: "CET-4", label: "CET-4" },
  { v: "CET-6", label: "CET-6" },
  { v: "TEM-4", label: "TEM-4" },
  { v: "TEM-8", label: "TEM-8" },
  { v: "GRE", label: "GRE" },
];

const GOALS = [...LEARNING_GOALS];

const QUICK_QUESTIONS = [
  {
    q: "I ___ to the park yesterday.",
    options: ["go", "went", "going", "gone"],
    a: 1,
  },
  {
    q: "She ___ coffee every morning.",
    options: ["drink", "drinks", "drinking", "drank"],
    a: 1,
  },
  {
    q: "If I ___ rich, I would travel the world.",
    options: ["am", "was", "were", "be"],
    a: 2,
  },
  {
    q: "The book ___ written by a famous author.",
    options: ["is", "was", "were", "be"],
    a: 1,
  },
  {
    q: "By the time we arrived, the movie ___ already started.",
    options: ["has", "had", "have", "was"],
    a: 1,
  },
];

function scoreToLevel(correct: number): CEFR {
  if (correct <= 1) return "beginner";
  if (correct <= 3) return "intermediate";
  return "advanced";
}

function examToLevel(exam: ExamKind, detail?: string): CEFR {
  switch (exam) {
    case "CET-4":
      return "intermediate";
    case "CET-6":
    case "TEM-4":
      return "intermediate";
    case "TEM-8":
    case "GRE":
      return "advanced";
    case "TOEFL": {
      const n = Number(detail);
      if (!Number.isFinite(n)) return "intermediate";
      if (n >= 90) return "advanced";
      if (n >= 60) return "intermediate";
      return "beginner";
    }
    case "IELTS": {
      const n = Number(detail);
      if (!Number.isFinite(n)) return "intermediate";
      if (n >= 6.5) return "advanced";
      if (n >= 5) return "intermediate";
      return "beginner";
    }
    default:
      return "intermediate";
  }
}

function labelOfLevel(l: CEFR) {
  return l === "beginner" ? "Beginner" : l === "intermediate" ? "Intermediate" : "Advanced";
}

function newUserId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function Onboarding() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => getSession()?.username ?? "");
  const [age, setAge] = useState<AgeGroup>("18-25");
  const [gender, setGender] = useState<Gender>("female");

  const [path, setPath] = useState<"exam" | "test">("exam");
  const [exam, setExam] = useState<ExamKind>("CET-4");
  const [examDetail, setExamDetail] = useState("");

  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState<number[]>(Array(QUICK_QUESTIONS.length).fill(-1));
  const [testLevel, setTestLevel] = useState<CEFR | null>(null);

  const [goals, setGoals] = useState<string[]>([GOALS[0]]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/login", replace: true });
      return;
    }
    setUsername(s.username);
  }, [navigate]);

  function toggleGoal(g: string) {
    setGoals((prev) => {
      if (prev.includes(g)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== g);
      }
      return [...prev, g];
    });
  }

  function switchPath(next: "exam" | "test") {
    setPath(next);
    setSaveError(null);
    if (next === "exam") {
      setShowTest(false);
    }
  }

  function submitTest() {
    const correct = answers.reduce(
      (sum, a, i) => sum + (a === QUICK_QUESTIONS[i].a ? 1 : 0),
      0,
    );
    setTestLevel(scoreToLevel(correct));
    setSaveError(null);
  }

  function handleSave() {
    if (saving) return;

    const session = getSession();
    if (!session?.username?.trim()) {
      setSaveError("Session expired. Please sign in again.");
      return;
    }

    if (goals.length === 0) {
      setSaveError("Select at least one learning goal.");
      return;
    }

    if (path === "test" && !testLevel) {
      setSaveError("Complete the quick assessment, or switch to exam scores.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const level: CEFR =
        path === "test" && testLevel ? testLevel : examToLevel(exam, examDetail);
      const profile: UserProfile = {
        userId: newUserId(),
        username: session.username.trim(),
        ageGroup: age,
        gender,
        englishLevel: level,
        originalScore: path === "test" ? "QUICK_TEST" : exam,
        originalScoreDetail: path === "test" ? `quick_test:${testLevel}` : examDetail,
        learningGoals: goals,
        customDifficulty: "auto",
        createdAt: Date.now(),
      };
      saveProfile(profile);
      navigate({ to: "/", replace: true });
    } catch (err) {
      console.error(err);
      setSaveError(
        err instanceof Error ? err.message : "Could not save. Check that local storage is enabled."
      );
      setSaving(false);
    }
  }

  const canSave =
    !saving &&
    goals.length > 0 &&
    (path === "exam" ? true : testLevel !== null);

  const disabledReason =
    saving
      ? null
      : goals.length === 0
        ? "Select at least one learning goal"
        : path === "test" && testLevel === null
          ? "Complete the quick assessment, or switch to exam scores"
          : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-md mx-auto w-full px-5 pt-6 pb-32 space-y-4">
        <header className="pb-2">
          <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Help us personalize your experience
          </p>
        </header>

        <Section title="Age group">
          <div className="grid grid-cols-2 gap-2">
            {AGE_OPTIONS.map((o) => (
              <Chip key={o.v} active={age === o.v} onClick={() => setAge(o.v)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Gender">
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((o) => (
              <Chip
                key={o.v}
                active={gender === o.v}
                onClick={() => setGender(o.v)}
                className={o.v === "na" ? "col-span-2" : undefined}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="English level">
          <div className="flex rounded-full bg-secondary p-1 mb-4">
            <button
              type="button"
              onClick={() => switchPath("exam")}
              className={`flex-1 py-2 text-sm rounded-full transition ${
                path === "exam" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Exam score
            </button>
            <button
              type="button"
              onClick={() => switchPath("test")}
              className={`flex-1 py-2 text-sm rounded-full transition ${
                path === "test" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Quick test
            </button>
          </div>

          {path === "exam" ? (
            <div className="space-y-3">
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value as ExamKind)}
                className="w-full px-4 py-3 rounded-xl bg-secondary outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                {EXAM_OPTIONS.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
              {(exam === "TOEFL" || exam === "IELTS") && (
                <input
                  type="text"
                  value={examDetail}
                  onChange={(e) => setExamDetail(e.target.value)}
                  placeholder={exam === "TOEFL" ? "Overall score (e.g. 95)" : "Overall score (e.g. 6.5)"}
                  className="w-full px-4 py-3 rounded-xl bg-secondary outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Estimated level:{" "}
                <span className="font-medium text-foreground">
                  {labelOfLevel(examToLevel(exam, examDetail))}
                </span>
              </p>
            </div>
          ) : (
            <div>
              {!showTest && testLevel === null && (
                <button
                  type="button"
                  onClick={() => setShowTest(true)}
                  className="w-full py-3 rounded-2xl bg-secondary text-foreground font-medium hover:bg-accent transition text-sm"
                >
                  Start 5-question assessment
                </button>
              )}
              {showTest && testLevel === null && (
                <div className="space-y-4">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <div key={i}>
                      <p className="text-sm mb-2">
                        {i + 1}. {q.q}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => {
                              const next = [...answers];
                              next[i] = oi;
                              setAnswers(next);
                            }}
                            className={`py-2 px-3 text-sm rounded-xl border transition ${
                              answers[i] === oi
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={answers.some((a) => a < 0)}
                    onClick={submitTest}
                    className="w-full py-3 rounded-2xl bg-primary text-primary-foreground disabled:opacity-40 text-sm font-medium"
                  >
                    Submit assessment
                  </button>
                </div>
              )}
              {testLevel !== null && (
                <div className="text-sm">
                  Result:{" "}
                  <span className="font-semibold text-foreground">{labelOfLevel(testLevel)}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["beginner", "intermediate", "advanced"] as CEFR[]).map((lv) => (
                      <Chip
                        key={lv}
                        active={testLevel === lv}
                        onClick={() => setTestLevel(lv)}
                      >
                        {labelOfLevel(lv)}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>

        <Section title="Learning goals">
          <p className="text-xs text-muted-foreground mb-3">Select at least one</p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip key={g} active={goals.includes(g)} onClick={() => toggleGoal(g)}>
                {g}
              </Chip>
            ))}
          </div>
        </Section>
      </div>

      <div
        className="fixed bottom-0 inset-x-0 px-5 py-4 bg-background/95 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <div className="max-w-md mx-auto space-y-2">
          {saveError && (
            <p className="text-xs text-center text-destructive">{saveError}</p>
          )}
          {!saveError && disabledReason && (
            <p className="text-xs text-center text-muted-foreground">{disabledReason}</p>
          )}
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
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
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3.5 text-sm rounded-full border transition inline-flex items-center justify-center ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground/70 border-border hover:bg-secondary"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
