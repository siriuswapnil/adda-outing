import { Suspense } from "react";
import InviteCard from "./InviteCard";

export default function InvitePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <Suspense fallback={<div className="text-[var(--muted)]">Loading…</div>}>
        <InviteCard />
      </Suspense>
    </main>
  );
}
