import { extractMemoriesFromMessage } from "./api/memory.functions";
import { addMemories, getMemories } from "./memory-store";

export async function extractAndSaveMemories(message: string) {
  const trimmed = message.trim();
  if (trimmed.length < 8) return;

  try {
    const existingMemories = getMemories().map((m) => ({
      type: m.type,
      content: m.content,
    }));
    const { memories } = await extractMemoriesFromMessage({
      data: { message: trimmed, existingMemories },
    });
    if (memories.length > 0) {
      addMemories(memories);
    }
  } catch {
    // memory extraction is best-effort
  }
}
