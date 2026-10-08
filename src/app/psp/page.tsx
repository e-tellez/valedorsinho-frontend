"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DASHBOARD_ROWS, type FeatureRow } from "./mock";
import { useInspector } from "./shell/inspector-context";

function hrefFor(id: string): string {
  return `/psp/${id}`;
}

function flapClass(s: FeatureRow["status"]): string {
  return s === "ok" ? "cb-flap--ok" : s === "pend" ? "cb-flap--pend" : s === "err" ? "cb-flap--err" : "cb-flap--info";
}

export default function DashboardPage() {
  const { reset } = useInspector();

  // Dashboard owns an empty registry session.
  useEffect(() => { reset(); }, [reset]);

  return (
    <div className="cb-main">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Payment Service Provider</h1>
          <p className="cb-head__sub">
            Every service below runs a real Adyen flow against TEST and posts its
            message exchange to the inspector on the right.
          </p>
        </div>
      </header>

      <section className="cb-board">
        <div className="cb-board__caption">
          <h2>Services</h2>
          <span className="cb-board__rule" />
        </div>
        <div className="cb-rows">
          {DASHBOARD_ROWS.map((row, i) => (
            <Link key={row.id} href={hrefFor(row.id)} className="cb-row" style={{ animationDelay: `${i * 45}ms` }}>
              <span className="cb-row__track">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="cb-row__name">{row.name}</span>
                <span className="cb-row__gloss">{row.gloss}</span>
              </span>
              <span className={`cb-flap ${flapClass(row.status)}`}>
                <span className="cb-lamp" />
                {row.state}
              </span>
              <ArrowRight className="cb-row__arrow" size={16} />
            </Link>
          ))}
        </div>
      </section>

      <section className="cb-learn">
        <h3>The three-party flow</h3>
        <p>
          A payment is a conversation between three systems. Valedorsinho makes that
          conversation visible: watch the inspector on the right as a request leaves the
          merchant server, the shopper acts, and Adyen answers.
        </p>
        <div className="cb-flow">
          <div className="cb-node cb-node--merchant">
            <div className="cb-node__lamp" />
            <div className="cb-node__k">Sends &amp; receives</div>
            <div className="cb-node__v">Merchant server</div>
          </div>
          <span className="cb-flow__link"><ArrowRight size={18} /></span>
          <div className="cb-node cb-node--shopper">
            <div className="cb-node__lamp" />
            <div className="cb-node__k">Acts</div>
            <div className="cb-node__v">Shopper</div>
          </div>
          <span className="cb-flow__link"><ArrowRight size={18} /></span>
          <div className="cb-node cb-node--adyen">
            <div className="cb-node__lamp" />
            <div className="cb-node__k">Authorises</div>
            <div className="cb-node__v">Adyen server</div>
          </div>
        </div>
      </section>
    </div>
  );
}
