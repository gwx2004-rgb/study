import crypto from "crypto";

/** 生成讯飞 WebSocket 通用鉴权 URL */
export function createXfyunAuthUrl(
  host: string,
  path: string,
  apiKey: string,
  apiSecret: string
): string {
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(signatureOrigin)
    .digest("base64");

  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString("base64");

  // 与官方 Go url.Encode 一致：空格用 %20，不用 URLSearchParams 的 +
  const query = [
    `authorization=${encodeURIComponent(authorization)}`,
    `date=${encodeURIComponent(date)}`,
    `host=${encodeURIComponent(host)}`,
  ].join("&");

  return `wss://${host}${path}?${query}`;
}

function credentialsFromSparkPassword():
  | { apiKey: string; apiSecret: string }
  | null {
  const sparkPassword = process.env.IFLYTEK_SPARK_API_PASSWORD?.trim();
  if (!sparkPassword?.includes(":")) return null;
  const [apiKey, apiSecret] = sparkPassword.split(":", 2);
  if (!apiKey?.trim() || !apiSecret?.trim()) return null;
  return { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() };
}

/** IAT / TTS WebSocket 鉴权 — 优先用星火 HTTP Password 里的 apiKey:apiSecret */
export function getIflytekCredentials() {
  const appId = process.env.IFLYTEK_APP_ID?.trim();
  if (!appId) return null;

  const fromSpark = credentialsFromSparkPassword();
  if (fromSpark) {
    return { appId, ...fromSpark };
  }

  const apiKey = process.env.IFLYTEK_API_KEY?.trim();
  const apiSecret = process.env.IFLYTEK_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;
  return { appId, apiKey, apiSecret };
}
