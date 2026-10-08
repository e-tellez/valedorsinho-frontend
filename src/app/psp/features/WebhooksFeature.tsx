"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2, Inbox } from "lucide-react";
import { apiGet } from "@/lib/adyen/api";
import { syntaxHighlight } from "@/lib/adyen/syntaxHighlight";
import type { WebhookItem, WebhookDetail, WebhookListResponse } from "@/lib/supabase/types";
import { useInspector } from "../shell/inspector-context";

const LIMIT = 25;

function relativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 2 }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currency}`;
  }
}

export default function WebhooksFeature() {
  const { push, update, reset } = useInspector();
  const [items, setItems] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, WebhookDetail>>({});

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const id = push({
      from: "adyen", to: "merchant", kind: "request", method: "GET",
      label: "List webhook notifications", endpoint: "/api/webhooks",
      status: "pend", request: { limit: LIMIT, offset: 0 },
    });
    apiGet<WebhookListResponse>("/api/webhooks", { limit: LIMIT, offset: 0 })
      .then((res) => {
        setItems(res.items ?? []);
        update(id, { status: "ok", statusCode: 200, response: res });
      })
      .catch((err: Error) => {
        setError(err.message);
        update(id, { status: "err", statusCode: 401, response: { error: err.message } });
      })
      .finally(() => setLoading(false));
  }, [push, update]);

  useEffect(() => { reset(); load(); }, [reset, load]);

  async function toggleRow(w: WebhookItem) {
    if (expandedId === w.id) { setExpandedId(null); return; }
    setExpandedId(w.id);
    if (details[w.id]) return;
    const id = push({
      from: "adyen", to: "merchant", kind: "request", method: "GET",
      label: `Webhook payload · ${w.event_code}`, endpoint: `/api/webhooks/${w.id}`,
      status: "pend",
    });
    try {
      const detail = await apiGet<WebhookDetail>(`/api/webhooks/${w.id}`);
      setDetails((prev) => ({ ...prev, [w.id]: detail }));
      update(id, { status: "ok", statusCode: 200, response: detail.payload });
    } catch (err) {
      update(id, { status: "err", statusCode: 404, response: { error: (err as Error).message } });
    }
  }

  return (
    <div className="cb-main">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Webhook Logs</h1>
          <p className="cb-head__sub">
            Inbound Adyen notifications, newest first. Expand a row to load its raw payload;
            every fetch is logged in the inspector.
          </p>
        </div>
        <button className="cb-btn" onClick={load} disabled={loading}>
          {loading ? <Loader2 size={14} className="cb-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </header>

      {error && (
        <div className="cb-banner cb-banner--err" style={{ marginBottom: 18 }}>
          <span>{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="cb-skel-list">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="cb-skel" />)}
        </div>
      ) : items.length === 0 && !error ? (
        <div className="cb-panel"><div className="cb-empty"><Inbox size={22} /><p>No webhooks yet</p></div></div>
      ) : (
        <div className="cb-rows">
          {items.map((w) => (
            <div key={w.id} className="cb-whitem">
              <button className="cb-whrow" onClick={() => toggleRow(w)} aria-expanded={expandedId === w.id}>
                <span className="cb-whrow__time">
                  <b>{relativeTime(w.received_at)}</b>
                  <span>{new Date(w.received_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </span>
                <span className="cb-whbadge">
                  <i className={`cb-whdot ${w.success ? "is-ok" : "is-bad"}`} />
                  {w.event_code}
                </span>
                <span className="cb-whrow__ref" title={w.psp_reference}>{w.psp_reference || "—"}</span>
                <span className="cb-whrow__amt">{formatAmount(w.amount_value, w.amount_currency)}</span>
                <span className={`cb-pill ${w.live ? "cb-pill--pend" : ""}`}>{w.live ? "LIVE" : "TEST"}</span>
              </button>
              {expandedId === w.id && (
                <div className="cb-whdetail">
                  {details[w.id] ? (
                    <pre className="cb-json" dangerouslySetInnerHTML={{ __html: syntaxHighlight(details[w.id].payload) }} />
                  ) : (
                    <div className="cb-skel" style={{ height: 60 }} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
