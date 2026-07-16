import Link from "next/link";

interface DashCardProps {
  href?: string;
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  badge?: string;
  badgeClass?: string;
  disabled?: boolean;
}

export default function DashCard({
  href,
  icon,
  iconClass,
  title,
  description,
  badge,
  badgeClass,
  disabled,
}: DashCardProps) {
  const content = (
    <>
      <div className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 border-2 border-gray-300 dark:border-[#1a2332] ${iconClass} transition-all duration-200`}>
        <div className="w-5 h-5">{icon}</div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="font-display text-[1.0625rem] font-bold text-gray-900 dark:text-[#e6edf3] tracking-tight">{title}</span>
        <span className="font-mono text-[0.75rem] text-gray-600 dark:text-[#8b949e] leading-[1.4] tracking-wide">{description}</span>
        {badge && (
          <span className={`inline-block mt-1 px-2 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider rounded-none w-fit border ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      {!disabled && (
        <div className="shrink-0 flex flex-col gap-0.5">
          <div className="w-1.5 h-1.5 bg-[#00d4ff] rounded-full" />
          <div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rounded-full" />
          <div className="w-1.5 h-1.5 bg-[#00d4ff]/20 rounded-full" />
        </div>
      )}
    </>
  );

  const base =
    "group relative flex items-center gap-3 bg-white dark:bg-[#0a0f1e] rounded-none py-3 px-3 border-2 border-gray-300 dark:border-[#1a2332] no-underline text-inherit transition-all duration-200 cursor-pointer overflow-hidden";
  const interactive = disabled
    ? " opacity-50 !cursor-default"
    : " hover:border-[#00d4ff] hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] hover:-translate-y-0.5 dark:hover:border-[#00d4ff] dark:hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]";

  if (disabled || !href) {
    return <div className={base + interactive}>{content}</div>;
  }

  return (
    <Link href={href} className={base + interactive}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00d4ff]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <div className="relative z-10 flex items-center gap-4 w-full">{content}</div>
    </Link>
  );
}
