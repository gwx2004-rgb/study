import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatWithSparkHttp } from "../server/spark-http.server";

export const generateProgressReport = createServerFn({ method: "POST" })
  .inputValidator(z.object({ statsContext: z.string().min(1) }))
  .handler(async ({ data }) => {
    const messages = [
      {
        role: "system" as const,
        content: `You are an expert English speaking coach writing a personalized report for ONE IELTS/TOEFL speaking practice session with Sofia (immersive language partner app).

Focus on speaking performance: fluency, coherence, vocabulary range, grammar in spoken answers, and exam-style task completion. If session data mentions a specific IELTS/TOEFL topic, tie feedback to that prompt.

Respond ONLY with valid JSON (no markdown fences) matching this schema:
{
  "summary": "2-3 sentence executive summary",
  "strengths": ["bullet 1", "bullet 2", ...],
  "areasToImprove": ["bullet 1", ...],
  "vocabularyInsights": "1 short paragraph on vocabulary use and growth",
  "grammarInsights": "1 short paragraph on grammar patterns and slips",
  "speakingNotes": "1 short paragraph on speaking/voice practice if relevant",
  "recommendations": ["actionable tip 1", "tip 2", ...]
}

Be specific to the data provided. Reference their goals and exam prep when relevant. Tone: professional, encouraging, evidence-based. Use English for the report body.`,
      },
      {
        role: "user" as const,
        content: `Generate the progress report from this session data:\n\n${data.statsContext}`,
      },
    ];

    const raw = await chatWithSparkHttp(messages);
    return { raw };
  });
