import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";
import { Search, Edit3 } from "lucide-react";
import { useState } from "react";
import { getStoredMessages } from "@/lib/chat-store";
import { CONTACTS, formatListTime, getContactDisplayName } from "@/lib/contacts";

export const Route = createFileRoute("/_main/")({
  head: () => ({
    meta: [
      { title: "Messages" },
      { name: "description", content: "Your AI language buddies." },
    ],
  }),
  component: ChatListPage,
});

interface Conversation {
  id: string;
  name: string;
  initial: string;
  preview: string;
  time: string;
  unread?: number;
  online?: boolean;
  available: boolean;
  gradient: string;
}

const CONVERSATIONS: Conversation[] = Object.values(CONTACTS).map((c) => ({
  id: c.id,
  name: c.defaultName,
  initial: c.initial,
  preview: c.id === "sofia" ? "Heyyy!! So happy you're here ☺️ What are you up to?" : "Coming soon",
  time: c.id === "sofia" ? "now" : "",
  unread: c.id === "sofia" ? 1 : undefined,
  online: c.id === "sofia",
  available: c.id === "sofia",
  gradient: c.gradient,
}));

function ChatListPage() {
  const [q, setQ] = useState("");
  useRouterState({ select: (s) => s.location.pathname });
  const msgs = getStoredMessages("sofia", "casual");
  const last = [...msgs].reverse().find((m) => m.role === "assistant" || m.role === "user");
  const sofiaPreview =
    last?.content?.slice(0, 60) ?? "Heyyy!! So happy you're here ☺️ What are you up to?";
  const sofiaTime = last ? formatListTime(last.timestamp) : "now";
  const conversations = CONVERSATIONS.map((c) =>
    c.id === "sofia"
      ? {
          ...c,
          name: getContactDisplayName("sofia"),
          preview: sofiaPreview,
          time: sofiaTime,
        }
      : c
  );
  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="max-w-md mx-auto">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <button className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground/70 hover:bg-accent transition">
          <Edit3 size={18} />
        </button>
      </header>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 px-3.5 h-10 rounded-xl bg-secondary">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <ul className="px-2">
        {filtered.map((c) => (
          <li key={c.id}>
            {c.available ? (
              <Link
                to="/chat/$contactId"
                params={{ contactId: c.id }}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-secondary transition"
              >
                <ConversationRow c={c} />
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl opacity-50 cursor-not-allowed">
                <ConversationRow c={c} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConversationRow({ c }: { c: Conversation }) {
  return (
    <>
      <div className="relative shrink-0">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
          style={{ background: c.gradient }}
        >
          {c.initial}
        </div>
        {c.online && (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background"
            style={{ background: "var(--color-online)" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[15px] truncate">{c.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{c.time}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">{c.preview}</span>
          {c.unread ? (
            <span className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
              {c.unread}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
