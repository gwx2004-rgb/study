import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getProfile,
  getProfileForUsername,
  getSession,
  hasStoredProfile,
  setSession,
} from "@/lib/user-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Fluento" },
      { name: "description", content: "Sign in to Fluento and start learning through conversation." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getSession()) {
      const p = getProfile();
      navigate({ to: p ? "/" : "/onboarding", replace: true });
    }
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = username.trim();
    if (!name || !password.trim()) return;

    setError(null);

    if (mode === "signup" && hasStoredProfile(name)) {
      setError("This username is already taken. Switch to Sign in.");
      return;
    }

    setSession(name);
    const profile = getProfileForUsername(name);

    if (mode === "signup" || !profile) {
      navigate({ to: "/onboarding", replace: true });
      return;
    }

    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center px-5 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Fluento</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "Talk like friends. Learn like natives." : "Welcome back"}
          </p>
        </header>

        <div className="bg-card rounded-3xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex rounded-full bg-secondary p-1 mb-6">
            {(["signup", "signin"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 py-2 text-sm rounded-full transition ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {m === "signup" ? "Sign up" : "Sign in"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-xl bg-secondary border-0 outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                placeholder="Choose a username"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-xl bg-secondary border-0 outline-none focus:ring-2 focus:ring-ring text-foreground text-sm"
                placeholder="Any password works (MVP)"
              />
            </div>
            {error && (
              <p className="text-sm text-center text-destructive">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              {mode === "signup" ? "Continue" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          MVP: accounts are stored on this device only
        </p>
      </div>
    </div>
  );
}
