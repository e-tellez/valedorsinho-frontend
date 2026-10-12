"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Download, Loader2, AlertTriangle, Layers } from "lucide-react";
import { apiGet, apiPost } from "@/lib/adyen/api";
import { syntaxHighlight } from "@/lib/adyen/syntaxHighlight";
import type { Vertical } from "@/lib/adyen/types";

export default function PayloadSuggestedFeature() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [vertLoading, setVertLoading] = useState(true);
  const [vertError, setVertError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiGet<Vertical[]>("/api/tools/verticals")
      .then((data) => {
        setVerticals(data);
        if (data.length > 0) setSelected(new Set([data[0].key]));
      })
      .catch((err: Error) => setVertError(err.message || "Failed to load verticals"))
      .finally(() => setVertLoading(false));
  }, []);

  useEffect(() => {
    if (selected.size === 0) {
      setPayload(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    apiPost<{ payload: Record<string, unknown> }>("/api/tools/payload-suggested", {
      verticals: Array.from(selected),
    })
      .then((res) => { if (!cancelled) setPayload(res.payload); })
      .catch((err: Error) => { if (!cancelled) { setError(err.message); setPayload(null); } })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [selected]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const payloadJson = payload ? JSON.stringify(payload, null, 2) : "";

  function copy() {
    if (!payloadJson) return;
    navigator.clipboard.writeText(payloadJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function download() {
    if (!payloadJson) return;
    const name = Array.from(selected).join("_") || "empty";
    const url = URL.createObjectURL(new Blob([payloadJson], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `payload-suggested-${name}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cb-main cb-main--wide">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Payload Suggested</h1>
          <p className="cb-head__sub">
            Select one or more merchant verticals to generate a recommended <code>/payments</code> payload.
          </p>
        </div>
      </header>

      <div className="cb-suggest">
        <div className="cb-panel">
          <div className="cb-panel__hd"><h3>Merchant verticals</h3></div>
          <div className="cb-panel__bd">
            {vertLoading ? (
              <div className="cb-skel-list">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="cb-skel" />)}
              </div>
            ) : vertError ? (
              <div className="cb-banner cb-banner--err"><AlertTriangle size={15} /><span>{vertError}</span></div>
            ) : verticals.length === 0 ? (
              <div className="cb-empty"><Layers size={22} /><p>No verticals available</p></div>
            ) : (
              <div className="cb-vertlist">
                {verticals.map((v) => {
                  const on = selected.has(v.key);
                  return (
                    <label key={v.key} className={`cb-vertitem ${on ? "is-on" : ""}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(v.key)} />
                      <span className="cb-vertitem__txt">
                        <b>{v.label}</b>
                        <span>{v.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="cb-panel">
          <div className="cb-panel__hd">
            <h3>Suggested /payments payload</h3>
            <span className="cb-jsonbtns" style={{ marginLeft: "auto" }}>
              <button className={`cb-iconbtn ${copied ? "is-ok" : ""}`} onClick={copy} disabled={!payload || busy} title="Copy JSON" aria-label="Copy payload as JSON">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button className="cb-iconbtn" onClick={download} disabled={!payload || busy} title="Download .json" aria-label="Download payload as JSON">
                <Download size={13} />
              </button>
            </span>
          </div>
          <div className="cb-panel__bd">
            {busy ? (
              <div className="cb-banner cb-banner--info"><Loader2 size={15} className="cb-spin" /><span>Generating payload…</span></div>
            ) : error ? (
              <div className="cb-banner cb-banner--err"><AlertTriangle size={15} /><span>{error}</span></div>
            ) : payload ? (
              <pre className="cb-json" dangerouslySetInnerHTML={{ __html: syntaxHighlight(payload) }} />
            ) : (
              <div className="cb-empty"><p>Select at least one vertical.</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
