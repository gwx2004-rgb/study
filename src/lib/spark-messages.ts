import type { LanguageLevel, Persona, TargetLanguage } from "./chat-types";
import type { ExamTopic } from "./exam-topics";
import type { Memory } from "./memory-types";
import {
  buildSofiaGreetingUserPrompt,
  buildSofiaSystemPrompt,
} from "./sofia-persona";

export type HttpChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type HttpChatContent = string | HttpChatContentPart[];

export interface HttpChatMessage {
  role: "system" | "user" | "assistant";
  content: HttpChatContent;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
}

export interface SofiaPromptContext {
  level: LanguageLevel;
  learningGoals: string[];
  memories?: Memory[];
  examTopic?: ExamTopic | null;
}

function systemPrompt(
  _targetLanguage: TargetLanguage,
  _persona: Persona,
  ctx: SofiaPromptContext
): string {
  return buildSofiaSystemPrompt({
    level: ctx.level,
    learningGoals: ctx.learningGoals,
    memories: ctx.memories,
    examTopic: ctx.examTopic,
  });
}

function toTextOnlyContent(item: ChatHistoryItem): string {
  if (item.imageDataUrl) {
    const text = item.content.trim();
    if (text && text !== "📷 Photo") return `[Shared a photo] ${text}`;
    return "[User shared a photo]";
  }
  return item.content;
}

export function buildGreetingMessage(
  _targetLanguage: TargetLanguage,
  persona: Persona,
  level: LanguageLevel,
  examTopic?: ExamTopic | null,
  ctx?: Partial<SofiaPromptContext>
): HttpChatMessage[] {
  const promptCtx: SofiaPromptContext = {
    level,
    learningGoals: ctx?.learningGoals ?? [],
    memories: ctx?.memories ?? [],
    examTopic,
  };
  return [
    {
      role: "system",
      content: systemPrompt("English", persona, promptCtx),
    },
    {
      role: "user",
      content: buildSofiaGreetingUserPrompt(examTopic),
    },
  ];
}

export function buildChatMessages(
  history: ChatHistoryItem[],
  targetLanguage: TargetLanguage,
  persona: Persona,
  level: LanguageLevel,
  examTopic?: ExamTopic | null,
  ctx?: Partial<SofiaPromptContext>
): HttpChatMessage[] {
  const visible = history.filter(
    (m) => m.content !== "(conversation start)" && (m.content.trim() || m.imageDataUrl)
  );

  const promptCtx: SofiaPromptContext = {
    level,
    learningGoals: ctx?.learningGoals ?? [],
    memories: ctx?.memories ?? [],
    examTopic,
  };

  return [
    {
      role: "system",
      content: systemPrompt(targetLanguage, persona, promptCtx),
    },
    ...visible.map((m) => ({
      role: m.role,
      content: toTextOnlyContent(m),
    })),
  ];
}
