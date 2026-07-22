import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
  showBack?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Dashboard",
  right,
  showBack = true,
}: PageHeaderProps) {
  return (
    <header className="relative mb-12 noise-overlay">
      {/* Technical scan-line accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#00d4ff]/10 to-transparent blur-sm" />
      
      {/* Corner brackets - industrial frame */}
      <div className="absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 border-[#00d4ff]/30" />
      <div className="absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 border-[#00d4ff]/30" />
      
      <div className="flex items-start gap-8 pt-8">
        {/* Back button - left aligned */}
        <div className="flex-none pt-2">
          {showBack ? (
            <Link
              href={backHref}
              className="group inline-flex items-center gap-2.5 px-4 py-2.5 
                         font-mono text-[0.6875rem] font-bold tracking-widest uppercase
                         text-gray-700 dark:text-[#00d4ff]
                         bg-gray-50 dark:bg-[#0a0f1e]
                         border-2 border-gray-300 dark:border-[#1a2332]
                         rounded-none
                         transition-all duration-200
                         hover:border-gray-500 dark:hover:border-[#00d4ff]
                         hover:-translate-x-1.5
                         hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]
                         dark:hover:shadow-[4px_4px_0_0_rgba(0,212,255,0.2)]
                         no-underline
                         relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00d4ff]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 relative z-10" />
              <span className="hidden sm:inline relative z-10">{backLabel}</span>
            </Link>
          ) : (
            <div className="w-[120px]" aria-hidden="true" />
          )}
        </div>

        {/* Title - centered and dominant */}
        <div className="flex-1 text-center relative">
          <div className="inline-block relative">
            {/* Angular corner accents */}
            <div className="absolute -left-6 top-0 w-4 h-4 border-l-2 border-t-2 border-[#00d4ff]/40" />
            <div className="absolute -right-6 top-0 w-4 h-4 border-r-2 border-t-2 border-[#00d4ff]/40" />
            <div className="absolute -left-6 bottom-0 w-4 h-4 border-l-2 border-b-2 border-[#00d4ff]/20" />
            <div className="absolute -right-6 bottom-0 w-4 h-4 border-r-2 border-b-2 border-[#00d4ff]/20" />
            
            {/* Glowing accent dots */}
            <div className="absolute -left-8 top-1/2 w-1.5 h-1.5 bg-[#00d4ff] rounded-full shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
            <div className="absolute -right-8 top-1/2 w-1.5 h-1.5 bg-[#00d4ff] rounded-full shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
            
            <h1 className="font-display text-[2.25rem] sm:text-[3rem] font-black tracking-tighter
                           text-gray-900 dark:text-[#e6edf3]
                           leading-none mb-3
                           [text-shadow:0_2px_4px_rgb(0_0_0/0.08)]
                           dark:[text-shadow:0_0_30px_rgba(0,212,255,0.15),0_2px_10px_rgb(0_0_0/0.4)]
                           relative">
              <span className="relative inline-block">
                {title}
                <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent" />
              </span>
            </h1>
            
            {subtitle && (
              <p className="font-mono text-[0.75rem] font-medium tracking-wider uppercase
                           text-gray-500 dark:text-[#8b949e]
                           max-w-[600px] mx-auto leading-relaxed
                           opacity-80">
                {subtitle}
              </p>
            )}
            
            {/* Technical underline with data visualization aesthetic */}
            <div className="mt-4 flex items-center justify-center gap-1">
              <div className="w-2 h-[2px] bg-[#00d4ff]/40" />
              <div className="w-4 h-[2px] bg-[#00d4ff]/60" />
              <div className="w-8 h-[3px] bg-[#00d4ff]" />
              <div className="w-4 h-[2px] bg-[#00d4ff]/60" />
              <div className="w-2 h-[2px] bg-[#00d4ff]/40" />
            </div>
          </div>
        </div>

        {/* Right slot - balanced spacing */}
        <div className="flex-none pt-2">
          {right || <div className="w-[120px]" aria-hidden="true" />}
        </div>
      </div>
      
      {/* Bottom technical line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-[#1a2332] to-transparent" />
    </header>
  );
}
