import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatWithSparkHttp } from "../server/spark-http.server";

const existingMemorySchema = z.object({
  type: z.enum(["fact", "event", "learning"]),
  content: z.string(),
});

const newMemorySchema = z.object({
  type: z.enum(["fact", "event", "learning"]),
  category: z.string(),
  content: z.string(),
  originalQuote: z.string(),
  importance: z.number().min(0).max(1),
  reminderDate: z.string().optional(),
});

export const extractMemoriesFromMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      message: z.string().min(3),
      existingMemories: z.array(existingMemorySchema).default([]),
    })
  )
  .handler(async ({ data }) => {
    const existingList =
      data.existingMemories.length > 0
        ? data.existingMemories.map((m) => `- [${m.type}] ${m.content}`).join("\n")
        : "(none yet)";

    const messages = [
      {
        role: "system" as const,
        content: `You extract long-term memories from English learners chatting with Sofia (their friend).
Return ONLY a JSON array (no markdown). Each item:
{"type":"fact"|"event"|"learning","category":"short tag","content":"concise memory in English","originalQuote":"exact user words","importance":0.5-1.0,"reminderDate":"YYYY-MM-DD optional for future events"}

Rules:
- Extract 0–2 NEW items max from this message.
- fact: personal info, preferences, pets, job, hobbies
- event: past or future plans, exams, trips
- learning: only if they mention struggling with specific English (not every grammar mistake)
- Skip small talk with nothing memorable.
- Do NOT duplicate existing memories.
- If nothing worth saving, return []`,
      },
      {
        role: "user" as const,
        content: `Existing memories:\n${existingList}\n\nUser message:\n"${data.message}"`,
      },
    ];

    const raw = await chatWithSparkHttp(messages);
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned) as unknown;
      if (!Array.isArray(parsed)) return { memories: [] };
      const memories = parsed
        .map((item) => newMemorySchema.safeParse(item))
        .filter((r) => r.success)
        .map((r) => r.data);
      return { memories };
    } catch {
      return { memories: [] };
    }
  });
