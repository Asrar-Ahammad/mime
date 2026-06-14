"use client";

import { useEffect, useState, createContext, useContext } from "react";

interface PwaContextType {
  deferredPrompt: any;
  clearPrompt: () => void;
}

const PwaContext = createContext<PwaContextType>({
  deferredPrompt: null,
  clearPrompt: () => {},
});

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(err => console.error("SW registration failed", err));
    }

    // Check if the event was already captured by the inline script in layout.tsx
    if ((window as any).__deferredPrompt) {
      setDeferredPrompt((window as any).__deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const clearPrompt = () => setDeferredPrompt(null);

  return (
    <PwaContext.Provider value={{ deferredPrompt, clearPrompt }}>
      {children}
    </PwaContext.Provider>
  );
}

export const usePwa = () => useContext(PwaContext);
