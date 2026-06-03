import { transcribeAudio } from "./api/transcribe.functions";
import { blobToPcm16k } from "./speech";

function pcmToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export async function transcribeBlob(
  blob: Blob,
  language = "English"
): Promise<string> {
  const pcmBuffer = await blobToPcm16k(blob);
  const result = await transcribeAudio({
    data: { pcm: pcmToBase64(pcmBuffer), language },
  });
  return result.text;
}
