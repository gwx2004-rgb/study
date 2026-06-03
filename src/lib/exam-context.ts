import type { UserProfile } from "./user-store";
import { IELTS_TOEFL_GOAL } from "./learning-goals";
import { getActiveUsername, normalizeUsername } from "./user-store";
import {
  type ExamTopic,
  examTopicLabel,
  pickRandomExamTopic,
} from "./exam-topics";

const LEGACY_TOPIC_KEY = "ial.chat.examTopic";

function topicKey(username: string) {
  return `ial.chat.v1.${normalizeUsername(username)}.examTopic`;
}

function migrateLegacyTopic(username: string) {
  try {
    const legacy = localStorage.getItem(LEGACY_TOPIC_KEY);
    if (legacy && !localStorage.getItem(topicKey(username))) {
      localStorage.setItem(topicKey(username), legacy);
      localStorage.removeItem(LEGACY_TOPIC_KEY);
    }
  } catch {
    // ignore
  }
}

/** 是否在 onboarding 选择了 IELTS/TOEFL 口语备考目标 */
export function wantsIeltsToeflPrep(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return profile.learningGoals.includes(IELTS_TOEFL_GOAL);
}

/** 抽题时优先依据考试成绩，否则默认 IELTS 题库 */
export function examKindForTopics(profile: UserProfile): "IELTS" | "TOEFL" {
  if (profile.originalScore === "TOEFL") return "TOEFL";
  return "IELTS";
}

export function getSessionExamTopic(): ExamTopic | null {
  if (typeof window === "undefined") return null;
  const username = getActiveUsername();
  if (!username) return null;
  migrateLegacyTopic(username);
  try {
    const raw = localStorage.getItem(topicKey(username));
    return raw ? (JSON.parse(raw) as ExamTopic) : null;
  } catch {
    return null;
  }
}

export function setSessionExamTopic(topic: ExamTopic) {
  if (typeof window === "undefined") return;
  const username = getActiveUsername();
  if (!username) return;
  localStorage.setItem(topicKey(username), JSON.stringify(topic));
}

export function clearSessionExamTopic() {
  if (typeof window === "undefined") return;
  const username = getActiveUsername();
  if (!username) return;
  localStorage.removeItem(topicKey(username));
}

export function prepareExamTopicForSession(profile: UserProfile): ExamTopic | null {
  if (!wantsIeltsToeflPrep(profile)) return null;
  const topic = pickRandomExamTopic(examKindForTopics(profile));
  setSessionExamTopic(topic);
  return topic;
}

export function getOrCreateSessionExamTopic(profile: UserProfile): ExamTopic | null {
  if (!wantsIeltsToeflPrep(profile)) return null;
  return getSessionExamTopic() ?? prepareExamTopicForSession(profile);
}

export { examTopicLabel, type ExamTopic };
