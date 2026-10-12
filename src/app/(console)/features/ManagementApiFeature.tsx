"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, MessageSquare, Users, CreditCard, KeyRound, ChevronRight, Loader2, Inbox, AlertTriangle } from "lucide-react";
import { apiGet } from "@/lib/adyen/api";
import type { MerchantAccount } from "@/lib/adyen/types";
import { useCallLogger } from "../shell/useCallLogger";

const UNAVAILABLE = [
  { icon: Users, title: "Users", desc: "Manage users and roles." },
  { icon: CreditCard, title: "Payment methods", desc: "Configure available payment methods." },
  { icon: KeyRound, title: "API credentials", desc: "Manage API keys and allowed origins." },
];

export default function ManagementApiFeature() {
  const log = useCallLogger();
  const [merchants, setMerchants] = useState<MerchantAccount[]>([]);
  const [company, setCompany] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log.reset();
    const id = log.begin({ label: "List merchant accounts", method: "GET", endpoint: "/management/me/merchantAccounts", request: {} });
    apiGet<{ data: MerchantAccount[] }>("/api/terminal/merchants")
      .then((res) => {
        const list = res.data || [];
        setMerchants(list);
        setCompany(list.find((m) => m.companyId)?.companyId || "—");
        log.ok(id, res);
      })
      .catch((err: Error) => { setError(err.message); log.err(id, { error: err.message }, 401); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cb-main">
      <div className="cb-mgmt">
        <header className="cb-head">
          <div>
            <h1 className="cb-head__title">Management API</h1>
            <p className="cb-head__sub">
              Explore your Adyen Management API resources. Merchant accounts load live below; the backend
              exposes a subset of the Management API today.
            </p>
          </div>
        </header>

        {/* Accounts — live from the Management API */}
        <section className="cb-mgmt__sec">
          <div className="cb-mgmt__hd">Accounts · company {company}</div>
          {loading ? (
            <div className="cb-skel-list">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="cb-skel" />)}</div>
          ) : error ? (
            <div className="cb-banner cb-banner--err"><AlertTriangle size={15} /><span>{error}</span></div>
          ) : merchants.length === 0 ? (
            <div className="cb-tblwrap"><div className="cb-empty"><Inbox size={22} /><p>No merchant accounts</p></div></div>
          ) : (
            <div className="cb-tblwrap">
              <table className="cb-tbl">
                <thead>
                  <tr><th>Merchant account</th><th>Name</th><th>Company</th></tr>
                </thead>
                <tbody>
                  {merchants.map((m) => (
                    <tr key={m.id}>
                      <td><span className="cb-tbl__id">{m.id}</span></td>
                      <td>{m.name || "—"}</td>
                      <td><span className="cb-tbl__muted">{m.companyId || "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Explore — cross-links to wired features */}
        <section className="cb-mgmt__sec">
          <div className="cb-mgmt__hd">Explore</div>
          <div className="cb-flowgrid">
            <Link className="cb-flowcard" href="/psp/terminal-fleet">
              <span className="cb-flowcard__badge"><Monitor size={18} /></span>
              <span className="cb-flowcard__txt">
                <b>Terminals</b>
                <span>Browse and reassign terminal devices in the Fleet manager.</span>
              </span>
              <ChevronRight size={18} style={{ color: "var(--cb-ink-3)", flex: "none" }} />
            </Link>
            <Link className="cb-flowcard" href="/psp/webhooks">
              <span className="cb-flowcard__badge"><MessageSquare size={18} /></span>
              <span className="cb-flowcard__txt">
                <b>Webhooks</b>
                <span>Inspect inbound Adyen notifications in Webhook Logs.</span>
              </span>
              <ChevronRight size={18} style={{ color: "var(--cb-ink-3)", flex: "none" }} />
            </Link>
          </div>
        </section>

        {/* Not yet available — no backend endpoint */}
        <section className="cb-mgmt__sec">
          <div className="cb-mgmt__hd">Not yet available</div>
          <div className="cb-flowgrid">
            {UNAVAILABLE.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="cb-flowcard is-disabled" aria-disabled="true">
                <span className="cb-flowcard__badge"><Icon size={18} /></span>
                <span className="cb-flowcard__txt">
                  <b>{title}</b>
                  <span>{desc} No backend endpoint yet.</span>
                </span>
                <span className="cb-pill">SOON</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
