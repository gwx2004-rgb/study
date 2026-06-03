import { sparkChat } from "./api/chat.functions";
import type { LanguageLevel, Persona, TargetLanguage } from "./chat-types";
import type { ExamTopic } from "./exam-topics";
import type { Memory } from "./memory-types";
import type { ChatHistoryItem } from "./spark-messages";

export async function askSpark(params: {
  text?: string;
  imageDataUrl?: string;
  history: ChatHistoryItem[];
  targetLanguage: TargetLanguage;
  persona: Persona;
  level: LanguageLevel;
  learningGoals?: string[];
  memories?: Memory[];
  isGreeting?: boolean;
  examTopic?: ExamTopic | null;
}): Promise<string> {
  const result = await sparkChat({
    data: {
      text: params.text,
      imageDataUrl: params.imageDataUrl,
      messages: params.history,
      targetLanguage: params.targetLanguage,
      persona: params.persona,
      level: params.level,
      learningGoals: params.learningGoals ?? [],
      memories: params.memories ?? [],
      isGreeting: params.isGreeting,
      examTopic: params.examTopic ?? null,
    },
  });
  return result.reply;
}
