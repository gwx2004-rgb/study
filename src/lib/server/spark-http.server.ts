import { execFile } from "child_process";
import { promisify } from "util";
import type { HttpChatMessage } from "../spark-messages";

const execFileAsync = promisify(execFile);

export function getSparkHttpConfig() {
  return {
    url:
      process.env.IFLYTEK_SPARK_HTTP_URL ??
      "https://spark-api-open.xf-yun.com/v1/chat/completions",
    apiPassword: process.env.IFLYTEK_SPARK_API_PASSWORD ?? "",
    model: process.env.IFLYTEK_SPARK_MODEL ?? "4.0Ultra",
  };
}

function parseSparkResponse(raw: string): string {
  let data: {
    code?: number;
    message?: string;
    choices?: { message?: { content?: string } }[];
  };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`星火返回非 JSON: ${raw.slice(0, 200)}`);
  }
  if (data.code !== undefined && data.code !== 0) {
    throw new Error(data.message ?? `星火错误码 ${data.code}`);
  }
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("星火返回空内容");
  return content;
}

/** 使用 curl 调用星火（与终端测试命令一致，兼容性最好） */
async function chatWithCurl(
  url: string,
  apiPassword: string,
  model: string,
  messages: HttpChatMessage[]
): Promise<string> {
  const body = JSON.stringify({ model, messages, stream: false });
  const { stdout } = await execFileAsync(
    "curl",
    [
      "-s",
      "-k",
      "-X",
      "POST",
      url,
      "-H",
      `Authorization: Bearer ${apiPassword}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      body,
    ],
    { maxBuffer: 8 * 1024 * 1024, timeout: 90000 }
  );
  return parseSparkResponse(stdout);
}

async function chatWithFetch(
  url: string,
  apiPassword: string,
  model: string,
  messages: HttpChatMessage[]
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiPassword}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, stream: false }),
    cache: "no-store",
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${raw.slice(0, 200)}`);
  }
  return parseSparkResponse(raw);
}

export async function chatWithSparkHttp(
  messages: HttpChatMessage[]
): Promise<string> {
  const { url, apiPassword, model } = getSparkHttpConfig();
  if (!apiPassword) throw new Error("IFLYTEK_SPARK_API_PASSWORD 未配置");

  try {
    return await chatWithCurl(url, apiPassword, model, messages);
  } catch {
    return chatWithFetch(url, apiPassword, model, messages);
  }
}
