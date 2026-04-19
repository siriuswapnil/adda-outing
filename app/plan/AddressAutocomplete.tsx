"use client";

import { useEffect, useRef, useState } from "react";
import { searchGeocode, type GeocodeResult } from "@/lib/geocode";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onPick: (result: GeocodeResult) => void;
  placeholder?: string;
  disabled?: boolean;
  // when true, input renders red
  error?: boolean;
  className?: string;
};

// Module-level ID counter for unique dropdown instances
let ddCounter = 0;
const DD_OPEN_EVENT = "addr-autocomplete-open";

export default function AddressAutocomplete({
  value,
  onChange,
  onPick,
  placeholder,
  disabled,
  error,
  className = "",
}: Props) {
  const idRef = useRef<number>(0);
  if (idRef.current === 0) idRef.current = ++ddCounter;
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emptyMsg, setEmptyMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when another autocomplete opens
  useEffect(() => {
    function onOtherOpen(e: Event) {
      const ce = e as CustomEvent<{ id: number }>;
      if (ce.detail?.id !== idRef.current) {
        setOpen(false);
      }
    }
    window.addEventListener(DD_OPEN_EVENT, onOtherOpen);
    return () => window.removeEventListener(DD_OPEN_EVENT, onOtherOpen);
  }, []);

  // Broadcast when THIS opens
  function openSelf() {
    setOpen(true);
    window.dispatchEvent(
      new CustomEvent(DD_OPEN_EVENT, { detail: { id: idRef.current } })
    );
  }

  // Debounced search + one silent retry on empty/failure
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setEmptyMsg(null);
      return;
    }
    setLoading(true);
    setEmptyMsg(null);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      let found = await searchGeocode(value, 5, ac.signal);
      if (ac.signal.aborted) return;

      // If empty, silent retry after 800ms (handles transient 429s)
      if (found.length === 0) {
        await new Promise((r) => setTimeout(r, 800));
        if (ac.signal.aborted) return;
        found = await searchGeocode(value, 5, ac.signal);
        if (ac.signal.aborted) return;
      }

      setResults(found);
      openSelf();
      setActiveIdx(0);
      setLoading(false);
      setEmptyMsg(
        found.length === 0
          ? "No matches. Try a different term or a nearby landmark."
          : null
      );
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(r: GeocodeResult) {
    onPick(r);
    setOpen(false);
    setResults([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !results.length) {
      if (e.key === "Enter" && results.length) {
        e.preventDefault();
        pick(results[0]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && openSelf()}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-transparent text-sm focus:outline-none disabled:opacity-50 ${
          error ? "text-red-500" : ""
        } ${className}`}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">
          …
        </span>
      )}
      {open && (results.length > 0 || emptyMsg) && (
        <div className="absolute left-0 top-full mt-1 z-30 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg overflow-hidden max-h-64 overflow-y-auto w-[320px] max-w-[min(420px,calc(100vw-2rem))]">
          {results.length === 0 && emptyMsg && (
            <div className="px-3 py-3 text-xs text-[var(--muted)]">{emptyMsg}</div>
          )}
          {results.map((r, i) => {
            const primary = r.displayName.split(",")[0];
            const rest = r.displayName.split(",").slice(1, 3).join(",").trim();
            return (
              <button
                key={i}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => pick(r)}
                className={`w-full text-left px-3 py-2 text-sm flex flex-col ${
                  i === activeIdx
                    ? "bg-[var(--border)]/40"
                    : "hover:bg-[var(--border)]/20"
                }`}
              >
                <span className="text-[var(--foreground)] truncate font-medium">
                  {primary}
                </span>
                {rest && (
                  <span className="text-[11px] text-[var(--muted)] truncate">
                    {rest}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
