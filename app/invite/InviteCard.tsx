"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function InviteCard() {
  const params = useSearchParams();

  const cafe = params.get("cafe") || "";
  const hood = params.get("hood") || "";
  const photo = params.get("photo") || "";
  const vibe = params.get("vibe") || "";
  const date = params.get("date") || "";
  const time = params.get("time") || "";
  const group = params.get("group") || "Your friends";
  const host = params.get("host") || "A friend";
  const friends = Number(params.get("friends") || "4");

  // localStorage-backed counter, keyed by the invite URL hash
  const key = `invite:${cafe}:${date}:${time}`;
  const [confirmed, setConfirmed] = useState(1); // host is auto-confirmed
  const [iAmIn, setIAmIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      setConfirmed(parsed.count || 1);
      setIAmIn(parsed.iAmIn || false);
    }
  }, [key]);

  function handleCountMeIn() {
    if (iAmIn) return;
    const next = { count: confirmed + 1, iAmIn: true };
    localStorage.setItem(key, JSON.stringify(next));
    setConfirmed(next.count);
    setIAmIn(true);
  }

  if (!cafe) {
    return (
      <div className="text-center">
        <p className="text-[var(--muted)]">No invite data found in this link.</p>
      </div>
    );
  }

  // Format date nicely
  const prettyDate = (() => {
    try {
      const d = new Date(`${date}T${time}`);
      return d.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return date;
    }
  })();

  return (
    <div className="w-full max-w-lg">
      {/* Eyebrow */}
      <div className="text-center mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">
          You&rsquo;re invited · Hangout Wrapped
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-xl">
        {/* Photo */}
        <div className="relative aspect-[16/10] bg-[var(--background)]">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={cafe}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-xs uppercase tracking-[0.2em] opacity-90">
              {host} invited you
            </p>
            <p className="font-[family-name:var(--font-serif)] text-3xl mt-1 leading-tight">
              {group}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-bold">
            Meeting at
          </p>
          <p className="font-[family-name:var(--font-serif)] text-4xl leading-tight mt-1">
            {cafe}
          </p>
          <p className="text-sm text-[var(--muted)] mt-1">{hood}</p>

          {vibe && (
            <p className="mt-4 text-sm italic text-[var(--foreground)]/80 leading-snug">
              &ldquo;{vibe}&rdquo;
            </p>
          )}

          {/* When */}
          <div className="mt-5 pt-5 border-t border-[var(--border)] grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">When</p>
              <p className="font-[family-name:var(--font-serif)] text-lg mt-1">
                {prettyDate}
              </p>
              <p className="text-sm text-[var(--muted)]">{time}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Group</p>
              <p className="font-[family-name:var(--font-serif)] text-lg mt-1">
                {friends} friends
              </p>
              <p className="text-sm text-[var(--muted)]">
                {confirmed} confirmed
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCountMeIn}
            disabled={iAmIn}
            className={`mt-6 w-full px-4 py-3 rounded-xl text-sm font-medium transition ${
              iAmIn
                ? "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] cursor-default"
                : "bg-[var(--accent)] text-white shadow hover:opacity-90"
            }`}
          >
            {iAmIn ? "✓ You're in" : "Count me in"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-[var(--muted)] mt-6">
        Made with Hangout Wrapped · <a href="/" className="underline">Plan your own</a>
      </p>
    </div>
  );
}
