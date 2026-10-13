"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, CreditCard, Smartphone, FileText, CheckSquare,
  Monitor, Package, Nfc, MessageSquare, Pencil, Network, Settings,
  Wallet, Layers, ShoppingBag, Users, ChevronDown, Sun, Moon, type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/context/theme/ThemeContext";
import { apiFetch } from "@/lib/adyen/api";
import type { AdyenSetupConfig } from "@/lib/adyen/types";
import { NAV, PROFILES, type NavSection } from "../mock";

const ICONS: Record<string, LucideIcon> = {
  LayoutGrid, CreditCard, Smartphone, FileText, CheckSquare,
  Monitor, Package, Nfc, MessageSquare, Pencil, Network, Settings,
  Wallet, Layers, ShoppingBag, Users,
};

const ADMIN_SECTION: NavSection = {
  label: "Admin",
  items: [{ id: "admin", label: "Users", icon: "Users" }],
};

function hrefFor(id: string): string {
  return id === "dashboard" ? "/" : `/${id}`;
}

export default function LeftRail() {
  const { resolvedTheme, setMode } = useTheme();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const isDark = resolvedTheme === "dark";

  const activeSlug = pathname.replace(/^\//, "").split("/")[0] || "dashboard";

  useEffect(() => {
    apiFetch<AdyenSetupConfig>("/api/auth/config")
      .then((config) => setIsAdmin(config.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  const sections = isAdmin ? [...NAV, ADMIN_SECTION] : NAV;

  return (
    <aside className="cb-rail-col">
      <div className="cb-brand">
        <div className="cb-brand__name">Valedorsinho</div>
        <div className="cb-brand__sub">Adyen Unified Commerce</div>
      </div>

      <div className="cb-rail-scroll">
        <div className="cb-sectlabel">Active profile</div>
        <div className="cb-proftiles">
          {PROFILES.map((p) => {
            const PIcon = ICONS[p.icon] ?? Wallet;
            const active = p.id === "psp";
            return (
              <button
                key={p.id}
                className={`cb-proftile ${active ? "cb-proftile--active" : ""}`}
                disabled={!p.enabled}
                aria-current={active ? "true" : undefined}
                title={p.enabled ? p.name : `${p.name} — coming soon`}
              >
                <span className="cb-proftile__badge"><PIcon className="cb-proftile__icon" /></span>
                <span className="cb-proftile__name">{p.name}</span>
              </button>
            );
          })}
        </div>

        {sections.map((section) => {
          const collapsible = section.items.length > 1;
          const open = !collapsible || !collapsed[section.label];
          return (
            <div key={section.label} className="cb-navgroup">
              {collapsible ? (
                <button
                  className="cb-sectlabel cb-sectlabel--btn"
                  onClick={() => setCollapsed((c) => ({ ...c, [section.label]: !c[section.label] }))}
                  aria-expanded={open}
                >
                  {section.label}
                  <ChevronDown className={`cb-sect-chev ${open ? "is-open" : ""}`} />
                </button>
              ) : (
                <div className="cb-sectlabel">{section.label}</div>
              )}
              {open && (
                <nav className="cb-nav">
                  {section.items.map((item) => {
                    const Icon = ICONS[item.icon] ?? LayoutGrid;
                    const active = item.id === activeSlug;
                    return (
                      <Link
                        key={item.id}
                        href={hrefFor(item.id)}
                        className={`cb-navitem ${active ? "cb-navitem--active" : ""}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="cb-navitem__icon" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
          );
        })}
      </div>

      <div className="cb-rail-foot">
        <button className="cb-theme" onClick={() => setMode(isDark ? "light" : "dark")} title="Toggle light / dark">
          {isDark ? <Sun /> : <Moon />}
          {isDark ? "Light" : "Dark"}
        </button>
        <span className="cb-env">ENV <b>TEST</b></span>
      </div>
    </aside>
  );
}
