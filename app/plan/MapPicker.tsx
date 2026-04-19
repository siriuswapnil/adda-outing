"use client";

import { useEffect, useRef, useState } from "react";
import { planMeeting, type LatLng } from "@/lib/midpoint";
import { getUser, getPlans, savePlan, type SavedPlan } from "@/lib/auth";
import { captureEvent } from "@/lib/analytics";

const BBOX = {
  minLat: 12.89,
  maxLat: 13.0,
  minLng: 77.55,
  maxLng: 77.68,
};

function lngToTileX(lng: number, z: number) {
  return ((lng + 180) / 360) * Math.pow(2, z);
}
function latToTileY(lat: number, z: number) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, z)
  );
}
function tileXToLng(x: number, z: number) {
  return (x / Math.pow(2, z)) * 360 - 180;
}
function tileYToLat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const ZOOM = 12;
const TILE_SIZE = 256;
const tileXMin = Math.floor(lngToTileX(BBOX.minLng, ZOOM));
const tileXMax = Math.floor(lngToTileX(BBOX.maxLng, ZOOM));
const tileYMin = Math.floor(latToTileY(BBOX.maxLat, ZOOM));
const tileYMax = Math.floor(latToTileY(BBOX.minLat, ZOOM));
const COLS = tileXMax - tileXMin + 1;
const ROWS = tileYMax - tileYMin + 1;

function project(lat: number, lng: number) {
  const px =
    (lngToTileX(lng, ZOOM) - tileXMin) / COLS;
  const py =
    (latToTileY(lat, ZOOM) - tileYMin) / ROWS;
  return { x: px * 100, y: py * 100 };
}

function unproject(px: number, py: number): LatLng {
  const tx = tileXMin + px * COLS;
  const ty = tileYMin + py * ROWS;
  return { lat: tileYToLat(ty, ZOOM), lng: tileXToLng(tx, ZOOM) };
}

const FRIEND_NAMES = ["Aarav", "Diya", "Kabir", "Meera"];

type Pin = LatLng & { name: string };

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
  const ref = useRef<HTMLDivElement>(null);

  // Load user + plans on mount and whenever inviteUrl changes
  useEffect(() => {
    const u = getUser();
    setUserLocal(u);
    if (u) setMyPlans(getPlans(u));
  }, [inviteUrl]);

  const tiles: { x: number; y: number; url: string }[] = [];
  for (let ty = tileYMin; ty <= tileYMax; ty++) {
    for (let tx = tileXMin; tx <= tileXMax; tx++) {
      tiles.push({
        x: tx - tileXMin,
        y: ty - tileYMin,
        url: `https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`,
      });
    }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (pins.length >= 4 || result) return;
    const rect = ref.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const { lat, lng } = unproject(px, py);
    setPins((prev) => [...prev, { lat, lng, name: FRIEND_NAMES[prev.length] }]);
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
    setPins(EXAMPLE_PINS);
    // Auto-run Find after a short delay so the pins visually drop first
    setTimeout(() => {
      setResult(planMeeting(EXAMPLE_PINS));
    }, 450);
  }

  const midProj = result ? project(result.midpoint.lat, result.midpoint.lng) : null;
  const suggestionProjs = result
    ? result.suggestions.map((s) => ({
        ...project(s.cafe.lat, s.cafe.lng),
        name: s.cafe.name,
      }))
    : [];

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
            ? "Click anywhere on the map to drop a pin for each friend — or try an example."
            : pins.length < 4 && !result
              ? `Click the map to add ${FRIEND_NAMES[pins.length]}'s location (${pins.length}/4)`
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

      {/* Main row: map animates from full-width → left, cards fade in from right */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
      {/* Map — animated width */}
      <div
        ref={ref}
        onClick={handleClick}
        className={`relative aspect-[4/3] rounded-2xl overflow-hidden cursor-crosshair border border-[var(--border)] bg-[var(--card)] transition-all duration-700 ease-in-out mx-auto ${
          result ? "md:basis-[50%] md:max-w-none" : "md:basis-full md:max-w-3xl"
        } basis-full shrink-0 w-full`}
      >
        {/* Tile grid */}
        <div
          className="absolute inset-0"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {tiles.map((t, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={t.url}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              style={{
                gridColumnStart: t.x + 1,
                gridRowStart: t.y + 1,
              }}
            />
          ))}
        </div>

        {/* Empty-state pulsing hint dot — centered on the map */}
        {pins.length === 0 && !result && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative flex flex-col items-center gap-2">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-[var(--accent)] border-2 border-white shadow" />
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--foreground)] bg-[var(--card)]/90 px-2 py-1 rounded-md border border-[var(--border)]">
                Click anywhere
              </span>
            </div>
          </div>
        )}

        {/* Friend pins */}
        {pins.map((p, i) => {
          const { x, y } = project(p.lat, p.lng);
          return (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -100%)" }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-[var(--foreground)] text-white text-xs px-2 py-0.5 rounded-md whitespace-nowrap">
                  {p.name}
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[var(--foreground)]" />
              </div>
            </div>
          );
        })}

        {/* Midpoint marker */}
        {midProj && (
          <div
            className="absolute pointer-events-none"
            style={{ left: `${midProj.x}%`, top: `${midProj.y}%`, transform: "translate(-50%,-50%)" }}
          >
            <div className="w-4 h-4 rounded-full bg-white border-2 border-[var(--foreground)] shadow" />
          </div>
        )}

        {/* Suggestion pins — ranked 1/2/3 */}
        {suggestionProjs.map((s, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -100%)" }}
          >
            <div className="flex flex-col items-center">
              <div
                className={`text-white text-xs font-medium px-3 py-1 rounded-lg whitespace-nowrap shadow flex items-center gap-1.5 ${
                  i === 0 ? "bg-[var(--accent)]" : "bg-[var(--foreground)]/80"
                }`}
              >
                <span className="font-bold">#{i + 1}</span>
                <span>{s.name}</span>
              </div>
              <div
                className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${
                  i === 0 ? "border-t-[var(--accent)]" : "border-t-[var(--foreground)]/80"
                }`}
              />
            </div>
          </div>
        ))}
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
