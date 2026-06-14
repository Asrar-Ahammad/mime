"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Info } from "lucide-react";

export function PwaInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Register service worker for PWA functionality
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(err => console.error("SW registration failed", err));
    }

    // Capture the install prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Installed</CardTitle>
          <CardDescription>
            You are currently using the installed version of this app.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install App</CardTitle>
        <CardDescription>
          Install this application on your device for a better experience and offline support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isIOS ? (
          <div className="bg-muted p-4 rounded-md flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm">
              To install this app on your iOS device, tap the share button and then <span className="font-semibold">"Add to Home Screen"</span>.
            </p>
          </div>
        ) : (
          <Button onClick={handleInstallClick} disabled={!deferredPrompt} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Install as App
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
