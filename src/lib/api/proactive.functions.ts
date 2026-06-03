import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildSofiaProactiveSystemPrompt } from "../sofia-persona";
import { chatWithSparkHttp } from "../server/spark-http.server";

export const generateProactiveMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      context: z.string().min(1),
      level: z.enum(["beginner", "intermediate", "advanced"]),
    })
  )
  .handler(async ({ data }) => {
    const messages = [
      {
        role: "system" as const,
        content: buildSofiaProactiveSystemPrompt(data.level),
      },
      {
        role: "user" as const,
        content: data.context,
      },
    ];

    const reply = await chatWithSparkHttp(messages);
    return { reply: reply.trim() };
  });
