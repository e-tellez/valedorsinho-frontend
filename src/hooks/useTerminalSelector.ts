"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGet } from "@/lib/adyen/api";
import type { MerchantAccount, Store, Terminal } from "@/lib/adyen/types";

export interface TerminalSelectorStatus {
  msg: string;
  type: "success" | "error" | "info";
}

export interface UseTerminalSelectorResult {
  companyAccount: string;
  merchants: MerchantAccount[];
  stores: Store[];
  terminals: Terminal[];
  selectedMerchant: string;
  selectedStore: string;
  selectedTerminal: string;
  status: TerminalSelectorStatus | null;
  loadingMerchants: boolean;
  loadingStores: boolean;
  loadingTerminals: boolean;
  // Wrapped setters — include cascading resets of dependent selections
  setSelectedMerchant: (id: string) => void;
  setSelectedStore: (id: string) => void;
  setSelectedTerminal: (id: string) => void;
  setStatus: (s: TerminalSelectorStatus | null) => void;
}

/**
 * Encapsulates the cascading merchant → store → terminal fetch pattern.
 * Use this hook instead of duplicating the three-level cascade across pages.
 */
export function useTerminalSelector(): UseTerminalSelectorResult {
  const [companyAccount, setCompanyAccount] = useState("Loading\u2026");
  const [merchants, setMerchants] = useState<MerchantAccount[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);

  const [selectedMerchant, setSelectedMerchantRaw] = useState("");
  const [selectedStore, setSelectedStoreRaw] = useState("");
  const [selectedTerminal, setSelectedTerminal] = useState("");

  const [status, setStatus] = useState<TerminalSelectorStatus | null>(null);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingTerminals, setLoadingTerminals] = useState(false);

  const fetchTerminals = useCallback((merchantId: string, storeId: string) => {
    setLoadingTerminals(true);
    setSelectedTerminal("");

    const params = new URLSearchParams({ merchantIds: merchantId, pageSize: "100" });
    if (storeId) params.set("storeIds", storeId);

    apiGet<{ data: Terminal[] }>(`/api/terminal/terminals?${params.toString()}`)
      .then((res) => setTerminals(res.data || []))
      .catch((err) => setStatus({ msg: "Failed to load terminals: " + err.message, type: "error" }))
      .finally(() => setLoadingTerminals(false));
  }, []);

  // Fetch merchants on mount
  useEffect(() => {
    setLoadingMerchants(true);
    apiGet<{ data: MerchantAccount[] }>("/api/terminal/merchants")
      .then((res) => {
        const list = res.data || [];
        setMerchants(list);
        setCompanyAccount(list.length > 0 && list[0].companyId ? list[0].companyId : "\u2014");
        if (list.length === 1) setSelectedMerchantRaw(list[0].id);
      })
      .catch((err) => {
        setStatus({ msg: "Failed to load merchants: " + err.message, type: "error" });
        setCompanyAccount("\u2014");
      })
      .finally(() => setLoadingMerchants(false));
  }, []);

  // Fetch stores + terminals when merchant changes
  useEffect(() => {
    if (!selectedMerchant) {
      setStores([]);
      setTerminals([]);
      setSelectedStoreRaw("");
      setSelectedTerminal("");
      return;
    }

    setLoadingStores(true);
    apiGet<{ data: Store[] }>(`/api/terminal/stores?merchantId=${encodeURIComponent(selectedMerchant)}`)
      .then((res) => setStores(res.data || []))
      .catch((err) => setStatus({ msg: "Failed to load stores: " + err.message, type: "error" }))
      .finally(() => setLoadingStores(false));

    fetchTerminals(selectedMerchant, "");
    // fetchTerminals is stable (useCallback with [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMerchant]);

  // Re-fetch terminals when store filter changes
  useEffect(() => {
    if (!selectedMerchant) return;
    fetchTerminals(selectedMerchant, selectedStore);
    // selectedMerchant is intentionally omitted: this effect only reacts to
    // store changes; the merchant effect already handles the initial fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore]);

  // Wrapped setters with cascade resets
  const setSelectedMerchant = useCallback((id: string) => {
    setSelectedMerchantRaw(id);
    setSelectedStoreRaw("");
    setSelectedTerminal("");
    setStatus(null);
  }, []);

  const setSelectedStore = useCallback((id: string) => {
    setSelectedStoreRaw(id);
    setSelectedTerminal("");
  }, []);

  return {
    companyAccount,
    merchants,
    stores,
    terminals,
    selectedMerchant,
    selectedStore,
    selectedTerminal,
    status,
    loadingMerchants,
    loadingStores,
    loadingTerminals,
    setSelectedMerchant,
    setSelectedStore,
    setSelectedTerminal,
    setStatus,
  };
}
