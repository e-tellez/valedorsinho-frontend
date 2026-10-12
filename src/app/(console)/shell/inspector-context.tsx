"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { LogEntry } from "../mock";

export type NewEntry = Omit<LogEntry, "id" | "time"> & { id?: string; time?: string };

interface InspectorValue {
  entries: LogEntry[];
  /** Append an entry; returns its id so it can be updated later. */
  push: (entry: NewEntry) => string;
  /** Patch an existing entry (e.g. pending → settled). */
  update: (id: string, patch: Partial<LogEntry>) => void;
  /** Clear the registry — each feature starts its own session. */
  reset: () => void;
}

const InspectorContext = createContext<InspectorValue | null>(null);

function nowTime(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `e${Date.now()}${Math.random().toString(16).slice(2)}`;
}

export function InspectorProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const seq = useRef(0);

  const push = useCallback((entry: NewEntry) => {
    const id = entry.id ?? `${makeId()}-${seq.current++}`;
    const full: LogEntry = { ...entry, id, time: entry.time ?? nowTime() };
    setEntries((prev) => [...prev, full]);
    return id;
  }, []);

  const update = useCallback((id: string, patch: Partial<LogEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const reset = useCallback(() => setEntries([]), []);

  return (
    <InspectorContext.Provider value={{ entries, push, update, reset }}>
      {children}
    </InspectorContext.Provider>
  );
}

export function useInspector(): InspectorValue {
  const ctx = useContext(InspectorContext);
  if (!ctx) throw new Error("useInspector must be used within <InspectorProvider>");
  return ctx;
}
