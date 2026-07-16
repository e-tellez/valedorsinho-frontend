"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/context/theme/ThemeContext";

const ICONS: Record<ThemeMode, React.ReactNode> = {
  system: <Monitor className="w-[15px] h-[15px]" />,
  dark: <Moon className="w-[15px] h-[15px]" />,
  light: <Sun className="w-[15px] h-[15px]" />,
};

const LABELS: Record<ThemeMode, string> = {
  system: "System",
  dark: "Dark",
  light: "Light",
};

export function ThemeToggle() {
  const { mode, cycleMode } = useTheme();

  return (
    <button
      onClick={cycleMode}
      title={`Theme: ${LABELS[mode]} — click to cycle`}
      className="
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        text-[0.78rem] font-semibold
        text-[#555] bg-[#f0f0f0] border border-[#ddd]
        transition-colors duration-150
        hover:bg-[#e5e5e5] hover:border-[#bbb]
        dark:text-[#8b949e] dark:bg-[#161b22] dark:border-[#30363d]
        dark:hover:bg-[#1c2128] dark:hover:border-[#484f58]
      "
    >
      {ICONS[mode]}
      <span>{LABELS[mode]}</span>
    </button>
  );
}
