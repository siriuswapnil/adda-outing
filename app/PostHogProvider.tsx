"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, capturePageview } from "@/lib/analytics";

export default function PostHogProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    capturePageview(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}
