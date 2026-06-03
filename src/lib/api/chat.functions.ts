import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildChatMessages,
  buildGreetingMessage,
} from "../spark-messages";
import { chatWithSparkHttp } from "../server/spark-http.server";
import {
  detectObjectsInImage,
  formatDetectionsForPrompt,
} from "../server/yolo-detect.server";
import { buildSofiaYoloImageUserPrompt } from "../sofia-persona";

const historyItem = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  imageDataUrl: z.string().optional(),
});

const memorySchema = z.object({
  id: z.string(),
  type: z.enum(["fact", "event", "learning"]),
  category: z.string(),
  content: z.string(),
  originalQuote: z.string(),
  timestamp: z.number(),
  importance: z.number(),
  lastUsed: z.number().nullable().optional(),
  reminderDate: z.string().optional(),
});

const examTopicSchema = z
  .object({
    id: z.string(),
    exam: z.enum(["IELTS", "TOEFL"]),
    part: z.enum(["part1", "part2", "independent"]),
    title: z.string(),
    titleZh: z.string().optional(),
    cues: z.array(z.string()).optional(),
    questions: z.array(z.string()).optional(),
    followUps: z.array(z.string()).optional(),
  })
  .optional()
  .nullable();

function toTextHistory(
  messages: { role: "user" | "assistant"; content: string; imageDataUrl?: string }[]
) {
  return messages
    .filter((m) => m.content !== "(conversation start)")
    .map(({ role, content, imageDataUrl }) => ({
      role,
      content: imageDataUrl
        ? content.trim() && content !== "📷 Photo"
          ? `[Shared a photo] ${content.trim()}`
          : "[User shared a photo]"
        : content,
    }));
}

export const sparkChat = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      text: z.string().optional(),
      imageDataUrl: z.string().optional(),
      messages: z.array(historyItem).default([]),
      targetLanguage: z.enum([
        "English",
        "Spanish",
        "French",
        "Japanese",
        "Chinese",
      ]),
      persona: z.enum([
        "lively_friend",
        "humorous_lover",
        "professional_colleague",
      ]),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      learningGoals: z.array(z.string()).default([]),
      memories: z.array(memorySchema).default([]),
      isGreeting: z.boolean().optional(),
      examTopic: examTopicSchema,
    })
  )
  .handler(async ({ data }) => {
    const {
      text,
      imageDataUrl,
      messages,
      targetLanguage,
      persona,
      level,
      learningGoals,
      memories,
      isGreeting,
      examTopic,
    } = data;

    const promptCtx = { learningGoals, memories };

    if (imageDataUrl) {
      const detections = await detectObjectsInImage(imageDataUrl);
      const userMessage = buildSofiaYoloImageUserPrompt({
        level,
        detectedObjects: formatDetectionsForPrompt(detections),
        caption: text?.trim(),
        memories,
      });
      const sparkMessages = buildChatMessages(
        [...toTextHistory(messages), { role: "user", content: userMessage }],
        targetLanguage,
        persona,
        level,
        examTopic,
        promptCtx
      );
      const reply = await chatWithSparkHttp(sparkMessages);
      return { reply };
    }

    let sparkMessages;
    if (isGreeting) {
      sparkMessages = buildGreetingMessage(
        targetLanguage,
        persona,
        level,
        examTopic,
        promptCtx
      );
    } else if (text?.trim()) {
      sparkMessages = buildChatMessages(
        [...toTextHistory(messages), { role: "user", content: text.trim() }],
        targetLanguage,
        persona,
        level,
        examTopic,
        promptCtx
      );
    } else if (messages.length > 0) {
      sparkMessages = buildChatMessages(
        toTextHistory(messages),
        targetLanguage,
        persona,
        level,
        examTopic,
        promptCtx
      );
    } else {
      throw new Error("Missing conversation content");
    }

    const reply = await chatWithSparkHttp(sparkMessages);
    return { reply };
  });
