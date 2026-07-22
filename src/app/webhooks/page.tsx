"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, MessageSquare } from "lucide-react";
import { apiGet } from "@/lib/adyen/api";
import { formatDate } from "@/lib/adyen/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { WebhookItem, WebhookDetail, WebhookListResponse } from "@/lib/supabase/types";
import PageHeader from "@/components/adyen/shared/PageHeader";
import PreviewCard, { syntaxHighlight } from "@/components/adyen/shared/PreviewCard";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIMIT = 25;

const EVENT_CODE_GREEN = new Set([
  "AUTHORISATION",
  "CAPTURE",
  "OFFER_CLOSED",
  "ORDER_CLOSED",
  "RECURRING_CONTRACT",
]);

const EVENT_CODE_ORANGE = new Set([
  "CANCELLATION",
  "REFUND",
  "CANCEL_OR_REFUND",
  "REFUND_REVERSED",
  "REFUNDED_REVERSED",
  "CAPTURE_FAILED",
]);

const EVENT_CODE_RED = new Set([
  "CHARGEBACK",
  "CHARGEBACK_REVERSED",
  "SECOND_CHARGEBACK",
  "NOTIFICATION_OF_CHARGEBACK",
  "NOTIFICATION_OF_FRAUD",
  "REQUEST_FOR_INFORMATION",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventCodeColor(code: string): string {
  if (EVENT_CODE_GREEN.has(code)) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
  if (EVENT_CODE_ORANGE.has(code)) return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
  if (EVENT_CODE_RED.has(code)) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  return "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300";
}

function formatAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currency}`;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(str: string | null | undefined, max = 28): string {
  if (!str) return "—";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-2 px-2 py-0.5 rounded text-[0.7rem] font-semibold bg-[#e8f0fe] dark:bg-primary/20 text-primary hover:bg-[#d0e4fd] dark:hover:bg-primary/30 transition-colors shrink-0"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.8rem] font-semibold bg-white dark:bg-slate-800 border border-[#e5e5e5] dark:border-slate-700 text-[#444] dark:text-slate-300 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      Refresh
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function WebhooksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, WebhookDetail>>({});
  const [detailLoadingMap, setDetailLoadingMap] = useState<Record<string, boolean>>({});
  const [detailErrorMap, setDetailErrorMap] = useState<Record<string, string>>({});

  const webhookBaseUrl = process.env.NEXT_PUBLIC_VALEDORSINHO_API_URL ?? "";
  const isLocalhost = webhookBaseUrl.includes("localhost") || webhookBaseUrl === "";

  // -------------------------------------------------------------------------
  // Session — get user_id
  // -------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
        setUserId(session?.user?.id ?? null);
      } catch {
        setUserId(null);
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // Fetch webhooks
  // -------------------------------------------------------------------------
  const fetchWebhooks = useCallback((reset: boolean) => {
    const nextOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    apiGet<WebhookListResponse>("/api/webhooks", { limit: LIMIT, offset: nextOffset })
      .then((res) => {
        const items = res.items ?? [];
        if (reset) {
          setWebhooks(items);
          setOffset(LIMIT);
        } else {
          setWebhooks((prev) => [...prev, ...items]);
          setOffset((prev) => prev + LIMIT);
        }
        setHasMore(items.length === LIMIT);
      })
      .catch((err) => {
        if (reset) setError(err.message ?? "Failed to load webhooks.");
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [offset]);

  useEffect(() => {
    fetchWebhooks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Row expansion — fetch detail on first open
  // -------------------------------------------------------------------------
  async function fetchDetail(id: string) {
    setDetailErrorMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDetailLoadingMap((prev) => ({ ...prev, [id]: true }));
    try {
      const detail = await apiGet<WebhookDetail>(`/api/webhooks/${id}`);
      setDetailMap((prev) => ({ ...prev, [id]: detail }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load payload.";
      setDetailErrorMap((prev) => ({ ...prev, [id]: message }));
    } finally {
      setDetailLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleRowClick(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    // If already successfully loaded, just expand without re-fetching.
    if (detailMap[id]) return;

    await fetchDetail(id);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="w-full max-w-[960px]">
      {/* Header */}
      <PageHeader
        title="Webhook Logs"
        subtitle="Incoming Adyen notifications, ordered by received date."
        backHref="/"
        backLabel="Dashboard"
        right={<RefreshButton onClick={() => fetchWebhooks(true)} loading={loading} />}
      />

      {/* Webhook URL panel */}
      {userId && (
        <div className="mb-6 rounded-[10px] border border-[#e5e5e5] dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-[#888] dark:text-slate-400">
              Your Adyen Webhook URL
            </p>
            {!loading && webhooks.length > 0 && (
              <span className="text-[0.72rem] text-[#888] dark:text-slate-500 uppercase tracking-wide">
                {webhooks.length}{hasMore ? "+" : ""} shown
              </span>
            )}
          </div>
          {isLocalhost ? (
            <p className="text-[0.82rem] text-[#888] dark:text-slate-400">
              Set{" "}
              <code className="bg-[#f5f5f5] dark:bg-slate-700 px-1 rounded text-[0.78rem] dark:text-slate-200">
                NEXT_PUBLIC_VALEDORSINHO_API_URL
              </code>{" "}
              to your Render service URL to see your full webhook URL here.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-1 flex-wrap">
                <code className="text-[0.8rem] font-mono bg-[#f5f5f5] dark:bg-slate-700 px-3 py-1.5 rounded-lg text-[#1a1a1a] dark:text-slate-200 break-all">
                  {webhookBaseUrl}/api/webhooks/{userId}
                </code>
                <CopyButton value={`${webhookBaseUrl}/api/webhooks/${userId}`} />
              </div>
              <p className="text-[0.75rem] text-[#999] dark:text-slate-500 mt-2">
                Configure this URL in Adyen Customer Area → Developers → Webhooks.
              </p>
            </>
          )}
        </div>
      )}


      {/* Error state */}
      {error && (
        <div className="rounded-[10px] border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[0.85rem] text-red-700 dark:text-red-400 mb-5">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#f5f5f5] dark:bg-slate-800 rounded-[10px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && webhooks.length === 0 && (
        <div className="rounded-[10px] border border-[#e5e5e5] dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-12 text-center">
          <div className="w-10 h-10 mx-auto mb-3 text-[#ccc] dark:text-slate-600">
            <MessageSquare className="w-full h-full" strokeWidth={1.5} />
          </div>
          <p className="text-[0.95rem] font-semibold text-[#1a1a1a] dark:text-white mb-1">No webhooks yet</p>
          <p className="text-[0.82rem] text-[#888] dark:text-slate-400 max-w-xs mx-auto">
            Configure your webhook URL in the Adyen Customer Area. Notifications will appear here once Adyen starts sending them.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && webhooks.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-[10px] border border-[#e5e5e5] dark:border-slate-700 overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[120px_160px_48px_1fr_1fr_90px_52px] gap-x-4 px-4 py-2 border-b border-[#f0f0f0] dark:border-slate-700 bg-[#fafafa] dark:bg-slate-900/50">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#999] dark:text-slate-500">Received</span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#999] dark:text-slate-500">Event</span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#999] dark:text-slate-500">Status</span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#999] dark:text-slate-500">PSP Reference</span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#999] dark:text-slate-500">Merchant Ref</span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#999] dark:text-slate-500">Amount</span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-[#999] dark:text-slate-500">Env</span>
          </div>

          {webhooks.map((w) => {
            const isExpanded = expandedId === w.id;
            const detail = detailMap[w.id];
            const isDetailLoading = detailLoadingMap[w.id] ?? false;
            const detailError = detailErrorMap[w.id];

            return (
              <div key={w.id} className="border-b border-[#f5f5f5] dark:border-slate-700 last:border-b-0">
                {/* Main row */}
                <button
                  onClick={() => handleRowClick(w.id)}
                  className={`w-full grid grid-cols-[120px_160px_48px_1fr_1fr_90px_52px] gap-x-4 px-4 py-3 text-left transition-colors hover:bg-[#f8fbff] dark:hover:bg-slate-700/50 ${isExpanded ? "bg-[#f8fbff] dark:bg-slate-700/50" : ""}`}
                >
                  {/* Received */}
                  <div className="min-w-0">
                    <span
                      className="text-[0.82rem] text-[#1a1a1a] dark:text-slate-200 font-medium"
                      title={formatDate(w.received_at)}
                    >
                      {relativeTime(w.received_at)}
                    </span>
                    <div className="text-[0.7rem] text-[#aaa] dark:text-slate-500">
                      {new Date(w.received_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  {/* Event code */}
                  <div className="flex items-center">
                    <span className={`px-2 py-0.5 rounded-full text-[0.68rem] font-semibold whitespace-nowrap ${eventCodeColor(w.event_code)}`}>
                      {w.event_code}
                    </span>
                  </div>

                  {/* Success */}
                  <div className="flex items-center justify-center">
                    <span
                      title={w.success ? "Success" : "Failed"}
                      className={`inline-block w-2.5 h-2.5 rounded-full ${w.success ? "bg-green-500" : "bg-red-500"}`}
                    />
                  </div>

                  {/* PSP Reference */}
                  <div className="min-w-0 flex items-center">
                    <span className="text-[0.78rem] font-mono text-[#555] dark:text-slate-400 truncate" title={w.psp_reference}>
                      {truncate(w.psp_reference, 22)}
                    </span>
                  </div>

                  {/* Merchant Reference */}
                  <div className="min-w-0 flex items-center">
                    <span className="text-[0.78rem] text-[#666] dark:text-slate-400 truncate" title={w.merchant_reference}>
                      {truncate(w.merchant_reference, 22)}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center">
                    <span className="text-[0.82rem] font-semibold text-[#1a1a1a] dark:text-slate-200 whitespace-nowrap">
                      {formatAmount(w.amount_value, w.amount_currency)}
                    </span>
                  </div>

                  {/* Live / Test */}
                  <div className="flex items-center">
                    <span className={`px-1.5 py-0.5 rounded text-[0.65rem] font-bold whitespace-nowrap ${w.live ? "bg-[#fff3cd] dark:bg-yellow-900/30 text-[#856404] dark:text-yellow-400" : "bg-[#e9ecef] dark:bg-slate-700 text-[#6c757d] dark:text-slate-400"}`}>
                      {w.live ? "LIVE" : "TEST"}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#e8f0fe] dark:border-slate-700 bg-[#f8fbff] dark:bg-slate-900/40 px-4 py-4">
                    {isDetailLoading && (
                      <div className="h-20 bg-[#e8f0fe] dark:bg-slate-700 rounded-lg animate-pulse" />
                    )}

                    {!isDetailLoading && detailError && (
                      <p className="text-[0.82rem] text-red-600">
                        {detailError}
                        <button
                          onClick={(e) => { e.stopPropagation(); fetchDetail(w.id); }}
                          className="ml-2 underline hover:no-underline"
                        >
                          Retry
                        </button>
                      </p>
                    )}

                    {detail && (
                      <div className="space-y-3">
                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[0.78rem] text-[#666] dark:text-slate-400">
                          <span>
                            <span className="text-[#999] dark:text-slate-500 mr-1">Merchant account:</span>
                            <span className="font-mono">{w.merchant_account || "—"}</span>
                          </span>
                          <span>
                            <span className="text-[#999] dark:text-slate-500 mr-1">Received:</span>
                            {formatDate(w.received_at)}
                          </span>
                          <span>
                            <span className="text-[#999] dark:text-slate-500 mr-1">Expires:</span>
                            {formatDate(w.expires_at)}
                          </span>
                        </div>

                        {/* Raw payload */}
                        {detail.payload ? (
                          <div className="relative">
                            <PreviewCard title="Raw Payload" initialHtml={syntaxHighlight(detail.payload)} />
                            <div className="absolute top-2 right-2">
                              <CopyButton value={JSON.stringify(detail.payload, null, 2)} />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[0.82rem] text-[#888] dark:text-slate-500 italic">No payload stored for this notification.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && !error && (
        <div className="mt-4 text-center">
          <button
            onClick={() => fetchWebhooks(false)}
            disabled={loadingMore}
            className="px-5 py-2 rounded-lg text-[0.85rem] font-semibold bg-white dark:bg-slate-800 border border-[#e5e5e5] dark:border-slate-700 text-[#444] dark:text-slate-300 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
