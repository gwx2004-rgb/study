import { generateProgressReport } from "./api/progress-report.functions";
import {
  formatStatsForPrompt,
  parseProgressReport,
  type ProgressReport,
} from "./progress-report";
import { analyzeSession } from "./analysis";
import type { UserProfile } from "./user-store";
import {
  getSpeakingSession,
  saveSessionReport,
  type SpeakingPracticeSession,
} from "./speaking-session-store";

export async function fetchSessionProgressReport(
  sessionId: string,
  profile: UserProfile,
  force = false
): Promise<ProgressReport> {
  const session = getSpeakingSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  if (!force && session.report) {
    return session.report;
  }

  const stats = analyzeSession(session.messages, session.startedAt);
  const recentSnippets = session.messages
    .filter((m) => m.role === "user" && m.content !== "(conversation start)")
    .slice(-8)
    .map((m) => m.content);

  const statsContext = formatStatsForPrompt(stats, profile, recentSnippets, {
    speakingExam: session.exam,
    speakingPart: session.examPart,
    speakingTopic: session.topicTitle,
  });

  const { raw } = await generateProgressReport({ data: { statsContext } });
  const report = parseProgressReport(raw);
  saveSessionReport(sessionId, report);
  return report;
}
