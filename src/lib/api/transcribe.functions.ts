import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { transcribePcmOnServer } from "../server/iat-server.server";

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      pcm: z.string().min(1),
      language: z.string().default("English"),
    })
  )
  .handler(async ({ data }) => {
    const pcm = new Uint8Array(Buffer.from(data.pcm, "base64"));
    if (pcm.length < 3200) {
      throw new Error("Recording too short — please speak a bit longer");
    }
    const text = await transcribePcmOnServer(pcm, data.language);
    return { text };
  });
