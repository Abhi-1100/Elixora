"use client";

import React, { useState } from "react";
import {
  Mic,
  Share2,
  User,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { BreathOrb } from "@/components/ui/breath-orb";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopBarProps {
  title: string;
  onOpenVoiceMode: () => void;
  onToggleSidebarMobile?: () => void;
  onGoToLanding?: () => void;
}

export function TopBar({
  title,
  onOpenVoiceMode,
  onGoToLanding,
}: TopBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English (US)");

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
        <div className="hidden md:flex items-center gap-1 text-xs text-[var(--ink-muted)] bg-[var(--surface-muted)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
          <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent text-[var(--ink)] focus:outline-none cursor-pointer"
          >
            <option value="English (US)">English</option>
            <option value="Spanish (ES)">Español</option>
            <option value="French (FR)">Français</option>
            <option value="German (DE)">Deutsch</option>
            <option value="Hindi (IN)">हिन्दी</option>
            <option value="Mandarin (CN)">中文</option>
          </select>
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

        {/* Theme Toggle — uses global context */}
        <ThemeToggle />

        {/* Profile Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--glow-a)] text-white font-medium text-xs flex items-center justify-center border border-[var(--border)] shadow-xs hover:scale-105 transition-transform"
            aria-label="User profile menu"
          >
            <User className="w-4 h-4" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2 z-50 text-xs">
              <div className="p-2.5 border-b border-[var(--border)]">
                <p className="font-semibold text-[var(--ink)]">Dr. Alex Morgan</p>
                <p className="text-[var(--ink-muted)] text-[11px]">alex.morgan@health.org</p>
              </div>
              <div className="py-1">
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
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
