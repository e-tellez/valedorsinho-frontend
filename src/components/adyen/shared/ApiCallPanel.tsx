"use client";

import ApiCallCard, { ApiCallEntry } from "./ApiCallCard";

// ---------------------------------------------------------------------------
// ApiCallPanel
//
// Fixed side-panel that renders a scrollable list of ApiCallCard entries.
// Always use this component (not an inline section) when displaying API calls
// in a page flow. The caller specifies the side.
//
// Usage:
//   <ApiCallPanel side="right" calls={apiCalls} />
//   <ApiCallPanel side="left"  calls={apiCalls} />
// ---------------------------------------------------------------------------

interface ApiCallPanelProps {
  /** Accumulated API call entries to display. Panel is hidden when empty. */
  calls: ApiCallEntry[];
  /** Which side of the viewport to pin the panel to. */
  side: "left" | "right";
}

export default function ApiCallPanel({ calls, side }: ApiCallPanelProps) {
  if (calls.length === 0) return null;

  const sideClass = side === "right" ? "right-4" : "left-4";

  return (
    <div
      className={`fixed top-12 ${sideClass} w-80 max-h-[calc(100vh-5rem)] flex flex-col gap-3 z-50`}
    >
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          API Calls
        </p>
        <span className="text-[0.65rem] font-semibold text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
          {calls.length}
        </span>
      </div>
      <div className="overflow-y-auto flex flex-col gap-3 pr-1">
        {calls.map((entry, i) => (
          <ApiCallCard key={i} {...entry} />
        ))}
      </div>
    </div>
  );
}
