import type {
  ChatMessage,
  InputSource,
  LanguageIssue,
  RecastFeedback,
} from "./chat-types";

interface GrammarRule {
  category: string;
  description: string;
  regex: RegExp;
  suggestion: string | ((match: string) => string);
}

/** 常见语法问题（启发式，适用于 English） */
const GRAMMAR_RULES: GrammarRule[] = [
  {
    category: "时态",
    description: "过去时间词与现在时动词连用",
    regex: /\b(I|you|we|they|he|she|it)\s+(go|goes|do|does|is|are)\b[^.!?]{0,40}\b(yesterday|last night|last week|ago|in 20\d{2})\b/i,
    suggestion: "过去时间应使用过去式，如 went / did / was",
  },
  {
    category: "主谓一致",
    description: "第三人称单数与 don't 连用",
    regex: /\b(he|she|it)\s+don't\b/i,
    suggestion: "改为 doesn't",
  },
  {
    category: "主谓一致",
    description: "第三人称单数缺少 -s",
    regex: /\b(he|she|it)\s+(go|like|want|need|have)\s+(?!to\b)/i,
    suggestion: "第三人称动词加 -s，如 goes / likes",
  },
  {
    category: "比较级",
    description: "more 与 -er 重复使用",
    regex: /\bmore\s+\w+(er|est)\b/i,
    suggestion: "用 more + 原级 或 -er 比较级，不要两者同时用",
  },
  {
    category: "进行时",
    description: "be 动词与动词原形错误搭配",
    regex: /\b(I|you|we|they|he|she|it)\s+(am|is|are)\s+(go|eat|work|play)\b/i,
    suggestion: "进行时用 -ing，如 am going",
  },
  {
    category: "冠词",
    description: "元音前使用了 a",
    regex: /\ba\s+([aeiouAEIOU]\w+)/,
    suggestion: (m) => {
      const exec = /\ba\s+([aeiouAEIOU]\w+)/.exec(m);
      return exec ? `改为 an ${exec[1]}` : "元音前用 an";
    },
  },
  {
    category: "双否定",
    description: "双重否定",
    regex: /\b(don't|doesn't|didn't|can't|won't)\s+\w+\s+(no|nothing|never)\b/i,
    suggestion: "避免双重否定，保留一种否定形式",
  },
  {
    category: "介词",
    description: "常见介词搭配错误",
    regex: /\b(arrive|enter)\s+to\s+/i,
    suggestion: "arrive / enter 后直接接地点，不用 to",
  },
];

/** 口语 / 听写识别问题（主要针对 voice 输入） */
const ORAL_RULES: GrammarRule[] = [
  {
    category: "口头禅",
    description: "语音识别捕获的填充词",
    regex: /\b(um+|uh+|er+|ah+|hm+|em+)\b/i,
    suggestion: "口语中常见，练习时可适当省略",
  },
  {
    category: "重复",
    description: "词语重复（口语卡顿或识别重复）",
    regex: /\b(\w{2,})\s+\1\b/i,
    suggestion: "检查是否为口吃或听写重复",
  },
  {
    category: "断句",
    description: "长句无标点（口语连读）",
    regex: /^[^.!?]{60,}$/,
    suggestion: "口语连读较长，书面表达可加标点断句",
  },
  {
    category: "同音词",
    description: "可能的同音词混淆（听写）",
    regex: /\b(their\s+is|there\s+are|your\s+welcome|its\s+a)\b/i,
    suggestion: "检查 their/there/they're、your/you're、its/it's",
  },
  {
    category: "识别残缺",
    description: "句子过短或疑似截断",
    regex: /^.{1,3}$/,
    suggestion: "听写可能不完整，可重新说一遍",
  },
];

function applyRule(
  text: string,
  rule: GrammarRule,
  type: "grammar" | "oral",
  source: InputSource
): LanguageIssue | null {
  const match = text.match(rule.regex);
  if (!match) return null;

  const suggestion =
    typeof rule.suggestion === "function"
      ? rule.suggestion(match[0])
      : rule.suggestion;

  return {
    type,
    category: rule.category,
    description: rule.description,
    excerpt: text.length > 60 ? `${text.slice(0, 60)}…` : text,
    suggestion,
    source,
  };
}

export function detectGrammarIssues(
  text: string,
  source: InputSource
): LanguageIssue[] {
  const issues: LanguageIssue[] = [];
  const seen = new Set<string>();

  for (const rule of GRAMMAR_RULES) {
    const issue = applyRule(text, rule, "grammar", source);
    if (issue && !seen.has(`${issue.category}:${issue.excerpt}`)) {
      seen.add(`${issue.category}:${issue.excerpt}`);
      issues.push(issue);
    }
  }
  return issues;
}

export function detectOralIssues(
  text: string,
  source: InputSource
): LanguageIssue[] {
  if (source !== "voice") return [];

  const issues: LanguageIssue[] = [];
  const seen = new Set<string>();

  for (const rule of ORAL_RULES) {
    const issue = applyRule(text, rule, "oral", source);
    if (issue && !seen.has(`${issue.category}:${issue.excerpt}`)) {
      seen.add(`${issue.category}:${issue.excerpt}`);
      issues.push(issue);
    }
  }
  return issues;
}

/** 从下一条 AI 回复中提取 recast 纠正（AI 自然重复正确说法） */
export function extractRecast(
  userText: string,
  assistantText: string,
  source: InputSource
): RecastFeedback | null {
  if (userText === "(conversation start)" || userText.length < 4) return null;

  const userWords = userText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (userWords.length < 2) return null;

  const assistantLower = assistantText.toLowerCase();
  const overlap = userWords.filter((w) => assistantLower.includes(w)).length;
  const ratio = overlap / userWords.length;

  // AI 引用了用户多个关键词，且句式不同 → 可能是 recast
  if (ratio < 0.35) return null;

  // 提取含问号或陈述的纠正句
  const sentences = assistantText.split(/(?<=[.!?])\s+/);
  let corrected = sentences.find(
    (s) =>
      s.includes("?") &&
      userWords.filter((w) => s.toLowerCase().includes(w)).length >= 2
  );
  if (!corrected) {
    corrected = sentences.find(
      (s) => userWords.filter((w) => s.toLowerCase().includes(w)).length >= 2
    );
  }
  if (!corrected || corrected.toLowerCase() === userText.toLowerCase()) {
    return null;
  }

  return { original: userText, corrected: corrected.trim(), source };
}

export function analyzeLanguageIssues(messages: ChatMessage[]): {
  grammarIssues: LanguageIssue[];
  oralIssues: LanguageIssue[];
  recastFeedback: RecastFeedback[];
} {
  const grammarIssues: LanguageIssue[] = [];
  const oralIssues: LanguageIssue[] = [];
  const recastFeedback: RecastFeedback[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== "user" || msg.content === "(conversation start)") continue;

    const source: InputSource = msg.inputSource ?? "text";

    grammarIssues.push(...detectGrammarIssues(msg.content, source));
    oralIssues.push(...detectOralIssues(msg.content, source));

    const next = messages[i + 1];
    if (next?.role === "assistant") {
      const recast = extractRecast(msg.content, next.content, source);
      if (recast) recastFeedback.push(recast);
    }
  }

  // 去重
  const dedupe = <T extends { excerpt?: string; original?: string; category?: string }>(
    arr: T[],
    key: (x: T) => string
  ) => {
    const s = new Set<string>();
    return arr.filter((x) => {
      const k = key(x);
      if (s.has(k)) return false;
      s.add(k);
      return true;
    });
  };

  return {
    grammarIssues: dedupe(grammarIssues, (x) => `${x.category}:${x.excerpt}`),
    oralIssues: dedupe(oralIssues, (x) => `${x.category}:${x.excerpt}`),
    recastFeedback: dedupe(recastFeedback, (x) => x.original),
  };
}
