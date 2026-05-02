"use client";

import { useEffect, useState } from "react";

/**
 * Registers the service worker on mount.
 * Renders nothing — purely a side-effect component.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Fail silently — app works fine without the SW.
        });
    }
  }, []);

  return null;
}

/**
 * Shows a one-time "Add to Home Screen" hint for iOS Safari users.
 * iOS doesn't show a native install prompt, so we show our own.
 * Dismissed state is persisted to localStorage.
 */
export function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari that hasn't already installed the app.
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // iPadOS 13+ reports as Macintosh with touch support
      (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

    const isInStandaloneMode =
      "standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true;

    const dismissed = localStorage.getItem("ios-install-hint-dismissed");

    if (isIos && !isInStandaloneMode && !dismissed) {
      // Small delay so it doesn't flash immediately on load.
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-surface shadow-xl p-4">
      <div className="flex items-start gap-3">
        {/* App icon preview */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-192.png"
          alt="GigBook"
          className="h-12 w-12 rounded-xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Install GigBook
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Tap{" "}
            <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
              <ShareIcon />
              Share
            </span>{" "}
            then{" "}
            <span className="font-medium text-foreground">
              Add to Home Screen
            </span>{" "}
            to install.
          </p>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem("ios-install-hint-dismissed", "1");
            setShow(false);
          }}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
