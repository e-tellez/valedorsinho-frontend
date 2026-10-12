"use client";

import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { useInspector } from "../shell/inspector-context";

export default function ComingSoon({ title, slug }: { title: string; slug: string }) {
  const { reset } = useInspector();
  useEffect(() => { reset(); }, [reset]);

  return (
    <div className="cb-main">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">{title}</h1>
          <p className="cb-head__sub">
            This feature hasn&apos;t been migrated into the new console yet. The current
            version still works at its original route while we port it.
          </p>
        </div>
      </header>

      <div className="cb-panel">
        <div className="cb-panel__hd"><h3>Not migrated yet</h3></div>
        <div className="cb-panel__bd">
          <p style={{ fontSize: ".88rem", color: "var(--cb-ink-2)", lineHeight: 1.55, marginBottom: 16 }}>
            {title} will be rebuilt into the three-column console with the shared inspector.
            Until then, open the existing implementation.
          </p>
          <a className="cb-btn cb-btn--accent" href={`/legacy/${slug}`} target="_blank" rel="noopener noreferrer">
            Open current version
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
