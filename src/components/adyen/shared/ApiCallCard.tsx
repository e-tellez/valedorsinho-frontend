"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { syntaxHighlight } from "@/lib/adyen/syntaxHighlight";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type Direction = "merchant→adyen" | "adyen→merchant";

export interface ApiCallEntry {
  method: HttpMethod;
  endpoint: string;
  direction?: Direction;
  statusCode?: number;
  timestamp?: string;
  latencyMs?: number;
  request?: unknown;
  response?: unknown;
  extra?: { label: string; note?: string; data: unknown };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    "bg-blue-500",
  POST:   "bg-green-600",
  PUT:    "bg-amber-500",
  DELETE: "bg-red-500",
  PATCH:  "bg-purple-500",
};

function statusBadgeClass(code: number): string {
  if (code >= 200 && code < 300) return "bg-green-600 text-white";
  if (code >= 300 && code < 400) return "bg-amber-500 text-white";
  return "bg-red-600 text-white";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-gray-500 hover:text-gray-200 transition-colors"
      title="Copy JSON"
    >
      {copied
        ? <Check size={12} className="text-green-400" />
        : <Copy size={12} />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CollapsibleSection
// ---------------------------------------------------------------------------

function CollapsibleSection({
  label,
  note,
  data,
  defaultOpen = true,
}: {
  label: string;
  note?: string;
  data: unknown;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const html = syntaxHighlight(data);
  const raw = JSON.stringify(data, null, 2);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border-t border-gray-700/80 hover:bg-gray-700/50 transition-colors"
      >
        {open
          ? <ChevronDown size={11} className="text-gray-500 shrink-0" />
          : <ChevronRight size={11} className="text-gray-500 shrink-0" />}
        <span className="text-[0.67rem] text-gray-400 font-sans font-semibold uppercase tracking-wide flex-1 text-left">
          {label}
        </span>
        {open && <CopyButton value={raw} />}
      </button>
      {open && (
        <div className="px-3 pt-2 pb-3 overflow-x-auto max-h-72 overflow-y-auto">
          {note && (
            <p className="text-[0.65rem] text-gray-500 font-sans mb-2">{note}</p>
          )}
          <pre
            className="text-[0.77rem] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ApiCallCard
// ---------------------------------------------------------------------------

export default function ApiCallCard({
  method,
  endpoint,
  direction = "merchant→adyen",
  statusCode,
  timestamp,
  latencyMs,
  request,
  response,
  extra,
}: ApiCallEntry) {
  const directionLabel =
    direction === "merchant→adyen" ? "Merchant → Adyen" : "Adyen → Merchant";

  const hasBody =
    request !== undefined || response !== undefined || extra !== undefined;

  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden font-mono text-sm border border-gray-700/60">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap gap-y-1.5">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[0.67rem] font-bold text-white shrink-0 ${METHOD_COLORS[method]}`}
        >
          {method}
        </span>

        <span className="text-[0.78rem] text-gray-200 font-sans flex-1 min-w-0 truncate">
          {endpoint}
        </span>

        <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.64rem] font-semibold bg-gray-700 text-gray-300 font-sans whitespace-nowrap shrink-0">
          {directionLabel}
        </span>

        {statusCode !== undefined && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[0.67rem] font-bold font-sans shrink-0 ${statusBadgeClass(statusCode)}`}
          >
            {statusCode}
          </span>
        )}

        {latencyMs !== undefined && (
          <span className="text-[0.64rem] text-gray-500 font-sans whitespace-nowrap shrink-0">
            {latencyMs}ms
          </span>
        )}

        {timestamp && (
          <span className="text-[0.64rem] text-gray-500 font-sans whitespace-nowrap shrink-0">
            {formatTime(timestamp)}
          </span>
        )}
      </div>

      {/* Collapsible sections */}
      {hasBody && (
        <>
          {request !== undefined && (
            <CollapsibleSection label="Request" data={request} defaultOpen />
          )}
          {response !== undefined && (
            <CollapsibleSection label="Response" data={response} defaultOpen />
          )}
          {extra !== undefined && (
            <CollapsibleSection
              label={extra.label}
              note={extra.note}
              data={extra.data}
              defaultOpen
            />
          )}
        </>
      )}
    </div>
  );
}
