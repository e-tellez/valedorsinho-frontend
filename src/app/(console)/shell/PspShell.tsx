"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, PanelRight } from "lucide-react";
import { NO_INSPECTOR } from "../mock";
import { InspectorProvider } from "./inspector-context";
import LeftRail from "./LeftRail";
import Inspector from "./Inspector";

export default function PspShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slug = pathname.replace(/^\//, "").split("/")[0] || "dashboard";
  const showInspector = !NO_INSPECTOR.has(slug);

  const [navOpen, setNavOpen] = useState(false);
  const [inspOpen, setInspOpen] = useState(false);
  const closeAll = () => { setNavOpen(false); setInspOpen(false); };

  // Drawers are a mobile-only affordance: close them whenever the route changes.
  useEffect(() => { closeAll(); }, [pathname]);

  // Escape closes any open drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeAll(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const drawerOpen = navOpen || inspOpen;

  return (
    <InspectorProvider>
      <div className="cb">
        <div className={`cb-shell ${showInspector ? "" : "cb-shell--no-inspector"}`}>
          <header className="cb-topbar">
            <button
              className="cb-topbar__btn"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navOpen}
            >
              <Menu size={20} />
            </button>
            <span className="cb-topbar__brand">Valedorsinho</span>
            {showInspector ? (
              <button
                className="cb-topbar__btn"
                onClick={() => setInspOpen(true)}
                aria-label="Open inspector"
                aria-expanded={inspOpen}
              >
                <PanelRight size={20} />
              </button>
            ) : (
              <span className="cb-topbar__spacer" aria-hidden="true" />
            )}
          </header>

          <aside className={`cb-rail-col ${navOpen ? "is-open" : ""}`}>
            <button className="cb-drawer-close" onClick={() => setNavOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
            <LeftRail />
          </aside>

          <main className="cb-main-col">{children}</main>

          {showInspector && (
            <aside className={`cb-insp-col ${inspOpen ? "is-open" : ""}`}>
              <button className="cb-drawer-close" onClick={() => setInspOpen(false)} aria-label="Close inspector">
                <X size={18} />
              </button>
              <Inspector />
            </aside>
          )}

          {drawerOpen && (
            <button className="cb-scrim" aria-label="Close panel" onClick={closeAll} />
          )}
        </div>
      </div>
    </InspectorProvider>
  );
}
