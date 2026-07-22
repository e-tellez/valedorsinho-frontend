import type { Metadata } from "next";
import {
  CreditCard,
  FileText,
  CheckSquare,
  Monitor,
  Package,
  Nfc,
  Settings,
  Pencil,
  MessageSquare,
  Bot,
  Network,
} from "lucide-react";
import { ThemeToggle } from "@/components/adyen/shared/ThemeToggle";
import DashCard from "@/components/adyen/shared/DashCard";
import SystemStatus from "@/components/adyen/shared/SystemStatus";
import OnboardingBanner from "@/components/adyen/shared/OnboardingBanner";

export const metadata: Metadata = {
  title: "Valedorsinho – Dashboard",
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  return (
    <div className="w-full max-w-[900px]">
      {/* Header */}
      <header className="relative text-center mb-12 noise-overlay">
        {/* Corner brackets */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-[#00d4ff]/30" />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-r-2 border-t-2 border-[#00d4ff]/30" />
        
        <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
          <ThemeToggle />
          <SystemStatus />
        </div>
        
        <div className="relative inline-block">
          <h1 className="font-display text-[3rem] font-black tracking-tighter text-gray-900 dark:text-[#e6edf3] mb-2 [text-shadow:0_2px_4px_rgb(0_0_0/0.08)] dark:[text-shadow:0_0_30px_rgba(0,212,255,0.15),0_2px_10px_rgb(0_0_0/0.4)]">
            Valedorsinho
          </h1>
          <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent" />
        </div>
        
        <p className="font-mono text-[0.8125rem] font-medium tracking-widest uppercase text-gray-500 dark:text-[#8b949e] mt-3 opacity-80">
          Adyen Unified Commerce Toolbox
        </p>
      </header>

      <OnboardingBanner />

      {/* Two-column section: Digital | Unified Commerce */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Digital */}
        <div className="relative">
          <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-[#00d4ff]/40" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-[#00d4ff]/40" />
          <h2 className="font-mono text-[0.875rem] font-bold uppercase tracking-widest text-gray-600 dark:text-[#00d4ff] pb-2 border-b-2 border-gray-300 dark:border-[#1a2332] text-center mb-4 relative">
            <span className="bg-white dark:bg-[#050810] px-3 relative z-10">Digital</span>
          </h2>
          <div className="flex flex-col gap-2">
            <DashCard href="/checkout" icon={<CreditCard className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#00d4ff] dark:text-[#00d4ff]" title="Checkout" description="Drop-in & Components integration demos." badge="WIP" badgeClass="bg-transparent border-[#ffaa00] text-[#ffaa00]" />
            <DashCard href="/payload-suggested" icon={<FileText className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#00d4ff] dark:text-[#00d4ff]" title="Payload Suggested" description="Recommended payloads per vertical." badge="WIP" badgeClass="bg-transparent border-[#ffaa00] text-[#ffaa00]" />
            <DashCard href="/payload-validator" icon={<CheckSquare className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#00d4ff] dark:text-[#00d4ff]" title="Payload Validator" description="Validate payloads against Adyen OpenAPI specs." badge="WIP" badgeClass="bg-transparent border-[#ffaa00] text-[#ffaa00]" />
            <DashCard href="/ucp-agentic-commerce" icon={<Bot className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#c084fc] dark:text-[#c084fc]" title="UCP Agentic Commerce" description="Interactive AI-agent commerce lifecycle demo." badge="Demo" badgeClass="bg-transparent border-[#c084fc] text-[#c084fc]" />
          </div>
        </div>

        {/* Unified Commerce */}
        <div className="relative">
          <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-[#00ff88]/40" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-[#00ff88]/40" />
          <h2 className="font-mono text-[0.875rem] font-bold uppercase tracking-widest text-gray-600 dark:text-[#00ff88] pb-2 border-b-2 border-gray-300 dark:border-[#1a2332] text-center mb-4 relative">
            <span className="bg-white dark:bg-[#050810] px-3 relative z-10">Unified Commerce</span>
          </h2>
          <div className="flex flex-col gap-2">
            <DashCard href="/terminal-payments" icon={<Monitor className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#00ff88] dark:text-[#00ff88]" title="Terminal Payments" description="Send payment requests to in-person terminals." badge="WIP" badgeClass="bg-transparent border-[#ffaa00] text-[#ffaa00]" />
            <DashCard href="/terminal-fleet" icon={<Package className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#00ff88] dark:text-[#00ff88]" title="Terminal Fleet Manager" description="Manage and monitor your terminal fleet." badge="WIP" badgeClass="bg-transparent border-[#ffaa00] text-[#ffaa00]" />
            <DashCard href="/nfc-formatter" icon={<Nfc className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#00ff88] dark:text-[#00ff88]" title="NFC Formatter" description="Configure NFC tap-to-pay credentials." badge="WIP" badgeClass="bg-transparent border-[#ffaa00] text-[#ffaa00]" />
          </div>
        </div>
      </div>

      {/* Additional Tools */}
      <div className="relative">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-6 border-2 border-[#ffaa00]/30 rotate-45" />
        <h2 className="font-mono text-[0.875rem] font-bold uppercase tracking-widest text-gray-600 dark:text-[#ffaa00] pb-2 border-b-2 border-gray-300 dark:border-[#1a2332] text-center mb-4 relative">
          <span className="bg-white dark:bg-[#050810] px-3 relative z-10">Additional Tools</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashCard href="/setup" icon={<Settings className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-gray-600 dark:text-[#8b949e]" title="Set Up" description="Configure your Adyen API key, client key and merchant account." />
          <DashCard href="/management-api" icon={<Pencil className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-gray-600 dark:text-[#8b949e]" title="Management API" description="Explore and interact with the Adyen Management API." badge="WIP" badgeClass="bg-transparent border-[#ffaa00] text-[#ffaa00]" />
          <DashCard href="/webhooks" icon={<MessageSquare className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-[#00d4ff] dark:text-[#00d4ff]" title="Webhook Logs" description="Monitor incoming Adyen webhook notifications." />
          <DashCard href="/account-structure" icon={<Network className="w-full h-full" />} iconClass="bg-gray-100 dark:bg-[#0a0f1e] text-gray-600 dark:text-[#8b949e]" title="Account Structure" description="Learn how Adyen organizes merchants, stores, and settlements." />
        </div>
      </div>
    </div>
  );
}
