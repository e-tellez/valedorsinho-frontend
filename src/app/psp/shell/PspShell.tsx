"use client";

import { usePathname } from "next/navigation";
import { NO_INSPECTOR } from "../mock";
import { InspectorProvider } from "./inspector-context";
import LeftRail from "./LeftRail";
import Inspector from "./Inspector";

export default function PspShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slug = pathname.replace(/^\/psp\/?/, "").split("/")[0] || "dashboard";
  const showInspector = !NO_INSPECTOR.has(slug);

  return (
    <InspectorProvider>
      <div className="cb">
        <div className={`cb-shell ${showInspector ? "" : "cb-shell--no-inspector"}`}>
          <LeftRail />
          <main className="cb-main-col">{children}</main>
          {showInspector && (
            <aside className="cb-insp-col">
              <Inspector />
            </aside>
          )}
        </div>
      </div>
    </InspectorProvider>
  );
}
