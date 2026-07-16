"use client";

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/adyen/api";
import PageHeader from "@/components/adyen/shared/PageHeader";
import PreviewCard, { syntaxHighlight } from "@/components/adyen/shared/PreviewCard";
import type { Vertical } from "@/lib/adyen/verticals";

export default function PayloadSuggestedPage() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [verticalsLoading, setVerticalsLoading] = useState(true);
  const [verticalsError, setVerticalsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiGet<Vertical[]>("/api/tools/verticals")
      .then((data) => {
        setVerticals(data);
        if (data.length > 0) {
          setSelected(new Set([data[0].key]));
        }
      })
      .catch((err: Error) => {
        setVerticalsError(err.message || "Failed to load verticals");
      })
      .finally(() => setVerticalsLoading(false));
  }, []);

  useEffect(() => {
    if (selected.size === 0) {
      setPayload(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiPost<{ payload: Record<string, unknown> }>("/api/tools/payload-suggested", {
      verticals: Array.from(selected),
    })
      .then((res) => {
        if (!cancelled) {
          setPayload(res.payload);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [selected]);

  const payloadJson = payload ? JSON.stringify(payload, null, 2) : "";

  function toggleVertical(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleCopy() {
    if (!payloadJson) return;
    try {
      await navigator.clipboard.writeText(payloadJson);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payloadJson;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!payloadJson) return;
    const keys = Array.from(selected).join("_");
    const blob = new Blob([payloadJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payload_${keys || "empty"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full max-w-[1200px]">
      <PageHeader
        title="Payload Suggested"
        subtitle="Select one or more merchant verticals to generate a recommended /payments payload."
        backHref="/"
      />

      {/* 40/60 split */}
      <div className="flex gap-6 items-start">
        {/* Left panel — 40% — vertical selector */}
        <div className="w-[40%] shrink-0 flex flex-col gap-2">
          {verticalsLoading ? (
            <span className="text-sm text-gray-400 dark:text-slate-500">Loading verticals…</span>
          ) : verticalsError ? (
            <div className="text-sm text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <strong>Error:</strong> {verticalsError}
            </div>
          ) : verticals.length === 0 ? (
            <span className="text-sm text-gray-400 dark:text-slate-500">No verticals available</span>
          ) : (
            verticals.map((v) => {
              const isChecked = selected.has(v.key);
              return (
                <label
                  key={v.key}
                  className={`flex items-start gap-3 cursor-pointer rounded-xl border p-4 transition-colors ${
                    isChecked
                      ? "border-primary bg-blue-50/40 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 dark:bg-slate-800/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleVertical(v.key)}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-gray-800 dark:text-slate-200">{v.label}</span>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mt-0.5">{v.description}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Right panel — 60% — actions + preview */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-3 mb-4">
            <button onClick={handleCopy} disabled={!payload || loading} className="btn-primary">
              Copy to Clipboard
            </button>
            <button onClick={handleDownload} disabled={!payload || loading} className="btn-secondary">
              Download .json
            </button>
          </div>

          {copied && (
            <div className="mb-4 text-sm text-green-600 font-medium">Copied to clipboard!</div>
          )}

          <PreviewCard title="Payload Preview">
            {loading ? (
              <span className="text-gray-400 dark:text-slate-400">Generating payload…</span>
            ) : error ? (
              <span className="text-red-400">{error}</span>
            ) : payload ? (
              <pre dangerouslySetInnerHTML={{ __html: syntaxHighlight(payload) }} />
            ) : (
              <span className="text-gray-500 dark:text-slate-400">Select at least one vertical.</span>
            )}
          </PreviewCard>
        </div>
      </div>
    </div>
  );
}
