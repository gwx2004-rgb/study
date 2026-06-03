import type { SessionStats } from "./chat-types";
import type { UserProfile } from "./user-store";
import { getActiveUsername, normalizeUsername } from "./user-store";

export interface ProgressReport {
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  vocabularyInsights: string;
  grammarInsights: string;
  speakingNotes: string;
  recommendations: string[];
  generatedAt: number;
}

export interface CachedProgressReport {
  fingerprint: string;
  report: ProgressReport;
}

function reportCacheKey(username: string) {
  return `ial.chat.v1.${normalizeUsername(username)}.progressReport`;
}

export function buildReportFingerprint(
  stats: SessionStats,
  profile: UserProfile,
  messageCount: number,
  lastMessageTs: number
): string {
  const payload = {
    messageCount,
    lastMessageTs,
    userMessages: stats.userMessages,
    totalWords: stats.totalWords,
    fluencyScore: stats.fluencyScore,
    grammarIssueCount: stats.grammarIssues.length,
    oralIssueCount: stats.oralIssues.length,
    topics: stats.topics,
    level: profile.englishLevel,
    goals: profile.learningGoals,
    exam: profile.originalScore,
    difficulty: profile.customDifficulty,
  };
  return JSON.stringify(payload);
}

export function getCachedProgressReport(
  fingerprint: string
): ProgressReport | null {
  if (typeof window === "undefined") return null;
  const username = getActiveUsername();
  if (!username) return null;
  try {
    const raw = localStorage.getItem(reportCacheKey(username));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedProgressReport;
    if (cached.fingerprint !== fingerprint) return null;
    return cached.report;
  } catch {
    return null;
  }
}

export function setCachedProgressReport(
  fingerprint: string,
  report: ProgressReport
) {
  if (typeof window === "undefined") return;
  const username = getActiveUsername();
  if (!username) return;
  const cached: CachedProgressReport = { fingerprint, report };
  localStorage.setItem(reportCacheKey(username), JSON.stringify(cached));
}

export function clearCachedProgressReport() {
  if (typeof window === "undefined") return;
  const username = getActiveUsername();
  if (!username) return;
  localStorage.removeItem(reportCacheKey(username));
}

/** Best-effort parse when model returns markdown or loose JSON */
export function parseProgressReport(raw: string): ProgressReport {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<ProgressReport>;
      return normalizeReport(parsed);
    } catch {
      // fall through
    }
  }
  return {
    summary: trimmed.slice(0, 500) || "Report generated from your session data.",
    strengths: [],
    areasToImprove: [],
    vocabularyInsights: "",
    grammarInsights: "",
    speakingNotes: "",
    recommendations: [],
    generatedAt: Date.now(),
  };
}

function normalizeReport(p: Partial<ProgressReport>): ProgressReport {
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String).filter(Boolean) : [];
  return {
    summary: String(p.summary ?? "").trim() || "Your learning session shows steady engagement.",
    strengths: arr(p.strengths),
    areasToImprove: arr(p.areasToImprove),
    vocabularyInsights: String(p.vocabularyInsights ?? "").trim(),
    grammarInsights: String(p.grammarInsights ?? "").trim(),
    speakingNotes: String(p.speakingNotes ?? "").trim(),
    recommendations: arr(p.recommendations),
    generatedAt: Date.now(),
  };
}

export function formatStatsForPrompt(
  stats: SessionStats,
  profile: UserProfile,
  recentSnippets: string[],
  speaking?: {
    speakingExam: "IELTS" | "TOEFL";
    speakingPart: "part1" | "part2" | "independent";
    speakingTopic: string;
  }
): string {
  const goals = profile.learningGoals.join(", ") || "general fluency";
  const partLabel =
    speaking?.speakingPart === "part1"
      ? "IELTS Part 1"
      : speaking?.speakingPart === "part2"
        ? "IELTS Part 2"
        : speaking?.speakingPart === "independent"
          ? "TOEFL Independent"
          : "";
  return [
    speaking
      ? `Session type: ${speaking.speakingExam} speaking practice — ${partLabel} — topic: "${speaking.speakingTopic}"`
      : "",
    `Learner: ${profile.username}, CEFR ~${profile.englishLevel}, difficulty pref: ${profile.customDifficulty}`,
    `Baseline exam/score: ${profile.originalScore}${profile.originalScoreDetail ? ` (${profile.originalScoreDetail})` : ""}`,
    `Learning goals: ${goals}`,
    `Session: ${stats.sessionDurationMinutes} min, ${stats.userMessages} user messages (${stats.voiceMessages} voice, ${stats.textMessages} text)`,
    `Words: ${stats.totalWords} total, ${stats.uniqueWords} unique, avg ${stats.avgWordsPerMessage} words/msg, fluency index ${stats.fluencyScore}`,
    `Topics discussed: ${stats.topics.join(", ")}`,
    `Top vocabulary: ${stats.topWords.slice(0, 8).map((w) => `${w.word}(${w.count})`).join(", ") || "n/a"}`,
    `Grammar patterns used: ${stats.grammarPatterns.map((g) => g.pattern).join(", ") || "n/a"}`,
    `Grammar issues (${stats.grammarIssues.length}): ${stats.grammarIssues.slice(0, 5).map((i) => i.category).join(", ") || "none flagged"}`,
    `Oral issues (${stats.oralIssues.length}): ${stats.oralIssues.slice(0, 3).map((i) => i.category).join(", ") || "none"}`,
    `Recast examples: ${stats.recastFeedback.slice(0, 3).map((r) => `"${r.original}" → "${r.corrected}"`).join("; ") || "n/a"}`,
    recentSnippets.length
      ? `Recent user lines: ${recentSnippets.map((s) => `"${s.slice(0, 120)}"`).join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
