import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/adyen/shared/PageHeader";
import { User, Users, CreditCard, Lock, Webhook, Monitor } from "lucide-react";

export const metadata: Metadata = {
  title: "Management API – Valedorsinho",
};

/* ------------------------------------------------------------------ */
/* Section data                                                         */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { icon: <User className="w-full h-full" />, iconClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", title: "Account", description: "View and manage merchant account details." },
  { icon: <Users className="w-full h-full" />, iconClass: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", title: "Users", description: "Manage users and their roles." },
  { icon: <CreditCard className="w-full h-full" />, iconClass: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400", title: "Payment Methods", description: "Configure available payment methods." },
  { icon: <Lock className="w-full h-full" />, iconClass: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", title: "API Credentials", description: "Manage API keys and credential settings." },
  { icon: <Webhook className="w-full h-full" />, iconClass: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400", title: "Webhooks", description: "Configure and test webhook endpoints." },
  { icon: <Monitor className="w-full h-full" />, iconClass: "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400", title: "Terminals", description: "View and manage terminal devices." },
];

export default function ManagementApiPage() {
  return (
    <div className="w-full max-w-[900px]">
      <PageHeader
        title="Management API"
        subtitle="Explore and interact with the Adyen Management API."
        backHref="/"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map((section) => (
          <Link
            key={section.title}
            href="#"
            className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700
                       no-underline text-inherit transition-all duration-200
                       hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${section.iconClass}`}>
              <div className="w-5 h-5">{section.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[0.95rem] font-semibold text-gray-900 dark:text-white">
                {section.title}
              </span>
              <span className="block text-sm text-gray-500 dark:text-slate-400 leading-snug mt-0.5">
                {section.description}
              </span>
            </div>
            <span className="text-gray-300 dark:text-slate-600 text-xl font-light">&rsaquo;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
