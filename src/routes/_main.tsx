import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Users, BarChart3, User } from "lucide-react";
import { getProfile, getSession } from "@/lib/user-store";

export const Route = createFileRoute("/_main")({
  component: MainLayout,
});

const TABS = [
  { to: "/", icon: MessageCircle, label: "Chats" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/assessment", icon: BarChart3, label: "Progress" },
  { to: "/me", icon: User, label: "Me" },
] as const;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getSession()) {
      navigate({ to: "/login" });
      return;
    }
    if (!getProfile()) {
      navigate({ to: "/onboarding" });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-[5.5rem]">
        <Outlet />
      </main>
      <nav
        className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-md mx-auto grid grid-cols-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active =
              t.to === "/"
                ? location.pathname === "/"
                : t.to === "/assessment"
                  ? location.pathname.startsWith("/assessment") ||
                    location.pathname === "/vocabulary"
                  : t.to === "/me"
                    ? location.pathname.startsWith("/me") ||
                      location.pathname === "/wordbook"
                    : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
