"use client";

import React, { useState } from "react";
import {
  Mic,
  Share2,
  User,
  ShieldCheck,
  Globe,
  LayoutDashboard,
  LogOut,
  ArrowRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { BreathOrb } from "@/components/ui/breath-orb";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopBarProps {
  title: string;
  onOpenVoiceMode: () => void;
  onToggleSidebarMobile?: () => void;
  onGoToLanding?: () => void;
  selectedLanguage: "en" | "hi" | "gu";
  onLanguageChange: (language: "en" | "hi" | "gu") => void;
}

const LANGUAGES = [
  { code: "English (US)", name: "English" },
  { code: "Hindi (IN)", name: "हिन्दी" },
  { code: "Gujarati (IN)", name: "ગુજરાતી" },
];

export function TopBar({
  title,
  onOpenVoiceMode,
  onGoToLanding,
  selectedLanguage,
  onLanguageChange,
}: TopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { user, logout } = useAuth() as { user: any; logout: () => void };
  const router = useRouter();

  function handleLogout() {
    logout();
    setShowProfileMenu(false);
    router.push("/login");
  }

  const currentLangObj = LANGUAGES[
    selectedLanguage === "en" ? 0 : selectedLanguage === "hi" ? 1 : 2
  ];

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Brand & Thread Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoToLanding}
          className="flex items-center gap-2 group text-left focus:outline-none"
          title="Return to Home"
        >
          <BreathOrb size="sm" mode="idle" />
          <span className="font-semibold text-sm tracking-tight text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
            Elixora
          </span>
        </button>

        <span className="text-[var(--border)] font-light text-sm">/</span>

        <h1 className="text-xs sm:text-sm font-medium text-[var(--ink)] truncate max-w-[200px] sm:max-w-[320px]">
          {title}
        </h1>
      </div>

      {/* Right: Language, Voice Mode, Theme Toggle, Profile */}
      <div className="flex items-center gap-2">
        {/* Language Selector Dropdown */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setShowLanguageMenu(!showLanguageMenu);
              setShowProfileMenu(false);
            }}
            className="flex items-center gap-1.5 text-xs text-[var(--ink)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] transition-colors focus:outline-none"
            aria-label="Select language"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-medium">{currentLangObj.name}</span>
            <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]" />
          </button>

          {showLanguageMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLanguageMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-44 bg-[#0A0E1A] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-fade-in space-y-0.5">
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
                          lang.code === "English (US)" ? "en" :
                          lang.code === "Hindi (IN)" ? "hi" : "gu"
                        );
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors font-medium ${
                        isSelected
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <span>{lang.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Live Voice Mode Button */}
        <button
          onClick={onOpenVoiceMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all text-xs font-medium shadow-xs"
          title="Launch Live Voice Conversation"
        >
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Voice Mode</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile / Auth Section */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--glow-a)] text-white font-medium text-xs flex items-center justify-center border border-[var(--border)] shadow-xs hover:scale-105 transition-transform uppercase"
              aria-label="User profile menu"
            >
              {user.name ? user.name.charAt(0) : <User className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2 z-50 text-xs animate-fade-in">
                  <div className="p-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]/50 rounded-xl mb-1">
                    <p className="font-semibold text-[var(--ink)] truncate">{user.name}</p>
                    <p className="text-[var(--ink-muted)] text-[11px] truncate">{user.email}</p>
                  </div>
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[var(--surface-muted)] rounded-lg flex items-center gap-2 text-[var(--ink)]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>HIPAA & Privacy Settings</span>
                    </button>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[var(--surface-muted)] rounded-lg flex items-center gap-2 text-[var(--ink)]"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Export Medical History</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-[var(--border)]">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-rose-500/10 text-rose-600 rounded-lg flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out / Switch Account</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 rounded-full bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <span>Sign up</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
