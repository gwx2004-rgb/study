import { useEffect, useRef } from "react";
import { generateProactiveMessage } from "./api/proactive.functions";
import { getSessionExamTopic } from "./exam-context";
import { getRelevantMemories } from "./memory-store";
import {
  effectiveDifficulty,
  getProfile,
  type UserProfile,
} from "./user-store";

const INTERVAL_MS = 5 * 60 * 1000;
const TRIGGER_CHANCE = 0.2;

function buildProactiveContext(
  profile: UserProfile,
  messages: { role: string; text?: string }[],
  speakingPracticeActive: boolean
): string {
  const goals = profile.learningGoals.join(", ");
  const exam =
    speakingPracticeActive && getSessionExamTopic()
      ? `Speaking practice: ${getSessionExamTopic()?.title ?? "IELTS/TOEFL"}`
      : "";
  const recent = messages
    .filter((m) => m.text)
    .slice(-4)
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n");
  const memories = getRelevantMemories(6);
  const memoryLine =
    memories.length > 0
      ? `Memories: ${memories.map((m) => m.content).join("; ")}`
      : "";
  return [
    `Learner goals: ${goals}`,
    `Level: ${profile.englishLevel}, baseline: ${profile.originalScore}`,
    exam,
    memoryLine,
    recent ? `Recent chat:\n${recent}` : "Chat just started — invite them to share something.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function useProactiveSofia(params: {
  contactId: string;
  enabled: boolean;
  speakingPracticeActive?: boolean;
  messages: { role: string; text?: string }[];
  isLoading: boolean;
  isSpeaking: boolean;
  onMessage: (text: string) => void;
}) {
  const {
    contactId,
    enabled,
    speakingPracticeActive = false,
    messages,
    isLoading,
    isSpeaking,
    onMessage,
  } = params;
  const awaitingReplyRef = useRef(false);
  const busyRef = useRef(false);
  const messagesRef = useRef(messages);
  const onMessageRef = useRef(onMessage);

  messagesRef.current = messages;
  onMessageRef.current = onMessage;
  busyRef.current = isLoading || isSpeaking;

  useEffect(() => {
    if (contactId !== "sofia" || !enabled) return;

    const id = setInterval(() => {
      void (async () => {
        if (awaitingReplyRef.current || busyRef.current) return;
        if (Math.random() > TRIGGER_CHANCE) return;

        const profile = getProfile();
        if (!profile) return;

        awaitingReplyRef.current = true;
        busyRef.current = true;

        try {
          const level = effectiveDifficulty(profile);
          const context = buildProactiveContext(
            profile,
            messagesRef.current,
            speakingPracticeActive,
          );
          const { reply } = await generateProactiveMessage({
            data: { context, level },
          });
          if (reply?.trim()) onMessageRef.current(reply.trim());
          else awaitingReplyRef.current = false;
        } catch {
          awaitingReplyRef.current = false;
        } finally {
          busyRef.current = false;
        }
      })();
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [contactId, enabled, speakingPracticeActive]);

  return {
    notifyUserReplied() {
      awaitingReplyRef.current = false;
    },
  };
}
