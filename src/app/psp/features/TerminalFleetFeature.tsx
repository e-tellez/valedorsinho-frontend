"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Loader2, Inbox, AlertTriangle, CheckCircle2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/adyen/api";
import { formatDate } from "@/lib/adyen/utils";
import type { Terminal, Store } from "@/lib/adyen/types";
import { useCallLogger } from "../shell/useCallLogger";

const PAGE_SIZE = 20;

function isLive(iso?: string): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() <= 60 * 60 * 1000;
}

function statusClass(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "boarded": return "cb-fbadge cb-fbadge--boarded";
    case "inventory": return "cb-fbadge cb-fbadge--inventory";
    default: return "cb-fbadge";
  }
}

type Status = { msg: string; type: "ok" | "err" | "info" };

export default function TerminalFleetFeature() {
  const log = useCallLogger();

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | null>(null);

  const [selected, setSelected] = useState<Record<string, { merchantId: string }>>({});
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [reassignStoreId, setReassignStoreId] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  const fetchedMerchants = useRef<Set<string>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { log.reset(); }, []);

  const resolveStoreNames = useCallback((list: Terminal[]) => {
    const merchantIds = new Set<string>();
    list.forEach((t) => {
      if (t.assignment?.storeId && t.assignment?.merchantId) merchantIds.add(t.assignment.merchantId);
    });
    merchantIds.forEach((mid) => {
      if (fetchedMerchants.current.has(mid)) return;
      fetchedMerchants.current.add(mid);
      apiGet<{ data: Store[] }>(`/api/fleet/stores?merchantId=${encodeURIComponent(mid)}`)
        .then((res) => {
          const updates: Record<string, string> = {};
          (res.data || []).forEach((s) => { updates[s.id] = s.description || s.shopperStatement || s.reference || s.id; });
          setStoreNames((prev) => ({ ...prev, ...updates }));
        })
        .catch(() => {});
    });
  }, []);

  const fetchTerminals = useCallback((page: number, query: string) => {
    setLoading(true);
    setStatus(null);
    const params = new URLSearchParams({ pageNumber: String(page), pageSize: String(PAGE_SIZE) });
    if (query) params.set("searchQuery", query);
    const id = log.begin({ label: "List fleet terminals", method: "GET", endpoint: "/api/fleet/terminals", request: { pageNumber: page, pageSize: PAGE_SIZE, searchQuery: query || undefined } });
    apiGet<{ data: Terminal[]; pagesTotal?: number }>(`/api/fleet/terminals?${params.toString()}`)
      .then((res) => {
        const list = res.data || [];
        setTerminals(list);
        setTotalPages(res.pagesTotal || 1);
        log.ok(id, res);
        resolveStoreNames(list);
      })
      .catch((err: Error) => { setStatus({ msg: err.message, type: "err" }); log.err(id, { error: err.message }); })
      .finally(() => setLoading(false));
  }, [log, resolveStoreNames]);

  useEffect(() => { fetchTerminals(currentPage, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); fetchTerminals(1, val); }, 400);
  }

  const selectedCount = Object.keys(selected).length;
  const allChecked = terminals.length > 0 && terminals.every((t) => !!selected[t.id]);

  function toggleOne(terminalId: string, merchantId: string, checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[terminalId] = { merchantId };
      else delete next[terminalId];
      return next;
    });
  }
  function toggleAll(checked: boolean) {
    if (!checked) { setSelected({}); return; }
    const next: Record<string, { merchantId: string }> = {};
    terminals.forEach((t) => { next[t.id] = { merchantId: t.assignment?.merchantId || "" }; });
    setSelected(next);
  }

  const selectedMerchantIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(selected).forEach((v) => { if (v.merchantId) ids.add(v.merchantId); });
    return Array.from(ids).sort().join(",");
  }, [selected]);

  useEffect(() => {
    if (!selectedMerchantIds) return;
    selectedMerchantIds.split(",").forEach((mid) => {
      apiGet<{ data: Store[] }>(`/api/fleet/stores?merchantId=${encodeURIComponent(mid)}`)
        .then((res) => {
          setAllStores((prev) => {
            const existing = new Set(prev.map((s) => s.id));
            return [...prev, ...(res.data || []).filter((s) => !existing.has(s.id))];
          });
        })
        .catch(() => {});
    });
  }, [selectedMerchantIds]);

  async function handleReassign() {
    if (!reassignStoreId || selectedCount === 0) return;
    setReassigning(true);
    const ids = Object.keys(selected);
    const merchantId = selected[ids[0]].merchantId;
    const body = { terminalIds: ids, storeId: reassignStoreId, merchantId };
    const logId = log.begin({ label: "Reassign terminals", method: "POST", endpoint: "/api/fleet/reassign", request: body });
    try {
      const res = await apiPost<{ summary?: string }>("/api/fleet/reassign", body);
      log.ok(logId, res);
      setStatus({ msg: res.summary || "Reassignment complete.", type: "ok" });
      setSelected({});
      fetchTerminals(currentPage, search);
    } catch (err) {
      const msg = (err as Error).message;
      log.err(logId, { error: msg });
      setStatus({ msg: "Reassign failed: " + msg, type: "err" });
    } finally {
      setReassigning(false);
    }
  }

  return (
    <div className="cb-main cb-main--wide">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Terminal Fleet</h1>
          <p className="cb-head__sub">
            Browse your terminal inventory and reassign devices between stores. Fleet API calls post to the inspector.
          </p>
        </div>
      </header>

      <div className="cb-toolbar">
        <input
          className="cb-input"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by serial number or terminal ID…"
          spellCheck={false}
          autoComplete="off"
        />
        <button className="cb-btn" onClick={() => { setCurrentPage(1); fetchTerminals(1, search); }} disabled={loading}>
          {loading ? <Loader2 size={14} className="cb-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {selectedCount > 0 && (
        <div className="cb-reassign">
          <b>{selectedCount} selected</b>
          <select className="cb-input" value={reassignStoreId} onChange={(e) => setReassignStoreId(e.target.value)} disabled={allStores.length === 0}>
            <option value="">Select target store…</option>
            {allStores.map((s) => (
              <option key={s.id} value={s.id} title={s.id}>{s.shopperStatement || s.description || s.reference || s.id}</option>
            ))}
          </select>
          <button className="cb-btn cb-btn--accent" onClick={handleReassign} disabled={!reassignStoreId || reassigning}>
            {reassigning ? <Loader2 size={13} className="cb-spin" /> : null}
            {reassigning ? "Reassigning…" : "Reassign"}
          </button>
          <button className="cb-btn" onClick={() => setSelected({})}>Deselect all</button>
        </div>
      )}

      {status && (
        <div className={`cb-banner cb-banner--${status.type}`} style={{ marginBottom: 16 }}>
          {status.type === "ok" ? <CheckCircle2 size={15} /> : status.type === "err" ? <AlertTriangle size={15} /> : null}
          <span>{status.msg}</span>
        </div>
      )}

      {loading && terminals.length === 0 ? (
        <div className="cb-skel-list">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="cb-skel" />)}
        </div>
      ) : terminals.length === 0 ? (
        <div className="cb-tblwrap"><div className="cb-empty"><Inbox size={22} /><p>No terminals found</p></div></div>
      ) : (
        <div className="cb-tblwrap">
          <table className="cb-tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" className="cb-checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} aria-label="Select all" />
                </th>
                <th>Terminal ID</th>
                <th>Status</th>
                <th>Store</th>
                <th>Description</th>
                <th>Merchant</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {terminals.map((t) => {
                const a = t.assignment || {};
                const checked = !!selected[t.id];
                return (
                  <tr key={t.id} className={checked ? "is-sel" : ""}>
                    <td>
                      <input type="checkbox" className="cb-checkbox" checked={checked} onChange={(e) => toggleOne(t.id, a.merchantId || "", e.target.checked)} aria-label={`Select ${t.id}`} />
                    </td>
                    <td><span className="cb-tbl__id">{t.id || "—"}</span></td>
                    <td><span className={statusClass(a.status)}>{a.status || "unknown"}</span></td>
                    <td><span className="cb-tbl__muted">{a.storeId || "—"}</span></td>
                    <td title={a.storeId || ""}>{a.storeId ? (storeNames[a.storeId] || "…") : "—"}</td>
                    <td><span className="cb-tbl__muted">{a.merchantId || "—"}</span></td>
                    <td>
                      <span className="cb-actcell">
                        <span className={`cb-actdot ${isLive(t.lastActivityAt) ? "cb-actdot--live" : ""}`} />
                        {formatDate(t.lastActivityAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="cb-pager">
          <button className="cb-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button className="cb-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
