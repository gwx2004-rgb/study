import type { ChatMessage } from "./chat-types";
import type { ProgressReport } from "./progress-report";
import { getActiveUsername, normalizeUsername } from "./user-store";

export interface SpeakingPracticeSession {
  id: string;
  contactId: string;
  exam: "IELTS" | "TOEFL";
  examPart: "part1" | "part2" | "independent";
  topicId: string;
  topicTitle: string;
  startedAt: number;
  endedAt: number;
  messageCount: number;
  userMessageCount: number;
  messages: ChatMessage[];
  report?: ProgressReport;
}

function storageKey(username: string) {
  return `ial.speaking-sessions.v1.${normalizeUsername(username)}`;
}

function readAll(): SpeakingPracticeSession[] {
  if (typeof window === "undefined") return [];
  const username = getActiveUsername();
  if (!username) return [];
  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? (JSON.parse(raw) as SpeakingPracticeSession[]) : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: SpeakingPracticeSession[]) {
  if (typeof window === "undefined") return;
  const username = getActiveUsername();
  if (!username) return;
  localStorage.setItem(storageKey(username), JSON.stringify(sessions));
}

export function getSpeakingSessions(): SpeakingPracticeSession[] {
  return readAll().sort((a, b) => b.endedAt - a.endedAt);
}

export function getSpeakingSession(id: string): SpeakingPracticeSession | undefined {
  return readAll().find((s) => s.id === id);
}

export function addSpeakingSession(
  session: Omit<SpeakingPracticeSession, "id">
): SpeakingPracticeSession {
  const entry: SpeakingPracticeSession = {
    ...session,
    id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  const all = readAll();
  all.unshift(entry);
  writeAll(all.slice(0, 100));
  return entry;
}

export function saveSessionReport(sessionId: string, report: ProgressReport) {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === sessionId);
  if (idx < 0) return;
  all[idx] = { ...all[idx]!, report };
  writeAll(all);
}

export function deleteSpeakingSession(sessionId: string): boolean {
  const all = readAll();
  const next = all.filter((s) => s.id !== sessionId);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}

export function formatSessionLabel(session: SpeakingPracticeSession): string {
  if (session.examPart === "part1") {
    return `IELTS Part 1 · ${session.topicTitle}`;
  }
  if (session.examPart === "part2") {
    return `IELTS Part 2 · ${session.topicTitle}`;
  }
  return `TOEFL · ${session.topicTitle}`;
}

export function formatSessionDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const datePart = sameDay
    ? "Today"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}
