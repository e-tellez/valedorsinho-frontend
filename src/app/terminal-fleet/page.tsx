"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Info } from "lucide-react";
import { apiGet, apiPost } from "@/lib/adyen/api";
import { formatDate } from "@/lib/adyen/utils";
import type { Terminal, Store } from "@/lib/adyen/types";
import PageHeader from "@/components/adyen/shared/PageHeader";
import StatusBanner from "@/components/adyen/shared/StatusBanner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function activityDot(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  let color = "bg-red-500";
  if (diff <= oneHour) color = "bg-green-500";
  else if (diff <= oneDay) color = "bg-yellow-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} shrink-0`} />;
}

function statusBadge(status?: string) {
  const label = status || "unknown";
  let color = "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300";
  switch (label.toLowerCase()) {
    case "boarded":
      color = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      break;
    case "inventory":
      color = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      break;
    case "reassigntomerchantinventory":
    case "reassigntostore":
      color = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      break;
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${color}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TerminalFleetPage() {
  const PAGE_SIZE = 20;

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // Selection
  const [selected, setSelected] = useState<Record<string, { merchantId: string }>>({});

  // Store cache for name resolution
  const storeCache = useRef<Record<string, Store>>({});
  const fetchedMerchants = useRef<Set<string>>(new Set());

  // Reassign
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [reassignStoreId, setReassignStoreId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  // Store names resolved async
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  // -----------------------------------------------------------------------
  // Fetch terminals
  // -----------------------------------------------------------------------
  const fetchTerminals = useCallback(
    (page: number, query: string) => {
      setLoading(true);
      setStatus(null);

      const params = new URLSearchParams({
        pageNumber: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (query) params.set("searchQuery", query);

      apiGet<{ data: Terminal[]; pagesTotal?: number }>(
        `/api/fleet/terminals?${params.toString()}`,
      )
        .then((res) => {
          const list = res.data || [];
          setTerminals(list);
          setTotalPages(res.pagesTotal || 1);
          resolveStoreNames(list);
        })
        .catch((err) => setStatus({ msg: err.message, type: "error" }))
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    fetchTerminals(currentPage, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, fetchTerminals]);

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchTerminals(1, val);
    }, 400);
  }

  // -----------------------------------------------------------------------
  // Store name resolution
  // -----------------------------------------------------------------------
  function resolveStoreNames(list: Terminal[]) {
    const merchantIds = new Set<string>();
    list.forEach((t) => {
      if (t.assignment?.storeId && t.assignment?.merchantId) {
        merchantIds.add(t.assignment.merchantId);
      }
    });

    merchantIds.forEach((mid) => {
      if (fetchedMerchants.current.has(mid)) return;
      fetchedMerchants.current.add(mid);

      apiGet<{ data: Store[] }>(`/api/fleet/stores?merchantId=${encodeURIComponent(mid)}`)
        .then((res) => {
          const stores = res.data || [];
          const updates: Record<string, string> = {};
          stores.forEach((s) => {
            storeCache.current[s.id] = s;
            updates[s.id] = s.description || s.shopperStatement || s.reference || s.id;
          });
          setStoreNames((prev) => ({ ...prev, ...updates }));
        })
        .catch(() => {});
    });
  }

  // -----------------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------------
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
    if (checked) {
      const next: Record<string, { merchantId: string }> = {};
      terminals.forEach((t) => {
        next[t.id] = { merchantId: t.assignment?.merchantId || "" };
      });
      setSelected(next);
    } else {
      setSelected({});
    }
  }

  function deselectAll() {
    setSelected({});
  }

  // -----------------------------------------------------------------------
  // Reassign stores dropdown
  // -----------------------------------------------------------------------
  const selectedMerchantIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(selected).forEach((v) => { if (v.merchantId) ids.add(v.merchantId); });
    return Array.from(ids).sort().join(",");
  }, [selected]);

  useEffect(() => {
    if (!selectedMerchantIds) return;
    const merchantIds = selectedMerchantIds.split(",");

    merchantIds.forEach((mid: string) => {
      apiGet<{ data: Store[] }>(`/api/fleet/stores?merchantId=${encodeURIComponent(mid)}`)
        .then((res) => {
          const stores = res.data || [];
          setAllStores((prev) => {
            const existing = new Set(prev.map((s) => s.id));
            return [...prev, ...stores.filter((s) => !existing.has(s.id))];
          });
        })
        .catch(() => {});
    });
  }, [selectedMerchantIds]);

  // -----------------------------------------------------------------------
  // Reassign action
  // -----------------------------------------------------------------------
  async function handleReassign() {
    if (!reassignStoreId || selectedCount === 0) return;
    setReassigning(true);

    const ids = Object.keys(selected);
    const merchantId = selected[ids[0]].merchantId;

    try {
      const res = await apiPost<{ summary?: string }>("/api/fleet/reassign", {
        terminalIds: ids,
        storeId: reassignStoreId,
        merchantId,
      });
      setStatus({ msg: res.summary || "Reassignment complete.", type: "success" });
      setSelected({});
      fetchTerminals(currentPage, search);
    } catch (err: any) {
      setStatus({ msg: "Reassign failed: " + err.message, type: "error" });
    } finally {
      setReassigning(false);
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="w-full max-w-[1200px]">
      <PageHeader
        title="Terminal Fleet Manager"
        subtitle="View your terminal inventory and where each device is assigned."
        backHref="/"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by serial number or terminal ID…"
          className="field-input flex-1 max-w-md"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={() => { setCurrentPage(1); fetchTerminals(1, search); }}
          className="btn-secondary h-10! px-4! text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Reassign bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5 mb-4 text-sm">
          <span className="font-semibold text-blue-700 dark:text-blue-400">{selectedCount} selected</span>
          <select
            value={reassignStoreId}
            onChange={(e) => setReassignStoreId(e.target.value)}
            className="field-input h-8! text-xs! w-56"
            disabled={allStores.length === 0}
          >
            <option value="">Select target store…</option>
            {allStores.map((s) => (
              <option key={s.id} value={s.id} title={s.id}>
                {s.shopperStatement || s.description || s.reference || s.id}
              </option>
            ))}
          </select>
          <button
            onClick={handleReassign}
            disabled={!reassignStoreId || reassigning}
            className="btn-primary h-8! px-3! text-xs"
          >
            {reassigning ? "Reassigning…" : "Reassign"}
          </button>
          <button onClick={deselectAll} className="btn-secondary h-8! px-3! text-xs">
            Deselect All
          </button>
        </div>
      )}

      {/* Status */}
      {status && <StatusBanner msg={status.msg} type={status.type} />}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 justify-center py-16 text-gray-400 dark:text-slate-500">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-600 border-t-primary rounded-full animate-spin" />
          <span>Loading terminals…</span>
        </div>
      )}

      {/* Table */}
      {!loading && terminals.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 w-10">
                  <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} title="Select all" />
                </th>
                <th className="px-3 py-2 text-left">Terminal ID</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Store ID</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Merchant</th>
                <th className="px-3 py-2 text-left">
                  <span className="relative group inline-flex items-center gap-1 cursor-default">
                    Last Activity
                    <Info className="w-3 h-3 text-gray-400" />
                    <div className="absolute left-0 bottom-full mb-1.5 z-20 hidden group-hover:flex flex-col gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2.5 w-52 normal-case tracking-normal font-normal text-gray-700 dark:text-slate-300">
                      <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />Active in the last hour</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 shrink-0" />Active in the last 24 h</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />More than 24 h ago</span>
                    </div>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {terminals.map((t) => {
                const a = t.assignment || {};
                const isChecked = !!selected[t.id];
                return (
                  <tr key={t.id} className={`border-t border-gray-100 dark:border-slate-700 ${isChecked ? "bg-blue-50/50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"}`}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => toggleOne(t.id, a.merchantId || "", e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-slate-300">{t.id || "\u2014"}</td>
                    <td className="px-3 py-2">{statusBadge(a.status)}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">{a.storeId || "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300" title={a.storeId || ""}>
                      {a.storeId ? (storeNames[a.storeId] || "…") : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">{a.merchantId || "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        {activityDot(t.lastActivityAt)}
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

      {/* Empty */}
      {!loading && terminals.length === 0 && (
        <p className="text-center text-gray-400 dark:text-slate-500 py-16">No terminals found.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="btn-secondary h-8! px-3! text-xs"
          >
            &laquo; Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="btn-secondary h-8! px-3! text-xs"
          >
            Next &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
