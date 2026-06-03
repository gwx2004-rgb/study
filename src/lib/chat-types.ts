export type TargetLanguage = "English" | "Spanish" | "French" | "Japanese" | "Chinese";

export type Persona = "lively_friend" | "humorous_lover" | "professional_colleague";

export type LanguageLevel = "beginner" | "intermediate" | "advanced";

export type MessageRole = "user" | "assistant";

export type InputSource = "text" | "voice" | "image";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  /** 文字输入 / 语音听写 / 图片分享 */
  inputSource?: InputSource;
  /** JPEG/PNG data URL for shared photos */
  imageDataUrl?: string;
}

export interface LanguageIssue {
  type: "grammar" | "oral";
  category: string;
  description: string;
  excerpt: string;
  suggestion?: string;
  source: InputSource;
}

export interface RecastFeedback {
  /** 用户原话 */
  original: string;
  /** AI 自然纠正后的表达（从下一条回复提取） */
  corrected: string;
  source: InputSource;
}

export interface SessionConfig {
  targetLanguage: TargetLanguage;
  persona: Persona;
  level: LanguageLevel;
}

export interface SessionStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  voiceMessages: number;
  textMessages: number;
  totalWords: number;
  uniqueWords: number;
  avgWordsPerMessage: number;
  topWords: { word: string; count: number }[];
  grammarPatterns: { pattern: string; examples: string[] }[];
  grammarIssues: LanguageIssue[];
  oralIssues: LanguageIssue[];
  recastFeedback: RecastFeedback[];
  topics: string[];
  fluencyScore: number;
  sessionDurationMinutes: number;
}

export const PERSONA_OPTIONS: {
  id: Persona;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    id: "lively_friend",
    label: "活泼朋友",
    emoji: "🌟",
    description: "热情、好奇，像一起逛街聊天的死党",
  },
  {
    id: "humorous_lover",
    label: "幽默恋人",
    emoji: "💕",
    description: "温柔俏皮，用轻松玩笑拉近距离",
  },
  {
    id: "professional_colleague",
    label: "职场同事",
    emoji: "💼",
    description: "专业友好，聊工作与生活平衡",
  },
];

export const LANGUAGE_OPTIONS: TargetLanguage[] = [
  "English",
  "Spanish",
  "French",
  "Japanese",
  "Chinese",
];

export const LEVEL_OPTIONS: {
  id: LanguageLevel;
  label: string;
  description: string;
}[] = [
  {
    id: "beginner",
    label: "初级",
    description: "短句、高频词、语速慢",
  },
  {
    id: "intermediate",
    label: "中级",
    description: "复合句、自然对话节奏",
  },
  {
    id: "advanced",
    label: "高级",
    description: "快速、俚语、地道表达",
  },
];
