export const TTS_HOST = "tts-api.xfyun.cn";
export const TTS_PATH = "/v2/tts";

export const TTS_VCN_MAP: Record<string, string> = {
  English: "x4_en_us_amanda_emotion",
  Chinese: "xiaoyan",
  Spanish: "gabriela",
  French: "mariane",
  Japanese: "qianhui",
};

/** Sofia speaks fast and bubbly */
export const TTS_SPEED_MAP: Record<string, number> = {
  English: 58,
};

export const TTS_PITCH_MAP: Record<string, number> = {
  English: 54,
};

export function mapTtsVcn(language: string): string {
  return TTS_VCN_MAP[language] ?? "x4_en_us_amanda_emotion";
}

export function mapTtsSpeed(language: string): number {
  return TTS_SPEED_MAP[language] ?? 50;
}

export function mapTtsPitch(language: string): number {
  return TTS_PITCH_MAP[language] ?? 50;
}
