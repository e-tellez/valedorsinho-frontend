import type { Metadata } from "next";
import AccountStructureDemo from "./AccountStructureDemo";

export const metadata: Metadata = {
  title: "Account Structure – Valedorsinho",
};

export default function AccountStructurePage() {
  return <AccountStructureDemo />;
}
