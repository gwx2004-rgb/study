import { IAT_HOST, IAT_PATH } from "./iat-config.server";
import { createXfyunAuthUrl, getIflytekCredentials } from "./iflytek-auth.server";
import { transcribePcmOverWs } from "./iat-ws.server";

/** 服务端连接讯飞听写 WebSocket，输入 16kHz PCM */
export async function transcribePcmOnServer(
  pcm: Uint8Array,
  language: string
): Promise<string> {
  const credentials = getIflytekCredentials();
  if (!credentials) {
    throw new Error("讯飞 API 凭证未配置");
  }

  const url = createXfyunAuthUrl(
    IAT_HOST,
    IAT_PATH,
    credentials.apiKey,
    credentials.apiSecret
  );

  return transcribePcmOverWs(pcm, {
    url,
    appId: credentials.appId,
    language,
  });
}
