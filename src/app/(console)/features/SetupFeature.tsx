"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { apiFetch, apiPut } from "@/lib/adyen/api";
import type { AdyenSetupConfig } from "@/lib/adyen/types";

type Status = { type: "ok" | "err"; msg: string };

export default function SetupFeature() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [clientKey, setClientKey] = useState("");
  const [merchantAccount, setMerchantAccount] = useState("");
  const [environment, setEnvironment] = useState<"test" | "live">("test");
  const [locked, setLocked] = useState(false);
  const [canConfigure, setCanConfigure] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setStatus(null);
    try {
      const config = await apiFetch<AdyenSetupConfig>("/api/auth/config");
      setApiKeyConfigured(config.apiKeyConfigured);
      setClientKey(config.clientKey);
      setMerchantAccount(config.merchantAccount);
      setEnvironment(config.environment);
      setLocked(config.locked);
      setCanConfigure(config.canConfigure);
    } catch (err) {
      setLoadError(true);
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed to load configuration." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

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
      setStatus({ type: "ok", msg: "Configuration saved successfully." });
    } catch (err) {
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed to save configuration." });
    } finally {
      setSaving(false);
    }
  }

  const disabled = loading || locked || !canConfigure;

  return (
    <div className="cb-main">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Set Up</h1>
          <p className="cb-head__sub">
            Configure your Adyen API key, client key and merchant account. Every demo runs against
            this <code>{environment.toUpperCase()}</code> environment.
          </p>
        </div>
      </header>

      <div className="cb-panel" style={{ maxWidth: 560 }}>
        <div className="cb-panel__hd"><h3>Credentials · {environment}</h3></div>
        <div className="cb-panel__bd">
          <form onSubmit={handleSubmit}>
            <div className="cb-field">
              <label htmlFor="setup-api-key">API Key</label>
              <div className="cb-inputwrap">
                <input
                  id="setup-api-key"
                  className="cb-input"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={apiKeyConfigured ? "Configured — leave blank to keep" : "AQE..."}
                  autoComplete="off"
                  disabled={disabled}
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  className="cb-eye"
                  onClick={() => setShowApiKey((v) => !v)}
                  tabIndex={-1}
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="cb-field">
              <label htmlFor="setup-client-key">Client Key</label>
              <input
                id="setup-client-key"
                className="cb-input"
                type="text"
                value={clientKey}
                onChange={(e) => setClientKey(e.target.value)}
                placeholder="test_..."
                autoComplete="off"
                disabled={disabled}
              />
            </div>

            <div className="cb-field">
              <label htmlFor="setup-merchant">Merchant Account</label>
              <input
                id="setup-merchant"
                className="cb-input"
                type="text"
                value={merchantAccount}
                onChange={(e) => setMerchantAccount(e.target.value)}
                placeholder="YourMerchantAccountECOM"
                autoComplete="off"
                disabled={disabled}
              />
            </div>

            {status && (
              <div className={`cb-banner cb-banner--${status.type}`} style={{ marginTop: 4, marginBottom: 16 }}>
                {status.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{status.msg}</span>
              </div>
            )}

            {loadError ? (
              <button type="button" className="cb-btn cb-btn--accent cb-btn--block" onClick={loadConfig}>
                Retry
              </button>
            ) : locked || !canConfigure ? (
              <p className="cb-note">
                <Lock size={13} />
                {locked ? "Configuration is managed by an admin." : "Your role cannot change this configuration."}
              </p>
            ) : (
              <button type="submit" className="cb-btn cb-btn--accent cb-btn--block" disabled={saving || loading}>
                {(saving || loading) && <Loader2 size={14} className="cb-spin" />}
                {saving ? "Saving…" : loading ? "Loading…" : "Save Configuration"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
