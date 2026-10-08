"use client";

import { ChevronRight } from "lucide-react";
import { useCheckout } from "@/context/adyen/CheckoutContext";
import { getIntegrationsByCategory } from "@/lib/adyen/constants";
import ManageCardsEntry from "../ManageCardsEntry";

export interface Selection {
  product: "dropin" | "components";
  flow: "Advanced" | "Sessions";
}

export default function IntegrationStep({
  onBack,
  onSelect,
  onManage,
}: {
  onBack: () => void;
  onSelect: (sel: Selection) => void;
  onManage: () => void;
}) {
  const { state, setIntegration } = useCheckout();
  const categories = getIntegrationsByCategory();
  const displayAmount = (state.amountMinorUnits / 100).toFixed(2);

  return (
    <div>
      <h2 className="cb-ck__q">Integration type</h2>
      <p className="cb-ck__qsub">Choose your payment integration method.</p>

      <div className="cb-ordsum">
        <span><b>Order total:</b> {state.currency} {displayAmount}</span>
        <span><b>Shopper:</b> {state.shopperReference || "Guest"}</span>
        <span><b>Country:</b> {state.countryCode}</span>
      </div>

      {state.shopperReference && (
        <ManageCardsEntry shopperReference={state.shopperReference} onManage={onManage} />
      )}

      {categories.map((category) => (
        <div key={category.name} className="cb-intgroup">
          <div className="cb-intgroup__hd">{category.name}</div>
          <div className="cb-intlist">
            {category.integrations.map((integration) => {
              const product = integration.href.includes("components") ? "components" : "dropin";
              const flow = integration.href.includes("sessions") ? "Sessions" : "Advanced";
              return (
                <button
                  key={integration.href}
                  className="cb-intitem"
                  onClick={() => {
                    setIntegration(`${integration.name} (${category.name})`);
                    onSelect({ product, flow });
                  }}
                >
                  <span className="cb-intitem__txt">
                    <b>{integration.name}</b>
                    <span>{integration.note ? `${integration.note} ` : ""}{integration.description}</span>
                  </span>
                  <ChevronRight size={18} className="cb-intitem__arrow" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="cb-ck__actions">
        <button className="cb-btn cb-btn--pull-left" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
