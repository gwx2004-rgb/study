import type { ChatMessage, SessionStats } from "./chat-types";
import { analyzeSession } from "./analysis";
import { CHAT_CONTACT_IDS } from "./contacts";
import { clearSessionExamTopic } from "./exam-context";
import { getActiveUsername, normalizeUsername } from "./user-store";

export type ChatMode = "casual" | "speaking";

const LEGACY_MESSAGES_KEY = "ial.chat.messages";
const LEGACY_SESSION_START_KEY = "ial.chat.sessionStart";
const LEGACY_STATS_KEY = "ial.chat.stats";

function chatPrefix(username: string) {
  return `ial.chat.v1.${normalizeUsername(username)}`;
}

function messagesKey(username: string, contactId: string, mode: ChatMode) {
  const suffix = mode === "speaking" ? ".messages.speaking" : ".messages";
  return `${chatPrefix(username)}.${contactId}${suffix}`;
}

function legacyMessagesKey(username: string, mode: ChatMode) {
  return mode === "casual"
    ? `${chatPrefix(username)}.messages`
    : `${chatPrefix(username)}.messages.speaking`;
}

function sessionStartKey(username: string, contactId: string, mode: ChatMode) {
  const suffix = mode === "speaking" ? ".sessionStart.speaking" : ".sessionStart";
  return `${chatPrefix(username)}.${contactId}${suffix}`;
}

function legacySessionStartKey(username: string, mode: ChatMode) {
  return mode === "casual"
    ? `${chatPrefix(username)}.sessionStart`
    : `${chatPrefix(username)}.sessionStart.speaking`;
}

function statsKey(username: string, contactId: string, mode: ChatMode) {
  const suffix = mode === "speaking" ? ".stats.speaking" : ".stats";
  return `${chatPrefix(username)}.${contactId}${suffix}`;
}

function legacyStatsKey(username: string, mode: ChatMode) {
  return mode === "casual"
    ? `${chatPrefix(username)}.stats`
    : `${chatPrefix(username)}.stats.speaking`;
}

function requireUsername(): string | null {
  return getActiveUsername();
}

function migrateLegacyChat(username: string, contactId: string) {
  if (contactId !== "sofia") return;
  try {
    const legacyMessages = localStorage.getItem(LEGACY_MESSAGES_KEY);
    const scopedCasual = messagesKey(username, contactId, "casual");
    if (legacyMessages && !localStorage.getItem(scopedCasual)) {
      localStorage.setItem(scopedCasual, legacyMessages);
      localStorage.removeItem(LEGACY_MESSAGES_KEY);
    }
    const oldCasual = legacyMessagesKey(username, "casual");
    if (localStorage.getItem(oldCasual) && !localStorage.getItem(scopedCasual)) {
      localStorage.setItem(scopedCasual, localStorage.getItem(oldCasual)!);
      localStorage.removeItem(oldCasual);
    }
    const oldSpeaking = legacyMessagesKey(username, "speaking");
    const scopedSpeaking = messagesKey(username, contactId, "speaking");
    if (localStorage.getItem(oldSpeaking) && !localStorage.getItem(scopedSpeaking)) {
      localStorage.setItem(scopedSpeaking, localStorage.getItem(oldSpeaking)!);
      localStorage.removeItem(oldSpeaking);
    }

    for (const mode of ["casual", "speaking"] as const) {
      const scopedStart = sessionStartKey(username, contactId, mode);
      const oldStart = legacySessionStartKey(username, mode);
      const legacyStart = mode === "casual" ? LEGACY_SESSION_START_KEY : null;
      if (legacyStart) {
        const v = localStorage.getItem(legacyStart);
        if (v && !localStorage.getItem(scopedStart)) {
          localStorage.setItem(scopedStart, v);
          localStorage.removeItem(legacyStart);
        }
      }
      if (localStorage.getItem(oldStart) && !localStorage.getItem(scopedStart)) {
        localStorage.setItem(scopedStart, localStorage.getItem(oldStart)!);
        localStorage.removeItem(oldStart);
      }

      const scopedStats = statsKey(username, contactId, mode);
      const oldStats = legacyStatsKey(username, mode);
      const legacyStats = mode === "casual" ? LEGACY_STATS_KEY : null;
      if (legacyStats) {
        const v = localStorage.getItem(legacyStats);
        if (v && !localStorage.getItem(scopedStats)) {
          localStorage.setItem(scopedStats, v);
          localStorage.removeItem(legacyStats);
        }
      }
      if (localStorage.getItem(oldStats) && !localStorage.getItem(scopedStats)) {
        localStorage.setItem(scopedStats, localStorage.getItem(oldStats)!);
        localStorage.removeItem(oldStats);
      }
    }
  } catch {
    // ignore migration errors
  }
}

export function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredMessages(
  contactId: string = "sofia",
  mode: ChatMode = "casual"
): ChatMessage[] {
  if (!isBrowser()) return [];
  const username = requireUsername();
  if (!username) return [];
  migrateLegacyChat(username, contactId);
  try {
    const raw = localStorage.getItem(messagesKey(username, contactId, mode));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAllStoredMessages(): ChatMessage[] {
  const chunks: ChatMessage[] = [];
  for (const contactId of CHAT_CONTACT_IDS) {
    chunks.push(...getStoredMessages(contactId, "casual"));
    chunks.push(...getStoredMessages(contactId, "speaking"));
  }
  return chunks.sort((a, b) => a.timestamp - b.timestamp);
}

export function saveStoredMessages(
  messages: ChatMessage[],
  contactId: string,
  mode: ChatMode = "casual"
) {
  if (!isBrowser()) return;
  const username = requireUsername();
  if (!username) return;
  localStorage.setItem(messagesKey(username, contactId, mode), JSON.stringify(messages));
}

export function getSessionStart(
  contactId: string = "sofia",
  mode: ChatMode = "casual"
): number {
  if (!isBrowser()) return Date.now();
  const username = requireUsername();
  if (!username) return Date.now();
  migrateLegacyChat(username, contactId);
  const raw = localStorage.getItem(sessionStartKey(username, contactId, mode));
  return raw ? Number(raw) : Date.now();
}

export function setSessionStart(
  ts: number,
  contactId: string,
  mode: ChatMode = "casual"
) {
  if (!isBrowser()) return;
  const username = requireUsername();
  if (!username) return;
  localStorage.setItem(sessionStartKey(username, contactId, mode), String(ts));
}

export function getStoredStats(
  contactId: string = "sofia",
  mode: ChatMode = "casual"
): SessionStats | null {
  if (!isBrowser()) return null;
  const username = requireUsername();
  if (!username) return null;
  migrateLegacyChat(username, contactId);
  try {
    const raw = localStorage.getItem(statsKey(username, contactId, mode));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCombinedStats(): SessionStats | null {
  const all = getAllStoredMessages();
  if (all.length === 0) return null;
  let sessionStart = Date.now();
  for (const contactId of CHAT_CONTACT_IDS) {
    sessionStart = Math.min(sessionStart, getSessionStart(contactId, "casual"));
    sessionStart = Math.min(sessionStart, getSessionStart(contactId, "speaking"));
  }
  return analyzeSession(all, sessionStart);
}

export function refreshStats(
  messages: ChatMessage[],
  contactId: string,
  mode: ChatMode = "casual"
) {
  if (!isBrowser()) return null;
  const username = requireUsername();
  if (!username) return null;
  const stats = analyzeSession(messages, getSessionStart(contactId, mode));
  localStorage.setItem(statsKey(username, contactId, mode), JSON.stringify(stats));
  return stats;
}

export function clearContactChat(contactId: string) {
  if (!isBrowser()) return;
  const username = requireUsername();
  if (!username) return;
  for (const mode of ["casual", "speaking"] as const) {
    localStorage.removeItem(messagesKey(username, contactId, mode));
    localStorage.removeItem(sessionStartKey(username, contactId, mode));
    localStorage.removeItem(statsKey(username, contactId, mode));
  }
  if (contactId === "sofia") {
    clearSessionExamTopic();
  }
}

export function clearChatData() {
  for (const contactId of CHAT_CONTACT_IDS) {
    clearContactChat(contactId);
  }
}
