import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  showBack?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Dashboard",
  right,
  left,
  showBack = true,
}: PageHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 noise-overlay
                       bg-white/95 dark:bg-[#050810]/92
                       backdrop-blur-md
                       border-b border-gray-200 dark:border-[#1a2332]">
      {/* Top scan-line accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#00d4ff]/10 to-transparent blur-sm" />

      {/* Corner brackets - industrial frame */}
      <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-[#00d4ff]/40" />
      <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-[#00d4ff]/40" />

      <div className="flex items-center h-14 px-4 sm:px-6 gap-3">
        {/* Left slot - back button or custom content */}
        <div className="flex-none min-w-[110px]">
          {left !== undefined ? left : showBack ? (
            <Link
              href={backHref}
              className="group inline-flex items-center gap-2 px-3 py-2
                         font-mono text-[0.65rem] font-bold tracking-widest uppercase
                         text-gray-700 dark:text-[#00d4ff]
                         bg-gray-50 dark:bg-[#0a0f1e]
                         border-2 border-gray-300 dark:border-[#1a2332]
                         rounded-none
                         transition-all duration-200
                         hover:border-gray-500 dark:hover:border-[#00d4ff]
                         hover:-translate-x-1
                         hover:shadow-[3px_3px_0_0_rgba(0,0,0,0.08)]
                         dark:hover:shadow-[3px_3px_0_0_rgba(0,212,255,0.15)]
                         no-underline
                         relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00d4ff]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5 relative z-10 shrink-0" />
              <span className="hidden sm:inline relative z-10 truncate">{backLabel}</span>
            </Link>
          ) : (
            <div aria-hidden="true" />
          )}
        </div>

        {/* Title - centered */}
        <div className="flex-1 text-center min-w-0 relative">
          {/* Glowing accent dots flanking the title */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-[#00d4ff] rounded-full shadow-[0_0_6px_rgba(0,212,255,0.7)] hidden sm:block" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-[#00d4ff] rounded-full shadow-[0_0_6px_rgba(0,212,255,0.7)] hidden sm:block" />

          <h1 className="font-display text-base sm:text-lg font-black tracking-tight
                         text-gray-900 dark:text-[#e6edf3]
                         leading-none
                         [text-shadow:0_1px_3px_rgb(0_0_0/0.06)]
                         dark:[text-shadow:0_0_20px_rgba(0,212,255,0.12),0_1px_6px_rgb(0_0_0/0.4)]
                         relative inline-block">
            {title}
            <div className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent" />
          </h1>

          {subtitle && (
            <p className="font-mono text-[0.6rem] font-medium tracking-widest uppercase
                         text-gray-500 dark:text-[#8b949e]
                         leading-none mt-1 opacity-80 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right slot */}
        <div className="flex-none min-w-[110px] flex justify-end">
          {right ?? null}
        </div>
      </div>

      {/* Bottom thin accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/15 to-transparent" />
    </header>
  );
}
