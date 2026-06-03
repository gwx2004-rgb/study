import { createXfyunAuthUrl, getIflytekCredentials } from "./iflytek-auth.server";
import { synthesizeSpeechOnServer } from "./tts-server.server";
import { TTS_HOST, TTS_PATH } from "./tts-config.server";

export async function synthesizeMp3(text: string, language: string): Promise<Buffer> {
  const credentials = getIflytekCredentials();
  if (!credentials) {
    throw new Error("讯飞 API 凭证未配置");
  }

  const url = createXfyunAuthUrl(
    TTS_HOST,
    TTS_PATH,
    credentials.apiKey,
    credentials.apiSecret
  );

  return synthesizeSpeechOnServer(text, {
    url,
    appId: credentials.appId,
    language,
  });
}
