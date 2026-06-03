export type MemoryType = "fact" | "event" | "learning";

export interface Memory {
  id: string;
  type: MemoryType;
  category: string;
  content: string;
  originalQuote: string;
  timestamp: number;
  importance: number;
  lastUsed?: number | null;
  reminderDate?: string;
}

export interface MemoryStore {
  userId: string;
  memories: Memory[];
}
