import { getActiveUsername, normalizeUsername } from "./user-store";

export interface ContactInfo {
  id: string;
  defaultName: string;
  subtitle: string;
  initial: string;
  gradient: string;
}

export const CONTACTS: Record<string, ContactInfo> = {
  sofia: {
    id: "sofia",
    defaultName: "Sofia Martinez",
    subtitle: "Active now · Los Angeles",
    initial: "S",
    gradient: "linear-gradient(135deg, oklch(0.72 0.18 30), oklch(0.65 0.2 15))",
  },
  james: {
    id: "james",
    defaultName: "James Buchanan",
    subtitle: "London · History teacher",
    initial: "J",
    gradient: "linear-gradient(135deg, oklch(0.55 0.1 250), oklch(0.4 0.08 260))",
  },
  luna: {
    id: "luna",
    defaultName: "Luna Chen",
    subtitle: "Vancouver · Bilingual",
    initial: "L",
    gradient: "linear-gradient(135deg, oklch(0.65 0.15 290), oklch(0.55 0.18 310))",
  },
  diego: {
    id: "diego",
    defaultName: "Diego Hernández",
    subtitle: "CDMX · Travel blogger",
    initial: "D",
    gradient: "linear-gradient(135deg, oklch(0.7 0.16 60), oklch(0.6 0.18 40))",
  },
};

export const CHAT_CONTACT_IDS = ["sofia"] as const;

function remarksKey(username: string) {
  return `ial.contacts.v1.${normalizeUsername(username)}.remarks`;
}

function readRemarks(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const username = getActiveUsername();
  if (!username) return {};
  try {
    const raw = localStorage.getItem(remarksKey(username));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeRemarks(remarks: Record<string, string>) {
  if (typeof window === "undefined") return;
  const username = getActiveUsername();
  if (!username) return;
  localStorage.setItem(remarksKey(username), JSON.stringify(remarks));
}

export function getContactInfo(contactId: string): ContactInfo | undefined {
  return CONTACTS[contactId];
}

export function getContactRemark(contactId: string): string | null {
  const remark = readRemarks()[contactId]?.trim();
  return remark || null;
}

export function setContactRemark(contactId: string, remark: string) {
  const trimmed = remark.trim();
  const info = getContactInfo(contactId);
  const remarks = readRemarks();

  if (!trimmed || (info && trimmed === info.defaultName)) {
    delete remarks[contactId];
  } else {
    remarks[contactId] = trimmed;
  }

  writeRemarks(remarks);
}

export function getContactDisplayName(contactId: string): string {
  return getContactRemark(contactId) ?? getContactInfo(contactId)?.defaultName ?? contactId;
}

export function formatListTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (isSameDay(d, now)) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return "Yesterday";
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
