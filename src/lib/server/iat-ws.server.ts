import WebSocket from "ws";
import { mapIatLanguage } from "./iat-config.server";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/** 通过讯飞听写 WebSocket 发送 16kHz PCM 并返回识别文本 */
export function transcribePcmOverWs(
  pcm: Uint8Array,
  options: { url: string; appId: string; language: string }
): Promise<string> {
  const { url, appId, language } = options;
  const { language: iatLang, accent } = mapIatLanguage(language);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const segments = new Map<number, string>();
    let settled = false;

    const finish = (err?: Error, text?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      if (err) reject(err);
      else resolve(text?.trim() ?? "");
    };

    const timer = setTimeout(
      () => finish(new Error("听写超时，请重试")),
      20000
    );

    ws.on("error", (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (/401/.test(msg)) {
        finish(
          new Error(
            "讯飞听写鉴权失败 (401) — 请在 .env 填写已开通「语音听写」应用的 IFLYTEK_API_KEY / IFLYTEK_API_SECRET"
          )
        );
        return;
      }
      finish(new Error(msg ? `听写 WebSocket 连接失败: ${msg}` : "听写 WebSocket 连接失败"));
    });

    ws.on("message", (data) => {
      const json = JSON.parse(String(data));
      if (json.code !== 0) {
        finish(new Error(json.message ?? `听写错误 ${json.code}`));
        return;
      }
      const result = json.data?.result;
      if (result?.ws) {
        let text = "";
        for (const item of result.ws) {
          for (const w of item.cw) text += w.w;
        }
        const sn = result.sn ?? 0;
        if (result.pgs === "rpl") segments.set(sn, text);
        else segments.set(sn, (segments.get(sn) ?? "") + text);
      }
      if (json.data?.status === 2) {
        const finalText = [...segments.keys()]
          .sort((a, b) => a - b)
          .map((k) => segments.get(k) ?? "")
          .join("");
        finish(undefined, finalText);
      }
    });

    ws.on("close", (code) => {
      if (settled) return;
      const finalText = [...segments.keys()]
        .sort((a, b) => a - b)
        .map((k) => segments.get(k) ?? "")
        .join("");
      if (finalText) {
        finish(undefined, finalText);
        return;
      }
      finish(
        new Error(
          code ? `听写连接关闭 (${code})` : "听写 WebSocket 连接失败"
        )
      );
    });

    ws.on("open", () => {
      void (async () => {
        try {
          const frameSize = 8000;
          let offset = 0;
          let isFirst = true;

          while (true) {
            const chunk = pcm.subarray(offset, offset + frameSize);
            const isLast = offset + frameSize >= pcm.length;
            offset += chunk.length;
            const b64 = toBase64(chunk);

            if (isFirst) {
              ws.send(
                JSON.stringify({
                  common: { app_id: appId },
                  business: {
                    domain: "iat",
                    language: iatLang,
                    accent,
                    vinfo: 1,
                    vad_eos: 10000,
                  },
                  data: {
                    status: 0,
                    format: "audio/L16;rate=16000",
                    audio: b64,
                    encoding: "raw",
                  },
                })
              );
              isFirst = false;
            } else if (isLast) {
              ws.send(
                JSON.stringify({
                  data: {
                    status: 2,
                    format: "audio/L16;rate=16000",
                    audio: b64,
                    encoding: "raw",
                  },
                })
              );
              break;
            } else {
              ws.send(
                JSON.stringify({
                  data: {
                    status: 1,
                    format: "audio/L16;rate=16000",
                    audio: b64,
                    encoding: "raw",
                  },
                })
              );
            }
            await sleep(40);
          }
        } catch (e) {
          finish(e instanceof Error ? e : new Error(String(e)));
        }
      })();
    });
  });
}
