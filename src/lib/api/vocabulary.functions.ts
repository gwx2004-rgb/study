import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatWithSparkHttp } from "../server/spark-http.server";
import type { VocabularyMeaning } from "../vocabulary-weakness";

const itemSchema = z.object({
  phrase: z.string(),
  corrected: z.string().optional(),
  reason: z.string(),
});

export const lookupVocabularyMeanings = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      items: z.array(itemSchema).min(1).max(12),
    })
  )
  .handler(async ({ data }) => {
    const list = data.items
      .map(
        (it, i) =>
          `${i + 1}. "${it.phrase}"${it.corrected ? ` → corrected: "${it.corrected}"` : ""} (${it.reason})`
      )
      .join("\n");

    const messages = [
      {
        role: "system" as const,
        content: `You help English learners understand vocabulary they struggled with.
Respond ONLY with a JSON array (no markdown). Each item:
{"word":"the word or short phrase","meaning":"clear English definition in 1-2 simple sentences","example":"one natural example sentence"}

Focus on the word/phrase given, not grammar lectures. If a corrected form is provided, explain the correct word's meaning.`,
      },
      {
        role: "user" as const,
        content: `Explain these weak vocabulary items for a learner:\n${list}`,
      },
    ];

    const raw = await chatWithSparkHttp(messages);
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned) as unknown;
      if (!Array.isArray(parsed)) return { meanings: [] as VocabularyMeaning[] };
      return {
        meanings: parsed
          .filter(
            (x): x is VocabularyMeaning =>
              typeof x === "object" &&
              x !== null &&
              typeof (x as VocabularyMeaning).word === "string" &&
              typeof (x as VocabularyMeaning).meaning === "string"
          )
          .map((x) => ({
            word: x.word.trim(),
            meaning: x.meaning.trim(),
            example: x.example?.trim(),
          })),
      };
    } catch {
      return { meanings: [] as VocabularyMeaning[] };
    }
  });
