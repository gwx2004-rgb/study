export interface YoloDetection {
  label: string;
  confidence: number;
}

function getYoloApiUrl(): string {
  const url = process.env.YOLO_API_URL?.trim();
  if (!url) {
    throw new Error(
      "YOLO_API_URL is not set — use local bash start-yolo.sh or a cloud YOLO URL"
    );
  }
  return url.replace(/\/$/, "");
}

function yoloRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = process.env.YOLO_API_KEY?.trim();
  if (key) headers["X-Yolo-Key"] = key;
  return headers;
}

export async function detectObjectsInImage(
  imageDataUrl: string
): Promise<YoloDetection[]> {
  const base = getYoloApiUrl();
  let res: Response;
  try {
    res = await fetch(`${base}/detect`, {
      method: "POST",
      headers: yoloRequestHeaders(),
      body: JSON.stringify({ image: imageDataUrl }),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Cannot reach YOLO service — check YOLO_API_URL (local or cloud)"
    );
  }

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(
      raw.slice(0, 200) || `YOLO service error HTTP ${res.status}`
    );
  }

  let data: { detections?: unknown };
  try {
    data = JSON.parse(raw) as { detections?: unknown };
  } catch {
    throw new Error("YOLO service returned invalid JSON");
  }

  if (!Array.isArray(data.detections)) return [];

  return data.detections
    .filter(
      (d): d is YoloDetection =>
        typeof d === "object" &&
        d !== null &&
        typeof (d as YoloDetection).label === "string" &&
        typeof (d as YoloDetection).confidence === "number"
    )
    .map((d) => ({
      label: d.label.trim(),
      confidence: d.confidence,
    }))
    .filter((d) => d.label.length > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 12);
}

export function formatDetectionsForPrompt(detections: YoloDetection[]): string {
  if (detections.length === 0) {
    return "no clear objects detected (maybe an empty scene, abstract image, or low light)";
  }
  return detections
    .map((d) => `${d.label} (${Math.round(d.confidence * 100)}%)`)
    .join(", ");
}
