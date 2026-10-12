"use client";

import { CreditCard, ChevronRight } from "lucide-react";

export default function ManageCardsEntry({
  shopperReference,
  onManage,
}: {
  shopperReference: string;
  onManage: () => void;
}) {
  return (
    <div className="cb-savedcards">
      <div className="cb-savedcards__hd">Saved cards</div>
      <button className="cb-savedcards__btn" onClick={onManage}>
        <span className="cb-savedcards__badge"><CreditCard size={18} /></span>
        <span className="cb-savedcards__txt">
          <b>Manage saved cards</b>
          <span>Add or remove stored cards for {shopperReference}.</span>
        </span>
        <ChevronRight size={18} className="cb-savedcards__arrow" />
      </button>
    </div>
  );
}
