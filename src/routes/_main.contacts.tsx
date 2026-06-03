import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Lock } from "lucide-react";
import { CONTACTS, getContactDisplayName } from "@/lib/contacts";

export const Route = createFileRoute("/_main/contacts")({
  head: () => ({ meta: [{ title: "Contacts" }] }),
  component: ContactsPage,
});

const CONTACTS_LIST = Object.values(CONTACTS).map((c) => ({
  ...c,
  desc: c.subtitle,
  available: c.id === "sofia",
}));

function ContactsPage() {
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6">
      <header className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground mt-1">Your language partners</p>
      </header>

      <ul className="space-y-1.5">
        {CONTACTS_LIST.map((c) =>
          c.available ? (
            <li key={c.id}>
              <Link
                to="/chat/$contactId"
                params={{ contactId: c.id }}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-card hover:bg-secondary transition"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <Avatar initial={c.initial} gradient={c.gradient} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px]">
                    {getContactDisplayName(c.id)}
                  </div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
                <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <MessageCircle size={15} />
                </span>
              </Link>
            </li>
          ) : (
            <li key={c.id}>
              <button
                onClick={() => showToast("This partner will open in the next release.")}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-card opacity-60"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <Avatar initial={c.initial} gradient={c.gradient} grayscale />
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-[15px]">{c.defaultName}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
                <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  <Lock size={10} /> Soon
                </span>
              </button>
            </li>
          ),
        )}
      </ul>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-foreground text-background text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Avatar({
  initial,
  gradient,
  grayscale,
}: {
  initial: string;
  gradient: string;
  grayscale?: boolean;
}) {
  return (
    <div
      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0"
      style={{ background: gradient, filter: grayscale ? "grayscale(1)" : undefined }}
    >
      {initial}
    </div>
  );
}
