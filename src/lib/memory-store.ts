import type { Memory, MemoryStore } from "./memory-types";
import { getProfile } from "./user-store";

function storageKey(userId: string) {
  return `ial.memory.v1.${userId}`;
}

function readStore(userId: string): MemoryStore {
  if (typeof window === "undefined") {
    return { userId, memories: [] };
  }
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { userId, memories: [] };
    const parsed = JSON.parse(raw) as MemoryStore;
    return parsed.userId === userId ? parsed : { userId, memories: [] };
  } catch {
    return { userId, memories: [] };
  }
}

function writeStore(store: MemoryStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(store.userId), JSON.stringify(store));
}

export function getMemories(userId?: string): Memory[] {
  const id = userId ?? getProfile()?.userId;
  if (!id) return [];
  return readStore(id).memories;
}

export function getRelevantMemories(limit = 12, userId?: string): Memory[] {
  const memories = getMemories(userId);
  return [...memories]
    .sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function addMemories(entries: Omit<Memory, "id" | "timestamp">[], userId?: string) {
  const profile = getProfile();
  const id = userId ?? profile?.userId;
  if (!id || entries.length === 0) return;

  const store = readStore(id);
  const existing = new Set(
    store.memories.map((m) => `${m.type}:${m.content.toLowerCase()}`),
  );

  for (const entry of entries) {
    const key = `${entry.type}:${entry.content.toLowerCase()}`;
    if (existing.has(key)) continue;
    existing.add(key);
    store.memories.push({
      ...entry,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    });
  }

  store.memories = store.memories
    .sort((a, b) => b.importance - a.importance || b.timestamp - a.timestamp)
    .slice(0, 80);

  writeStore(store);
}

export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (memories.length === 0) return "";
  return memories
    .map((m) => `- [${m.type}] ${m.content}`)
    .join("\n");
}
