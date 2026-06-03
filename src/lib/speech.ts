const LANGUAGE_CODES: Record<string, string> = {
  English: "en-US",
  Spanish: "es-ES",
  French: "fr-FR",
  Japanese: "ja-JP",
  Chinese: "zh-CN",
};

const FEMALE_VOICE_HINTS =
  /samantha|karen|victoria|moira|zira|jenny|aria|fiona|tessa|linda|susan|hazel|female|woman|amanda|luna|emily|sara|sarah|allison|ava|nicky|kate|serena|sophie/i;
const MALE_VOICE_HINTS =
  /daniel|alex(?!a)|fred|david|male|man|boy|gavin|tom|james|mark|aaron|lee|ralph|bruce|richard|gordon|evan|nathan/i;

export function getSpeechLang(language: string): string {
  return LANGUAGE_CODES[language] ?? "en-US";
}

/** Strip emoji and action asides before TTS */
export function textForSpeech(raw: string): string {
  return raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\*[^*]+\*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickFemaleEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const female = english.filter(
    (v) => FEMALE_VOICE_HINTS.test(v.name) && !MALE_VOICE_HINTS.test(v.name),
  );
  if (female.length > 0) {
    return (
      female.find((v) => v.lang === "en-US") ??
      female.find((v) => v.lang.startsWith("en-US")) ??
      female[0] ??
      null
    );
  }
  const notMale = english.filter((v) => !MALE_VOICE_HINTS.test(v.name));
  return notMale[0] ?? null;
}

async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return existing;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(window.speechSynthesis.getVoices()), 400);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export function speakWithBrowser(text: string, language: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    void (async () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textForSpeech(text));
      utterance.lang = getSpeechLang(language);
      utterance.rate = language === "English" ? 1.08 : 0.95;
      utterance.pitch = language === "English" ? 1.12 : 1;

      const voices = await waitForVoices();
      const female = pickFemaleEnglishVoice(voices);
      if (female) utterance.voice = female;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    })();
  });
}

import { synthesizeSpeech } from "./api/tts.functions";

async function speakWithServerTts(
  text: string,
  language: string
): Promise<boolean> {
  try {
    const spoken = textForSpeech(text);
    if (!spoken) return true;
    const { audioBase64 } = await synthesizeSpeech({ data: { text: spoken, language } });
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    return await new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(true);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      };
      audio.play().then(() => undefined).catch(() => resolve(false));
    });
  } catch {
    return false;
  }
}

export async function speakText(text: string, language: string): Promise<void> {
  // English: browser voice — natural accent (skip iFlytek Amanda)
  if (language === "English") {
    await speakWithBrowser(text, language);
    return;
  }
  const ok = await speakWithServerTts(text, language);
  if (!ok) await speakWithBrowser(text, language);
}

export function isWebSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognition(language: string): SpeechRecognition | null {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = getSpeechLang(language);
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  return recognition;
}

export function pickMediaRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

export async function blobToPcm16k(blob: Blob): Promise<ArrayBuffer> {
  if (blob.size === 0) {
    throw new Error("录音为空，请稍长一点再结束");
  }

  const arrayBuffer = await blob.arrayBuffer();
  const decodeContext = new AudioContext();
  try {
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await decodeContext.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      throw new Error("无法解析录音格式，请重试或使用文字输入");
    }

    const targetRate = 16000;
    const offline = new OfflineAudioContext(
      1,
      Math.max(1, Math.ceil(audioBuffer.duration * targetRate)),
      targetRate
    );
    const source = offline.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offline.destination);
    source.start(0);
    const resampled = await offline.startRendering();

    const samples = resampled.getChannelData(0);
    const pcm = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]!));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm.buffer;
  } finally {
    await decodeContext.close();
  }
}
