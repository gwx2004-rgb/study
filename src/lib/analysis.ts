import type { ChatMessage, SessionStats } from "./chat-types";
import { analyzeLanguageIssues } from "./error-analysis";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
  "from", "as", "into", "through", "during", "before", "after", "above",
  "below", "between", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "both", "each",
  "few", "more", "most", "other", "some", "such", "no", "nor", "not",
  "only", "own", "same", "so", "than", "too", "very", "just", "and",
  "but", "if", "or", "because", "until", "while", "although", "i", "you",
  "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their", "this", "that", "these",
  "those", "what", "which", "who", "whom", "am", "about", "up", "out",
  "off", "over", "also", "well", "like", "yeah", "yes", "no", "oh",
  "um", "uh", "ok", "okay",
]);

const GRAMMAR_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "Past tense (-ed)", regex: /\b\w+ed\b/gi },
  { name: "Present continuous (-ing)", regex: /\b\w+ing\b/gi },
  { name: "Modal + verb", regex: /\b(can|could|will|would|should|must|might)\s+\w+\b/gi },
  { name: "Comparatives", regex: /\b\w+(er|est)\b|\bmore\s+\w+\b|\bmost\s+\w+\b/gi },
  { name: "Questions", regex: /\?/g },
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Daily Life": ["home", "morning", "breakfast", "sleep", "routine", "day"],
  "Work & Career": ["work", "job", "office", "meeting", "project", "boss", "colleague"],
  "Food & Dining": ["food", "eat", "cook", "restaurant", "coffee", "lunch", "dinner"],
  "Hobbies": ["music", "movie", "book", "game", "sport", "run", "play", "hobby"],
  "Travel": ["travel", "trip", "flight", "hotel", "city", "country", "visit"],
  "Relationships": ["friend", "family", "love", "partner", "mom", "dad"],
  "Health": ["health", "exercise", "gym", "tired", "sleep", "doctor"],
  "Weather": ["weather", "rain", "sun", "cold", "hot", "snow", "wind"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export function analyzeSession(
  messages: ChatMessage[],
  sessionStartTime: number
): SessionStats {
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const userText = userMessages.map((m) => m.content).join(" ");
  const words = tokenize(userText);
  const totalWords = words.length;

  const wordFreq = new Map<string, number>();
  for (const word of words) {
    if (!STOP_WORDS.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
    }
  }

  const topWords = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  const grammarPatterns = GRAMMAR_PATTERNS.map(({ name, regex }) => {
    const matches = userText.match(regex) ?? [];
    const unique = [...new Set(matches.map((m) => m.toLowerCase()))].slice(0, 3);
    return { pattern: name, examples: unique };
  }).filter((p) => p.examples.length > 0);

  const topics: string[] = [];
  const lowerText = userText.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      topics.push(topic);
    }
  }
  if (topics.length === 0) topics.push("General Conversation");

  const avgWordsPerMessage =
    userMessages.length > 0 ? totalWords / userMessages.length : 0;
  const uniqueWords = wordFreq.size;
  const vocabularyRichness =
    totalWords > 0 ? uniqueWords / totalWords : 0;
  const lengthScore = Math.min(avgWordsPerMessage / 8, 1);
  const engagementScore = Math.min(userMessages.length / 10, 1);
  const fluencyScore = Math.round(
    (vocabularyRichness * 40 + lengthScore * 30 + engagementScore * 30) * 100
  ) / 100;

  const sessionDurationMinutes =
    Math.round(((Date.now() - sessionStartTime) / 60000) * 10) / 10;

  const voiceMessages = userMessages.filter((m) => m.inputSource === "voice").length;
  const textMessages = userMessages.filter(
    (m) => m.inputSource !== "voice" && m.content !== "(conversation start)"
  ).length;

  const { grammarIssues, oralIssues, recastFeedback } =
    analyzeLanguageIssues(messages);

  return {
    totalMessages: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    voiceMessages,
    textMessages,
    totalWords,
    uniqueWords,
    avgWordsPerMessage: Math.round(avgWordsPerMessage * 10) / 10,
    topWords,
    grammarPatterns,
    grammarIssues,
    oralIssues,
    recastFeedback,
    topics,
    fluencyScore,
    sessionDurationMinutes,
  };
}
