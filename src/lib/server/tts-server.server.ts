import WebSocket from "ws";
import { mapTtsPitch, mapTtsSpeed, mapTtsVcn } from "./tts-config.server";

function encodeTtsText(text: string): string {
  return Buffer.from(text.slice(0, 2000), "utf8").toString("base64");
}

/** 服务端讯飞 TTS WebSocket，返回 mp3 二进制 */
export function synthesizeSpeechOnServer(
  text: string,
  options: { url: string; appId: string; language: string }
): Promise<Buffer> {
  const { url, appId, language } = options;
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve(Buffer.alloc(0));

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const audioChunks: Buffer[] = [];
    let settled = false;

    const finish = (err?: Error, audio?: Buffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      if (err) reject(err);
      else resolve(audio ?? Buffer.alloc(0));
    };

    const timer = setTimeout(
      () => finish(new Error("语音合成超时，请重试")),
      20000
    );

    ws.on("error", (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      finish(new Error(msg ? `TTS WebSocket 连接失败: ${msg}` : "TTS WebSocket 连接失败"));
    });

    ws.on("message", (data) => {
      try {
        const json = JSON.parse(String(data));
        if (json.code !== 0) {
          finish(new Error(json.message ?? `TTS 错误 ${json.code}`));
          return;
        }
        if (json.data?.audio) {
          audioChunks.push(Buffer.from(json.data.audio, "base64"));
        }
        if (json.data?.status === 2) {
          finish(undefined, Buffer.concat(audioChunks));
        }
      } catch (e) {
        finish(e instanceof Error ? e : new Error(String(e)));
      }
    });

    ws.on("close", (code) => {
      if (settled) return;
      const audio = Buffer.concat(audioChunks);
      if (audio.length > 0) {
        finish(undefined, audio);
        return;
      }
      finish(
        new Error(code ? `TTS 连接关闭 (${code})` : "TTS WebSocket 连接失败")
      );
    });

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          common: { app_id: appId },
          business: {
            aue: "lame",
            sfl: 1,
            vcn: mapTtsVcn(language),
            speed: mapTtsSpeed(language),
            volume: 50,
            pitch: mapTtsPitch(language),
            tte: "UTF8",
          },
          data: { status: 2, text: encodeTtsText(trimmed) },
        })
      );
    });
  });
}
