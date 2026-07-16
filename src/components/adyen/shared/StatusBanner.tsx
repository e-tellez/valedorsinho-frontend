import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface StatusBannerProps {
  msg: string;
  type: "success" | "error" | "info";
}

const STYLES: Record<StatusBannerProps["type"], string> = {
  success:
    "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
  error:
    "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
  info:
    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
};

const ICONS: Record<StatusBannerProps["type"], React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 shrink-0" />,
  info: <Info className="w-4 h-4 shrink-0" />,
};

export default function StatusBanner({ msg, type }: StatusBannerProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm mb-4 ${STYLES[type]}`}>
      {ICONS[type]}
      {msg}
    </div>
  );
}
