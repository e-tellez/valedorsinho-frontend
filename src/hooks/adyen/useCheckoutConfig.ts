"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/adyen/api";
import type { ClientConfig } from "@/lib/adyen/types";

/**
 * Fetch the Adyen client-side config from GET /api/config/client (FastAPI).
 * Requires a valid Supabase session — JWT is attached automatically by apiFetch.
 * Returns { clientKey, environment, merchantAccount } or null while loading.
 */
export function useCheckoutConfig() {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ClientConfig>("/api/config/client")
      .then((data) => setConfig(data))
      .catch((error_) => setError(error_.message));
  }, []);

  const loading = config === null && error === null;
  return { config, error, loading };
}
