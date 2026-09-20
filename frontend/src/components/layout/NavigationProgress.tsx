"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Phase = "idle" | "running" | "done";

/**
 * A thin gold bar at the top of the screen. It starts when someone clicks a link to another page, creeps
 * forward while the next page loads, and completes when the address changes, so every navigation gives
 * immediate feedback.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const lastPath = useRef(pathname);

  // The page changed: finish the bar, then hide it.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setPhase("done");
    const timer = setTimeout(() => setPhase("idle"), 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  // A link to a different page was clicked: start the bar. A safety timeout hides it if nothing happens.
  useEffect(() => {
    let safety: ReturnType<typeof setTimeout> | undefined;
    function onClick(event: MouseEvent) {
      // Not checking defaultPrevented: Next's Link cancels the browser's own navigation to do it client-side.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const link = target?.closest?.("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      // A button inside a link (like the wishlist heart on a product card) does something else, not navigation.
      const control = target?.closest?.("button, input, select, textarea, [role='button']");
      if (control && link.contains(control)) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setPhase("running");
      clearTimeout(safety);
      safety = setTimeout(() => setPhase("idle"), 10_000);
    }
    // Capture phase, so this runs before any click handler can change what happens next.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(safety);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className={cn(
          "h-full bg-gold shadow-[0_0_8px_var(--color-gold)]",
          phase === "running" && "animate-[nav-progress_8s_ease-out_forwards] motion-reduce:animate-none motion-reduce:w-2/3",
          phase === "done" && "w-full opacity-0 transition-[width,opacity] duration-300",
          phase === "idle" && "w-0 opacity-0",
        )}
      />
    </div>
  );
}
