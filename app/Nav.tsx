"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, setUser, signOut } from "@/lib/auth";
import { captureEvent, identifyUser, resetUser } from "@/lib/analytics";

const links = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan" },
  { href: "/dashboard", label: "Wrapped" },
];

export default function Nav() {
  const pathname = usePathname();
  const [user, setUserState] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setUserState(getUser());
  }, [pathname]);

  function handleSignIn() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUser(trimmed);
    setUserState(trimmed);
    setShowPrompt(false);
    setName("");
    identifyUser(trimmed);
    captureEvent("user_signed_in", { name: trimmed });
  }

  function handleSignOut() {
    captureEvent("user_signed_out");
    resetUser();
    signOut();
    setUserState(null);
  }

  return (
    <>
      <nav className="fixed top-4 right-4 z-50 flex items-center gap-1 rounded-full bg-[var(--card)]/90 backdrop-blur border border-[var(--border)] px-2 py-1 shadow-sm">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] transition ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        {user ? (
          <div className="flex items-center gap-1">
            <span className="px-2 text-xs text-[var(--foreground)] font-medium">
              Hi, {user}
            </span>
            <button
              onClick={handleSignOut}
              className="px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPrompt(true)}
            className="px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] text-[var(--foreground)] hover:bg-[var(--border)]/40"
          >
            Sign in
          </button>
        )}
      </nav>

      {/* Sign-in prompt */}
      {showPrompt && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPrompt(false)}
        >
          <div
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)] mb-2">
              Sign in
            </p>
            <h3 className="font-[family-name:var(--font-serif)] text-3xl mb-4">
              What&rsquo;s your name?
            </h3>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              placeholder="Aarav"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <p className="text-[11px] text-[var(--muted)] mt-2">
              Saves to this device. No password. Your plans will appear on the
              Plan page.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSignIn}
                disabled={!name.trim()}
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-40"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
