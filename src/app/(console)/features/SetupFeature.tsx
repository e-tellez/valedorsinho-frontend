"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, Lock,
  Plus, Pencil, Trash2, Check,
} from "lucide-react";
import { apiDelete, apiFetch, apiGet, apiPost, apiPut } from "@/lib/adyen/api";
import type { AccountListResponse, AdyenAccount, AdyenSetupConfig } from "@/lib/adyen/types";

type Status = { type: "ok" | "err"; msg: string };

interface FormState {
  id: string | null; // null => creating a new account
  label: string;
  apiKey: string;
  clientKey: string;
  merchantAccount: string;
  apiKeyConfigured: boolean;
}

const EMPTY_FORM: FormState = {
  id: null, label: "", apiKey: "", clientKey: "", merchantAccount: "", apiKeyConfigured: false,
};

export default function SetupFeature() {
  const [accounts, setAccounts] = useState<AdyenAccount[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [environment, setEnvironment] = useState<"test" | "live">("test");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const config = await apiFetch<AdyenSetupConfig>("/api/auth/config").catch(() => null);
      const manage = config ? config.role === "admin" || config.role === "im" : false;
      setCanManage(manage);
      if (config) setEnvironment(config.environment);
      if (manage) {
        const list = await apiGet<AccountListResponse>("/api/auth/accounts");
        setAccounts(list.accounts ?? []);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      setLoadError(true);
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed to load accounts." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setShowApiKey(false);
    setStatus(null);
  }

  function openEdit(account: AdyenAccount) {
    setForm({
      id: account.id,
      label: account.label,
      apiKey: "",
      clientKey: account.clientKey,
      merchantAccount: account.merchantAccount,
      apiKeyConfigured: account.apiKeyConfigured,
    });
    setShowApiKey(false);
    setStatus(null);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setStatus(null);
    try {
      if (form.id === null) {
        await apiPost("/api/auth/accounts", {
          label: form.label,
          apiKey: form.apiKey,
          clientKey: form.clientKey,
          merchantAccount: form.merchantAccount,
        });
      } else {
        await apiPut(`/api/auth/accounts/${form.id}`, {
          label: form.label,
          apiKey: form.apiKey || undefined,
          clientKey: form.clientKey,
          merchantAccount: form.merchantAccount,
        });
      }
      setForm(null);
      setShowApiKey(false);
      await load();
      setStatus({ type: "ok", msg: form.id === null ? "Account created." : "Account updated." });
    } catch (err) {
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed to save account." });
    } finally {
      setSaving(false);
    }
  }

  async function activate(account: AdyenAccount) {
    setBusyId(account.id);
    setStatus(null);
    try {
      await apiPut(`/api/auth/accounts/${account.id}/activate`, {});
      await load();
      setStatus({ type: "ok", msg: `Switched active account to ${account.label || account.merchantAccount}.` });
    } catch (err) {
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed to switch account." });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(account: AdyenAccount) {
    if (!window.confirm(`Delete the account "${account.label || account.merchantAccount}"? This cannot be undone.`)) return;
    setBusyId(account.id);
    setStatus(null);
    try {
      await apiDelete(`/api/auth/accounts/${account.id}`);
      await load();
      setStatus({ type: "ok", msg: "Account deleted." });
    } catch (err) {
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed to delete account." });
    } finally {
      setBusyId(null);
    }
  }

  const creating = form?.id === null;

  return (
    <div className="cb-main">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Set Up</h1>
          <p className="cb-head__sub">
            Manage your Adyen company accounts. The <b>active</b> account&apos;s credentials power every
            demo, which all run against <code>{environment.toUpperCase()}</code>.
          </p>
        </div>
        {canManage && !form && (
          <button className="cb-btn" onClick={openAdd} disabled={loading}>
            <Plus size={14} /> Add account
          </button>
        )}
      </header>

      {status && (
        <div className={`cb-banner cb-banner--${status.type === "ok" ? "ok" : "err"}`} style={{ marginBottom: 18, maxWidth: 640 }}>
          {status.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{status.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="cb-skel-list" style={{ maxWidth: 640 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="cb-skel" />)}
        </div>
      ) : !canManage ? (
        <div className="cb-panel" style={{ maxWidth: 640 }}>
          <div className="cb-panel__bd">
            <p className="cb-note"><Lock size={13} /> Your role cannot manage company accounts.</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="cb-panel" style={{ maxWidth: 640 }}>
          <div className="cb-panel__bd">
            <button className="cb-btn cb-btn--accent cb-btn--block" onClick={load}>Retry</button>
          </div>
        </div>
      ) : (
        <div className="cb-panel" style={{ maxWidth: 640 }}>
          <div className="cb-panel__hd"><h3>Company accounts · {environment}</h3></div>
          <div className="cb-panel__bd" style={{ padding: 0 }}>
            {accounts.length === 0 ? (
              <div className="cb-empty"><p>No accounts yet — add one to get started.</p></div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="cb-acctrow">
                  <div className="cb-acctrow__main">
                    <b>
                      {account.label || "Untitled account"}
                      {account.isActive && <span className="cb-pill cb-pill--ok">ACTIVE</span>}
                      {account.locked && <Lock size={12} />}
                    </b>
                    <span className="cb-acctrow__meta">{account.merchantAccount} · {account.clientKey}</span>
                  </div>
                  <div className="cb-acctrow__actions">
                    {!account.isActive && (
                      <button className="cb-btn cb-btn--sm" onClick={() => activate(account)} disabled={busyId === account.id} title="Make active">
                        {busyId === account.id ? <Loader2 size={13} className="cb-spin" /> : <Check size={13} />} Use
                      </button>
                    )}
                    <button className="cb-btn cb-btn--sm" onClick={() => openEdit(account)} disabled={account.locked} title={account.locked ? "Locked" : "Edit"}>
                      <Pencil size={13} />
                    </button>
                    <button className="cb-btn cb-btn--sm" onClick={() => remove(account)} disabled={account.locked || busyId === account.id} title={account.locked ? "Locked" : "Delete"}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {form && (
        <div className="cb-panel" style={{ maxWidth: 640, marginTop: 18 }}>
          <div className="cb-panel__hd"><h3>{creating ? "Add account" : "Edit account"}</h3></div>
          <div className="cb-panel__bd cb-panel__bd--form">
            <form onSubmit={submitForm}>
              <div className="cb-field">
                <label htmlFor="acct-label">Label <span className="cb-field__hint">optional — a name to recognise this account</span></label>
                <input id="acct-label" className="cb-input" type="text" value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Primary ECOM" autoComplete="off" />
              </div>

              <div className="cb-field">
                <label htmlFor="acct-api-key">API Key</label>
                <div className="cb-inputwrap">
                  <input id="acct-api-key" className="cb-input" type={showApiKey ? "text" : "password"} value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder={form.apiKeyConfigured ? "Configured — leave blank to keep" : "AQE..."}
                    autoComplete="off" style={{ paddingRight: 38 }} />
                  <button type="button" className="cb-eye" onClick={() => setShowApiKey((v) => !v)} tabIndex={-1}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}>
                    {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="cb-field">
                <label htmlFor="acct-client-key">Client Key</label>
                <input id="acct-client-key" className="cb-input" type="text" value={form.clientKey}
                  onChange={(e) => setForm({ ...form, clientKey: e.target.value })} placeholder="test_..." autoComplete="off" />
              </div>

              <div className="cb-field">
                <label htmlFor="acct-merchant">Merchant Account</label>
                <input id="acct-merchant" className="cb-input" type="text" value={form.merchantAccount}
                  onChange={(e) => setForm({ ...form, merchantAccount: e.target.value })} placeholder="YourMerchantAccountECOM" autoComplete="off" />
              </div>

              <div className="cb-ck__actions">
                <button type="button" className="cb-btn cb-btn--pull-left" onClick={() => { setForm(null); setShowApiKey(false); }}>Cancel</button>
                <button type="submit" className="cb-btn cb-btn--accent" disabled={saving}>
                  {saving && <Loader2 size={14} className="cb-spin" />}
                  {saving ? "Saving…" : creating ? "Create account" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
