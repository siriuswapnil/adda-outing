"use client";

import { useEffect, useState } from "react";
import { planMeeting } from "@/lib/midpoint";
import { getUser, getPlans, savePlan, type SavedPlan } from "@/lib/auth";
import { captureEvent } from "@/lib/analytics";
import { geocode } from "@/lib/geocode";
import LiveMap from "./LiveMap";

const DEFAULT_FRIEND_NAMES = ["Aarav", "Diya", "Kabir", "Meera"];

type Pin = { lat: number; lng: number; name: string };

export default function MapPicker() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [result, setResult] =
    useState<ReturnType<typeof planMeeting> | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [groupName, setGroupName] = useState("The Bangalore Crew");
  const [meetDate, setMeetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [meetTime, setMeetTime] = useState("19:00");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUserLocal] = useState<string | null>(null);
  const [myPlans, setMyPlans] = useState<SavedPlan[]>([]);
  // Editable friend names (defaults to preset)
  const [friendNames, setFriendNames] = useState<string[]>(DEFAULT_FRIEND_NAMES);
  // Per-friend address input state: {value, status}
  const [addrInputs, setAddrInputs] = useState<
    { value: string; status: "idle" | "loading" | "error" }[]
  >(() => DEFAULT_FRIEND_NAMES.map(() => ({ value: "", status: "idle" as const })));


  // Load user + plans on mount and whenever inviteUrl changes
  useEffect(() => {
    const u = getUser();
    setUserLocal(u);
    if (u) setMyPlans(getPlans(u));
  }, [inviteUrl]);

  // Friend already has a pin?
  function hasPin(friendName: string) {
    return pins.some((p) => p.name === friendName);
  }

  async function handleAddressSubmit(friendIdx: number) {
    if (result) return;
    const value = addrInputs[friendIdx]?.value.trim();
    if (!value) return;
    const friendName = friendNames[friendIdx];
    // If this friend already has a pin, replace it
    setAddrInputs((prev) => {
      const next = [...prev];
      next[friendIdx] = { ...next[friendIdx], status: "loading" };
      return next;
    });
    const hit = await geocode(value);
    if (!hit) {
      setAddrInputs((prev) => {
        const next = [...prev];
        next[friendIdx] = { ...next[friendIdx], status: "error" };
        return next;
      });
      return;
    }
    setPins((prev) => {
      const without = prev.filter((p) => p.name !== friendName);
      return [...without, { lat: hit.lat, lng: hit.lng, name: friendName }];
    });
    setAddrInputs((prev) => {
      const next = [...prev];
      next[friendIdx] = { value: hit.displayName.split(",")[0], status: "idle" };
      return next;
    });
  }

  function handleFind() {
    if (pins.length < 2) return;
    const r = planMeeting(pins);
    setResult(r);
    captureEvent("plan_created", {
      pin_count: pins.length,
      top_cafe: r.suggestions[0]?.cafe.name,
      top_hood: r.suggestions[0]?.cafe.neighborhood,
    });
  }

  function handleReset() {
    setPins([]);
    setResult(null);
    setSelectedIdx(null);
    setShowConfirm(false);
    setInviteUrl(null);
    setCopied(false);
    setAddrInputs(
      DEFAULT_FRIEND_NAMES.map(() => ({ value: "", status: "idle" as const }))
    );
    setFriendNames(DEFAULT_FRIEND_NAMES);
  }

  function handleCreateInvite() {
    if (selectedIdx === null || !result) return;
    const cafe = result.suggestions[selectedIdx].cafe;
    const currentUser = getUser();
    const params = new URLSearchParams({
      cafe: cafe.name,
      hood: cafe.neighborhood,
      photo: cafe.photo,
      vibe: cafe.vibe,
      date: meetDate,
      time: meetTime,
      group: groupName,
      host: currentUser || pins[0]?.name || "A friend",
      friends: String(pins.length),
    });
    const url = `${window.location.origin}/invite?${params.toString()}`;
    setInviteUrl(url);

    captureEvent("invite_generated", {
      cafe: cafe.name,
      hood: cafe.neighborhood,
      group: groupName,
      signed_in: !!currentUser,
    });

    // Persist if signed in
    if (currentUser) {
      savePlan(currentUser, {
        id: `${Date.now()}`,
        cafe: cafe.name,
        hood: cafe.neighborhood,
        photo: cafe.photo,
        date: meetDate,
        time: meetTime,
        group: groupName,
        inviteUrl: url,
        createdAt: Date.now(),
      });
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  // Preset Bangalore friends (scattered across neighborhoods)
  const EXAMPLE_PINS: Pin[] = [
    { name: "Aarav", lat: 12.9719, lng: 77.6412 }, // Indiranagar
    { name: "Diya", lat: 12.9352, lng: 77.6245 },  // Koramangala
    { name: "Kabir", lat: 12.9250, lng: 77.5938 }, // Jayanagar
    { name: "Meera", lat: 12.9116, lng: 77.6473 }, // HSR
  ];

  function handleTryExample() {
    setFriendNames(DEFAULT_FRIEND_NAMES);
    setPins(EXAMPLE_PINS);
    // Auto-run Find after a short delay so the pins visually drop first
    setTimeout(() => {
      setResult(planMeeting(EXAMPLE_PINS));
    }, 450);
  }

  return (
    <div
      className={`mx-auto transition-[max-width] duration-700 ease-in-out ${
        result ? "max-w-[1400px]" : "max-w-5xl"
      }`}
    >
      {/* My plans — visible when signed in + has plans + no active flow */}
      {user && myPlans.length > 0 && !result && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
              Your plans · {myPlans.length}
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {myPlans.map((p) => (
              <a
                key={p.id}
                href={p.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--accent)] transition"
              >
                <div className="relative aspect-[16/9] bg-[var(--background)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.photo}
                    alt={p.cafe}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-[family-name:var(--font-serif)] text-base truncate leading-tight">
                    {p.cafe}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 truncate">
                    {p.hood} ·{" "}
                    {new Date(`${p.date}T${p.time}`).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short" }
                    )}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="text-sm text-[var(--muted)]">
          {pins.length === 0 && !result
            ? "Type an address for each friend, or click the map directly. You can also try an example."
            : pins.length < 4 && !result
              ? `${pins.length}/4 friends placed. Add ${friendNames[pins.length] || "the next friend"} above or by clicking the map.`
              : result
                ? "Meeting spot found"
                : "4 locations added. Ready to find the meeting spot."}
        </div>
        <div className="flex gap-2">
          {pins.length === 0 && !result && (
            <button
              onClick={handleTryExample}
              className="px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)]/30 transition"
            >
              ✨ Try an example
            </button>
          )}
          <button
            onClick={handleFind}
            disabled={pins.length < 2 || !!result}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-40"
          >
            Find meeting spot
          </button>
          <button
            onClick={handleReset}
            disabled={pins.length === 0 && !result}
            className="px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Address inputs — hide once a result is shown */}
      {!result && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {friendNames.map((name, i) => {
            const hp = hasPin(name);
            const st = addrInputs[i];
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 bg-[var(--card)] transition ${
                  hp
                    ? "border-[var(--accent)]"
                    : st.status === "error"
                      ? "border-red-400"
                      : "border-[var(--border)]"
                }`}
              >
                {hp && (
                  <span className="text-[var(--accent)] shrink-0 text-xs font-bold">
                    ✓
                  </span>
                )}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFriendNames((prev) => {
                      const next = [...prev];
                      next[i] = newName;
                      return next;
                    });
                    // Also rename any existing pin for this friend
                    setPins((prev) =>
                      prev.map((p) => (p.name === name ? { ...p, name: newName } : p))
                    );
                  }}
                  placeholder="Friend name"
                  className={`w-20 shrink-0 bg-transparent text-[10px] font-bold uppercase tracking-wider focus:outline-none ${
                    hp ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                />
                <input
                  type="text"
                  value={st.value}
                  onChange={(e) =>
                    setAddrInputs((prev) => {
                      const next = [...prev];
                      next[i] = { value: e.target.value, status: "idle" };
                      return next;
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddressSubmit(i);
                  }}
                  placeholder="Indiranagar, Koramangala…"
                  disabled={st.status === "loading"}
                  className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none disabled:opacity-50"
                />
                {st.status === "loading" && (
                  <span className="text-[10px] text-[var(--muted)] shrink-0">
                    …
                  </span>
                )}
                {st.status === "error" && (
                  <span className="text-[10px] text-red-500 shrink-0">
                    not found
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main row: map animates from full-width → left, cards fade in from right */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
      {/* Map — animated width */}
      <div
        className={`relative aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)] transition-all duration-700 ease-in-out mx-auto ${
          result ? "md:basis-[50%] md:max-w-none" : "md:basis-full md:max-w-3xl"
        } basis-full shrink-0 w-full`}
      >
        <LiveMap
          pins={pins}
          midpoint={result ? result.midpoint : null}
          suggestions={
            result
              ? result.suggestions.map((s, i) => ({
                  lat: s.cafe.lat,
                  lng: s.cafe.lng,
                  name: s.cafe.name,
                  rank: i + 1,
                }))
              : []
          }
          onMapClick={(lat, lng) => {
            if (pins.length >= 4 || result) return;
            setPins((prev) => [
              ...prev,
              { lat, lng, name: friendNames[prev.length] || `Friend ${prev.length + 1}` },
            ]);
          }}
          clickEnabled={pins.length < 4 && !result}
          resizeKey={result ? "split" : "full"}
        />
      </div>

      {/* Suggestion cards — fade in from right */}
      <div
        className={`flex flex-col min-h-0 flex-1 transition-all duration-700 ease-in-out ${
          result
            ? "opacity-100 translate-x-0 md:basis-[50%]"
            : "opacity-0 translate-x-4 md:basis-0 md:overflow-hidden md:pointer-events-none"
        }`}
      >
        {result && !showConfirm && (
          <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              {selectedIdx === null ? "Pick your spot" : "Selected — ready to invite"}
            </p>
            {selectedIdx !== null && (
              <button
                onClick={() => setShowConfirm(true)}
                className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-medium shadow hover:opacity-90 transition"
              >
                Confirm & invite friends →
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {result.suggestions.map((s, i) => {
              const isTop = i === 0;
              const isSelected = selectedIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`text-left rounded-2xl overflow-hidden border flex flex-1 min-h-0 transition-all ${
                    isSelected
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)] shadow-lg scale-[1.01]"
                      : isTop
                        ? "border-[var(--accent)]/60 shadow-sm hover:shadow-md"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                  }`}
                >
                  {/* Photo */}
                  <div className="relative w-2/5 shrink-0 bg-[var(--card)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.cafe.photo}
                      alt={s.cafe.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isTop ? "bg-[var(--accent)] text-white" : "bg-black/70 text-white"
                      }`}
                    >
                      #{i + 1}
                      {isTop ? " · Best" : ""}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[var(--accent)] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="bg-[var(--card)] p-4 flex-1 flex flex-col min-w-0">
                    <p className="font-[family-name:var(--font-serif)] text-xl leading-tight text-[var(--foreground)] truncate">
                      {s.cafe.name}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {s.cafe.neighborhood}
                    </p>
                    <p className="text-xs text-[var(--foreground)]/80 italic mt-2 leading-snug line-clamp-3">
                      &ldquo;{s.cafe.vibe}&rdquo;
                    </p>
                    <div className="mt-auto pt-2 flex justify-between text-[10px] text-[var(--muted)]">
                      <span>Max: {s.maxTravelKm.toFixed(1)} km</span>
                      <span>Avg: {s.avgTravelKm.toFixed(1)} km</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          </>
        )}

        {/* Confirm panel */}
        {result && showConfirm && selectedIdx !== null && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Set the details
              </p>
              <button
                onClick={() => { setShowConfirm(false); setInviteUrl(null); }}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ← Back
              </button>
            </div>

            {/* Selected café summary */}
            <div className="rounded-2xl overflow-hidden border border-[var(--accent)] bg-[var(--card)] flex mb-4 shrink-0">
              <div className="relative w-1/3 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.suggestions[selectedIdx].cafe.photo}
                  alt={result.suggestions[selectedIdx].cafe.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-bold">Meeting at</p>
                <p className="font-[family-name:var(--font-serif)] text-xl leading-tight truncate">
                  {result.suggestions[selectedIdx].cafe.name}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {result.suggestions[selectedIdx].cafe.neighborhood}
                </p>
              </div>
            </div>

            {!inviteUrl ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] block mb-1">
                      Group name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] block mb-1">Date</label>
                      <input
                        type="date"
                        value={meetDate}
                        onChange={(e) => setMeetDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] block mb-1">Time</label>
                      <input
                        type="time"
                        value={meetTime}
                        onChange={(e) => setMeetTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCreateInvite}
                  className="mt-4 w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-medium shadow hover:opacity-90 transition"
                >
                  Create shareable invite →
                </button>
              </>
            ) : (
              <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mb-2">
                  Share this link on WhatsApp
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs font-mono truncate"
                  />
                  <button
                    onClick={copyInvite}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-[var(--accent)] text-white hover:opacity-90"
                    }`}
                  >
                    {copied ? "✓ Copied" : "Copy link"}
                  </button>
                </div>
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center text-xs text-[var(--accent)] hover:underline"
                >
                  Preview invite page →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
