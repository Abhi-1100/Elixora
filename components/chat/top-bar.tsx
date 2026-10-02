"use client";

import React, { useState } from "react";
import {
  Globe,
  ChevronDown,
  Check,
  Menu,
  Settings,
  Siren,
  HeartHandshake,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopBarProps {
  title: string;
  onOpenVoiceMode: () => void;
  onToggleSidebarMobile?: () => void;
  onGoToLanding?: () => void;
  selectedLanguage: "en" | "hi" | "gu";
  onLanguageChange: (language: "en" | "hi" | "gu") => void;
  onOpenSettings?: (tab?: string) => void;
  onSos?: () => void;
}

const LANGUAGES = [
  { code: "English (US)", name: "English" },
  { code: "Hindi (IN)", name: "हिन्दी" },
  { code: "Gujarati (IN)", name: "ગુજરાતી" },
];

export function TopBar({
  title,
  onOpenVoiceMode,
  onToggleSidebarMobile,
  onGoToLanding,
  selectedLanguage,
  onLanguageChange,
  onOpenSettings,
  onSos,
}: TopBarProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const router = useRouter();

  const currentLangObj = LANGUAGES[
    selectedLanguage === "en" ? 0 : selectedLanguage === "hi" ? 1 : 2
  ];

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between px-3 sm:px-6 bg-transparent select-none">
      {/* Left: Mobile Toggle & Thread Title (subtle) */}
      <div className="flex min-w-0 items-center gap-2">
        {onToggleSidebarMobile && (
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-white/5 hover:text-[var(--ink)] transition-colors sm:hidden"
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {title && title !== "New Health Query" && (
          <span className="text-xs text-[var(--ink-muted)] truncate max-w-[200px] sm:max-w-xs font-normal">
            {title}
          </span>
        )}
      </div>

      {/* Right: "Free plan · Upgrade" pill, Language Switcher, and Mascot Icon */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {onSos && <button type="button" onClick={onSos} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20" title="Send an emergency alert"><Siren className="h-3.5 w-3.5" /> <span className="hidden sm:inline">SOS</span></button>}
        <Link href="/emergency" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-[var(--ink-muted)] transition hover:bg-white/5 hover:text-[var(--ink)]" title="Emergency contacts"><HeartHandshake className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Contacts</span></Link>
        {/* Plan & Upgrade Pill matching Claude screenshot */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
          <span className="opacity-70">Free plan</span>
          <span className="opacity-40">·</span>
          <button
            onClick={() => {
              if (onOpenSettings) {
                onOpenSettings("account");
              } else {
                router.push("/settings");
              }
            }}
            className="text-blue-400 font-medium hover:underline hover:text-blue-300 transition-colors"
          >
            Upgrade
          </button>
        </div>

        {/* Compact Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)] px-2 py-1 rounded-md hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="Select language"
          >
            <Globe className="w-3 h-3 opacity-70" />
            <span className="hidden sm:inline font-normal">{currentLangObj.name}</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {showLanguageMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLanguageMenu(false)}
              />
              <div className="absolute right-0 mt-1.5 w-36 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-50 text-xs animate-fade-in space-y-0.5">
                {LANGUAGES.map((lang) => {
                  const isSelected =
                    (selectedLanguage === "en" && lang.code === "English (US)") ||
                    (selectedLanguage === "hi" && lang.code === "Hindi (IN)") ||
                    (selectedLanguage === "gu" && lang.code === "Gujarati (IN)");
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(
                          lang.code === "English (US)"
                            ? "en"
                            : lang.code === "Hindi (IN)"
                            ? "hi"
                            : "gu"
                        );
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors text-xs ${
                        isSelected
                          ? "bg-white/10 text-[var(--ink)] font-medium"
                          : "text-[var(--ink-muted)] hover:bg-white/5 hover:text-[var(--ink)]"
                      }`}
                    >
                      <span>{lang.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Settings button on far right */}
        <button
          onClick={() => {
            if (onOpenSettings) {
              onOpenSettings("general");
            } else {
              router.push("/settings");
            }
          }}
          className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/5 transition-colors"
          title="Settings & Preferences"
        >
          <Settings className="w-4 h-4 opacity-80 hover:opacity-100" />
        </button>
      </div>
    </header>
  );
}

export default TopBar;
