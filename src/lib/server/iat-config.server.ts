/** 讯飞语音听写（流式版）WebSocket 配置 */
export const IAT_HOST = "iat-api.xfyun.cn";
export const IAT_PATH = "/v2/iat";

export const IAT_LANGUAGE_MAP: Record<
  string,
  { language: string; accent: string }
> = {
  English: { language: "en_us", accent: "mandarin" },
  Spanish: { language: "es_es", accent: "mandarin" },
  French: { language: "fr_fr", accent: "mandarin" },
  Japanese: { language: "ja_jp", accent: "mandarin" },
  Chinese: { language: "zh_cn", accent: "mandarin" },
};

export function mapIatLanguage(language: string) {
  return IAT_LANGUAGE_MAP[language] ?? { language: "en_us", accent: "mandarin" };
}
