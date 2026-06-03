import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { synthesizeMp3 } from "../server/tts-http.server";

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      text: z.string().min(1),
      language: z.string().default("English"),
    })
  )
  .handler(async ({ data }) => {
    const mp3 = await synthesizeMp3(data.text, data.language);
    if (mp3.length === 0) throw new Error("Empty TTS audio");
    return { audioBase64: mp3.toString("base64") };
  });
