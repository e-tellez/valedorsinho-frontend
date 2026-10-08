"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { apiFetch, apiPut } from "@/lib/adyen/api";
import StatusBanner from "@/components/adyen/shared/StatusBanner";
import FieldRow from "@/components/adyen/shared/FieldRow";
import type { AdyenSetupConfig } from "@/lib/adyen/types";

export default function SetupForm({ isWelcome = false }: { isWelcome?: boolean }) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [clientKey, setClientKey] = useState("");
  const [merchantAccount, setMerchantAccount] = useState("");
  const [locked, setLocked] = useState(false);
  const [canConfigure, setCanConfigure] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setStatus(null);
    try {
      const config = await apiFetch<AdyenSetupConfig>("/api/auth/config");
      setApiKeyConfigured(config.apiKeyConfigured);
      setClientKey(config.clientKey);
      setMerchantAccount(config.merchantAccount);
      setLocked(config.locked);
      setCanConfigure(config.canConfigure);
    } catch (err) {
      setLoadError(true);
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to load configuration.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const config = await apiPut<AdyenSetupConfig>("/api/auth/config", {
        apiKey: apiKey || undefined,
        clientKey,
        merchantAccount,
      });
      setApiKey("");
      setApiKeyConfigured(config.apiKeyConfigured);
      setStatus({ type: "success", msg: "Configuration saved successfully." });
      if (isWelcome) {
        setTimeout(() => router.push("/"), 1200);
      }
    } catch (err) {
      setStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to save configuration.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-7 space-y-5">
      {/* API Key */}
      <FieldRow label="API Key">
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={apiKeyConfigured ? "Configured — leave blank to keep" : "AQE..."}
            autoComplete="off"
            disabled={loading || locked || !canConfigure}
            className="field-input pr-10 disabled:bg-gray-50 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowApiKey((v) => !v)}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </FieldRow>

      {/* Client Key */}
      <FieldRow label="Client Key">
        <input
          type="text"
          value={clientKey}
          onChange={(e) => setClientKey(e.target.value)}
          placeholder="test_..."
          autoComplete="off"
          disabled={loading || locked || !canConfigure}
          className="field-input disabled:bg-gray-50 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
        />
      </FieldRow>

      {/* Merchant Account */}
      <FieldRow label="Merchant Account">
        <input
          type="text"
          value={merchantAccount}
          onChange={(e) => setMerchantAccount(e.target.value)}
          placeholder="YourMerchantAccountECOM"
          autoComplete="off"
          disabled={loading || locked || !canConfigure}
          className="field-input disabled:bg-gray-50 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
        />
      </FieldRow>

      {/* Status feedback */}
      {status && <StatusBanner msg={status.msg} type={status.type} />}

      {loadError ? (
        <button type="button" onClick={loadConfig} className="btn-primary w-full h-11! mt-2">
          Retry
        </button>
      ) : locked || !canConfigure ? (
        <p className="text-sm text-center text-gray-400 dark:text-slate-500 py-1">
          {locked ? "Configuration is managed by an admin." : "Your role cannot change this configuration."}
        </p>
      ) : (
        <button
          type="submit"
          disabled={saving || loading}
          className="btn-primary w-full h-11! mt-2 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : "Save Configuration"}
        </button>
      )}
    </form>
  );
}
