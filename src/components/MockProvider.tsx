"use client";

import { useEffect, useState } from "react";

export default function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initMSW() {
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
      setReady(true);
    }
    initMSW();
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
