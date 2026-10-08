"use client";

import { useInspector } from "./inspector-context";
import type { Party } from "../mock";

/**
 * Thin adapter over the shared inspector used by feature flows (checkout,
 * terminal, …): begin a merchant↔adyen call as a pending entry, then settle it
 * ok/err. Also posts lightweight actor events and a live configuration object
 * so the 3-actor trace reads meaningfully.
 */
export function useCallLogger() {
  const { push, update, reset } = useInspector();

  return {
    reset,
    /** Append a pending call entry and return its id. */
    begin(meta: {
      label: string;
      method: string;
      endpoint: string;
      from?: Party;
      to?: Party;
      request?: unknown;
    }): string {
      return push({
        from: meta.from ?? "merchant",
        to: meta.to ?? "adyen",
        kind: "request",
        method: meta.method,
        label: meta.label,
        endpoint: meta.endpoint,
        status: "pend",
        request: meta.request,
      });
    },
    ok(id: string, response: unknown, statusCode = 200) {
      update(id, { status: "ok", statusCode, response });
    },
    err(id: string, response: unknown, statusCode = 500) {
      update(id, { status: "err", statusCode, response });
    },
    /** A non-API marker (e.g. shopper submits, 3DS challenge). */
    event(meta: { label: string; from: Party; to: Party }) {
      push({ from: meta.from, to: meta.to, kind: "event", label: meta.label, status: "info" });
    },
    /** Post a settled response-only entry (e.g. a decoded payload). */
    note(meta: { label: string; from?: Party; to?: Party; response: unknown }) {
      push({
        from: meta.from ?? "adyen",
        to: meta.to ?? "merchant",
        kind: "response",
        label: meta.label,
        status: "ok",
        response: meta.response,
      });
    },
    /** Post a live, editable configuration object; returns its id. */
    config(obj: unknown, label = "Configuration"): string {
      return push({
        from: "merchant",
        to: "adyen",
        kind: "config",
        label,
        status: "info",
        request: obj,
      });
    },
    /** Patch the live configuration object as the shopper edits it. */
    setConfig(id: string, obj: unknown) {
      update(id, { request: obj });
    },
  };
}
