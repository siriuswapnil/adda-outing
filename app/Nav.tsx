"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan" },
  { href: "/dashboard", label: "Wrapped" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
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
    </nav>
  );
}
