"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiPost } from "@/lib/adyen/api";

function SessionsRedirectPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectResult = searchParams.get("redirectResult") || searchParams.get("payload");
    if (!redirectResult) {
      setError("No redirect result found in URL parameters.");
      return;
    }

    apiPost<Record<string, unknown>>("/api/checkout/redirect", { redirectResult })
      .then((result) => {
        const status = ["Authorised", "Pending", "Received"].includes(result.resultCode as string)
          ? "success"
          : "failure";
        try { sessionStorage.setItem("adyen_result", JSON.stringify(result)); } catch {}
        const params = new URLSearchParams({
          status,
          resultCode: (result.resultCode as string) || "",
          pspReference: (result.pspReference as string) || "",
          integrationType: "Sessions",
        });
        router.push(`/checkout/result?${params.toString()}`);
      })
      .catch((err: Error) => setError(err.message));
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="w-full max-w-[600px] text-center py-20">
        <p className="text-red-600 font-semibold mb-2">Redirect Error</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] text-center py-20">
      <div className="flex items-center justify-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        <span>Processing redirect…</span>
      </div>
    </div>
  );
}

export default function SessionsRedirectPage() {
  return (
    <Suspense fallback={null}>
      <SessionsRedirectPageInner />
    </Suspense>
  );
}
