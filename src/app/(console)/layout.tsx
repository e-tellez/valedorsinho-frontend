import type { Metadata } from "next";
import "./ledger.css";
import PspShell from "./shell/PspShell";

export const metadata: Metadata = {
  title: "Valedorsinho – PSP Console",
};

export default function PspLayout({ children }: { children: React.ReactNode }) {
  return <PspShell>{children}</PspShell>;
}
