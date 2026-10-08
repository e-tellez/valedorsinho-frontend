"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Copy, Check, Download } from "lucide-react";
import { syntaxHighlight } from "@/lib/adyen/syntaxHighlight";
import { NAV, type LogEntry, type LogStatus, type Party } from "../mock";
import { useInspector } from "./inspector-context";

const PARTY_LABEL: Record<Party, string> = { merchant: "Merchant", shopper: "Shopper", adyen: "Adyen" };
const PARTY_DOT: Record<Party, string> = {
  merchant: "cb-dot-merchant",
  shopper: "cb-dot-shopper",
  adyen: "cb-dot-adyen",
};

function pillClass(s: LogStatus): string {
  return s === "ok" ? "cb-pill--ok" : s === "pend" ? "cb-pill--pend" : s === "err" ? "cb-pill--err" : "";
}

function scopeLabel(pathname: string): string {
  const slug = pathname.replace(/^\/psp\/?/, "").split("/")[0];
  if (!slug) return "Dashboard";
  const item = NAV.flatMap((s) => s.items).find((i) => i.id === slug);
  return item?.label ?? slug;
}

export default function Inspector() {
  const { entries } = useInspector();
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <>
      <div className="cb-insp-hd">
        <div className="cb-insp-hd__top">
          <h2>Registry</h2>
          <span className="cb-count">{entries.length}</span>
        </div>
        <div className="cb-scope">Session · {scopeLabel(pathname)}</div>
      </div>

      <div className="cb-legend">
        <span><i className="cb-dot-merchant" />Merchant</span>
        <span><i className="cb-dot-shopper" />Shopper</span>
        <span><i className="cb-dot-adyen" />Adyen</span>
      </div>

      <div className="cb-insp-scroll">
        {entries.length === 0 ? (
          <div className="cb-empty"><p>No messages yet</p></div>
        ) : (
          entries.map((e) => (
            <LogRow
              key={e.id}
              entry={e}
              open={expanded === e.id}
              onToggle={() => setExpanded((cur) => (cur === e.id ? null : e.id))}
            />
          ))
        )}
      </div>
    </>
  );
}

function LogRow({ entry, open, onToggle }: { entry: LogEntry; open: boolean; onToggle: () => void }) {
  const code = entry.statusCode
    ? String(entry.statusCode)
    : entry.status === "pend"
      ? "…"
      : entry.kind.toUpperCase();
  const slug =
    entry.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || entry.id;

  // Webhooks are not expandable here — they have their own feature section.
  // Config entries (the live checkout configuration) stay open so edits show.
  const isConfig = entry.kind === "config";
  const expandable = entry.kind !== "webhook" && !isConfig;
  const showBody = isConfig || (expandable && open);

  const header = (
    <>
      <span className="cb-log__meta">
        <span className="cb-log__time">{entry.time}</span>
        <span className="cb-hop">
          <i className={PARTY_DOT[entry.from]} />
          {PARTY_LABEL[entry.from]}
          <ArrowRight size={9} />
          <i className={PARTY_DOT[entry.to]} />
          {PARTY_LABEL[entry.to]}
        </span>
        <span className={`cb-pill ${pillClass(entry.status)}`}>{code}</span>
      </span>
      <span className="cb-log__label">
        <b>{entry.label}</b>
        <span>{entry.method ? `${entry.method} ` : ""}{entry.endpoint}</span>
      </span>
    </>
  );

  return (
    <div className="cb-log">
      {expandable ? (
        <button className="cb-log__hd" onClick={onToggle} aria-expanded={open}>{header}</button>
      ) : (
        <div className="cb-log__hd cb-log__hd--static">{header}</div>
      )}

      {showBody && (
        <div className="cb-log__body">
          {entry.request !== undefined && (
            <JsonBlock label={isConfig ? "Configuration" : "Request"} data={entry.request} filename={`${slug}-${isConfig ? "config" : "request"}.json`} />
          )}
          {entry.response !== undefined && (
            <JsonBlock label="Response" data={entry.response} filename={`${slug}-response.json`} />
          )}
        </div>
      )}
    </div>
  );
}

function JsonBlock({ label, data, filename }: { label: string; data: unknown; filename: string }) {
  const [copied, setCopied] = useState(false);
  const raw = JSON.stringify(data, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(raw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="cb-log__subrow">
        <span className="cb-log__sub">{label}</span>
        <span className="cb-jsonbtns">
          <button className={`cb-iconbtn ${copied ? "is-ok" : ""}`} onClick={copy} title="Copy JSON" aria-label={`Copy ${label} as JSON`}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button className="cb-iconbtn" onClick={download} title="Download .json" aria-label={`Download ${label} as JSON`}>
            <Download size={13} />
          </button>
        </span>
      </div>
      <pre className="cb-json" dangerouslySetInnerHTML={{ __html: syntaxHighlight(data) }} />
    </>
  );
}
