"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Settings,
  User,
  Shield,
  Briefcase,
  History,
  Moon,
  Sun,
  Monitor,
  Code2,
  FileCode,
  Share2,
  Sparkles,
  ChevronDown,
  Check,
  Bell,
  SlidersHorizontal,
  LogOut,
  Trash2,
  KeyRound,
  Download,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export function SettingsModal({ isOpen, onClose, initialTab = "general" }: SettingsModalProps) {
  const { user, logout } = useAuth() as { user: any; logout: () => void };
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Appearance Settings State
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">("dark");
  const [chatFont, setChatFont] = useState("Editorial Serif");
  const [transcriptWidth, setTranscriptWidth] = useState<"narrow" | "medium" | "wide">("narrow");
  const [motionSetting, setMotionSetting] = useState<"system" | "reduced">("system");

  // Voice Settings State
  const [voiceLang, setVoiceLang] = useState("English");
  const [voiceStyle, setVoiceStyle] = useState("Buttery");
  const [voiceSpeed, setVoiceSpeed] = useState("Normal");

  // Dropdown UI toggles
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  // Load saved preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem("elixora_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.themeMode) setThemeMode(parsed.themeMode);
        if (parsed.chatFont) setChatFont(parsed.chatFont);
        if (parsed.transcriptWidth) setTranscriptWidth(parsed.transcriptWidth);
        if (parsed.motionSetting) setMotionSetting(parsed.motionSetting);
        if (parsed.voiceLang) setVoiceLang(parsed.voiceLang);
        if (parsed.voiceStyle) setVoiceStyle(parsed.voiceStyle);
        if (parsed.voiceSpeed) setVoiceSpeed(parsed.voiceSpeed);
      }
    } catch {}
  }, []);

  // Save changes
  const saveSetting = (key: string, value: any) => {
    try {
      const saved = localStorage.getItem("elixora_settings");
      const current = saved ? JSON.parse(saved) : {};
      current[key] = value;
      localStorage.setItem("elixora_settings", JSON.stringify(current));
    } catch {}
  };

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const fontOptions = [
    { label: "Editorial Serif", desc: "Warm editorial serif" },
    { label: "Geist Sans", desc: "Clean modern sans-serif" },
    { label: "Inter", desc: "Balanced interface font" },
    { label: "JetBrains Mono", desc: "Monospaced technical font" },
  ];

  const languageOptions = ["English", "Hindi (हिन्दी)", "Gujarati (ગુજરાતી)", "Spanish", "French"];
  const styleOptions = ["Buttery", "Empathetic & Calm", "Clinical Specialist", "Concise Professional"];
  const speedOptions = ["0.8x Slower", "Normal", "1.2x Faster", "1.5x Rapid"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-4xl h-[620px] max-h-[92vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden text-[var(--ink)] z-10">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-20 p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/10 transition-colors"
          title="Close Settings (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Left Sidebar of Settings matching Claude screenshot ── */}
        <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] p-3 flex flex-col bg-[var(--surface)]/95">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 text-[var(--ink)] text-xs rounded-lg pl-8 pr-3 py-1.5 border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none placeholder-[var(--ink-muted)] transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Section: Settings */}
            <div>
              <div className="px-2 pb-1 text-[11px] font-medium text-[var(--ink-muted)]">
                Settings
              </div>
              <div className="space-y-0.5">
                {[
                  { id: "general", label: "General", icon: Settings },
                  { id: "account", label: "Account", icon: User },
                  { id: "privacy", label: "Privacy", icon: Shield },
                  { id: "capabilities", label: "Capabilities", icon: Briefcase },
                  { id: "memory", label: "Memory", icon: History },
                  { id: "reflect", label: "Reflect", icon: Bell },
                  { id: "time-focus", label: "Time and focus", icon: Moon },
                  { id: "elixora-api", label: "Elixora API", icon: Code2 },
                ]
                  .filter((item) =>
                    item.label.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                          isActive
                            ? "bg-white/10 text-[var(--ink)] shadow-xs"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Section: Customize */}
            <div>
              <div className="px-2 pb-1 text-[11px] font-medium text-[var(--ink-muted)]">
                Customize
              </div>
              <div className="space-y-0.5">
                {[
                  { id: "skills", label: "Skills", icon: FileCode },
                  { id: "connectors", label: "Connectors", icon: Share2 },
                  { id: "plugins", label: "Plugins", icon: Sparkles },
                ]
                  .filter((item) =>
                    item.label.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                          isActive
                            ? "bg-white/10 text-[var(--ink)] shadow-xs"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Content Panel ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[var(--surface)] text-sm">
          {activeTab === "general" && (
            <div className="space-y-8 animate-fade-in max-w-2xl">
              {/* Appearance Section */}
              <div className="space-y-5">
                <h3 className="text-base font-medium tracking-tight text-[var(--ink)]">
                  Appearance
                </h3>

                {/* Theme Setting */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs sm:text-sm text-[var(--ink)]">Theme</span>
                  {/* Segmented [ Monitor | Sun | Moon ] button pill matching Claude */}
                  <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode("system");
                        saveSetting("themeMode", "system");
                      }}
                      className={`p-1.5 rounded-md transition-all ${
                        themeMode === "system"
                          ? "bg-white/15 text-[var(--ink)] shadow-xs"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      }`}
                      title="System Theme"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode("light");
                        saveSetting("themeMode", "light");
                      }}
                      className={`p-1.5 rounded-md transition-all ${
                        themeMode === "light"
                          ? "bg-white/15 text-[var(--ink)] shadow-xs"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      }`}
                      title="Light Mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeMode("dark");
                        saveSetting("themeMode", "dark");
                      }}
                      className={`p-1.5 rounded-md transition-all ${
                        themeMode === "dark"
                          ? "bg-white/15 text-[var(--ink)] shadow-xs"
                          : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      }`}
                      title="Dark Mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chat Font Setting */}
                <div className="flex items-center justify-between py-1 relative">
                  <span className="text-xs sm:text-sm text-[var(--ink)]">Chat font</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setFontMenuOpen(!fontMenuOpen)}
                      className="flex items-center gap-1.5 text-xs text-[var(--ink)] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                    >
                      <span>{chatFont}</span>
                      <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]" />
                    </button>

                    {fontMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setFontMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-40 text-xs animate-fade-in space-y-0.5">
                          {fontOptions.map((f) => (
                            <button
                              key={f.label}
                              type="button"
                              onClick={() => {
                                setChatFont(f.label);
                                saveSetting("chatFont", f.label);
                                setFontMenuOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                                chatFont === f.label
                                  ? "bg-white/10 text-[var(--ink)] font-medium"
                                  : "text-[var(--ink-muted)] hover:bg-white/5 hover:text-[var(--ink)]"
                              }`}
                            >
                              <span>{f.label}</span>
                              {chatFont === f.label && (
                                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Transcript Width Setting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-2">
                  <div>
                    <span className="text-xs sm:text-sm text-[var(--ink)]">Transcript width</span>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Maximum width of the transcript and composer columns.
                    </p>
                  </div>
                  {/* Segmented [ Narrow | Medium | Wide ] pill matching Claude */}
                  <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5 self-start sm:self-auto">
                    {(["narrow", "medium", "wide"] as const).map((width) => (
                      <button
                        key={width}
                        type="button"
                        onClick={() => {
                          setTranscriptWidth(width);
                          saveSetting("transcriptWidth", width);
                        }}
                        className={`px-3 py-1 text-xs capitalize rounded-md transition-all ${
                          transcriptWidth === width
                            ? "bg-white/15 text-[var(--ink)] shadow-xs font-medium"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {width}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion Setting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-2">
                  <div>
                    <span className="text-xs sm:text-sm text-[var(--ink)]">Motion</span>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Reduce animation in streaming responses and other interface elements.
                    </p>
                  </div>
                  {/* Segmented [ System | Reduced ] pill matching Claude */}
                  <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5 self-start sm:self-auto">
                    {(["system", "reduced"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setMotionSetting(mode);
                          saveSetting("motionSetting", mode);
                        }}
                        className={`px-3 py-1 text-xs capitalize rounded-md transition-all ${
                          motionSetting === mode
                            ? "bg-white/15 text-[var(--ink)] shadow-xs font-medium"
                            : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Voice Section */}
              <div className="space-y-5 pt-4 border-t border-[var(--border)]">
                <h3 className="text-base font-medium tracking-tight text-[var(--ink)]">
                  Voice
                </h3>

                {/* Language Setting */}
                <div className="flex items-center justify-between py-1 relative">
                  <span className="text-xs sm:text-sm text-[var(--ink)]">Language</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLangMenuOpen(!langMenuOpen)}
                      className="flex items-center gap-1.5 text-xs text-[var(--ink)] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                    >
                      <span>{voiceLang}</span>
                      <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]" />
                    </button>

                    {langMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setLangMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-40 text-xs animate-fade-in space-y-0.5">
                          {languageOptions.map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                setVoiceLang(lang);
                                saveSetting("voiceLang", lang);
                                setLangMenuOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                                voiceLang === lang
                                  ? "bg-white/10 text-[var(--ink)] font-medium"
                                  : "text-[var(--ink-muted)] hover:bg-white/5 hover:text-[var(--ink)]"
                              }`}
                            >
                              <span>{lang}</span>
                              {voiceLang === lang && (
                                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Voice Style Setting */}
                <div className="flex items-center justify-between py-1 relative">
                  <span className="text-xs sm:text-sm text-[var(--ink)]">Style</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStyleMenuOpen(!styleMenuOpen)}
                      className="flex items-center gap-1.5 text-xs text-[var(--ink)] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                    >
                      <span>{voiceStyle}</span>
                      <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]" />
                    </button>

                    {styleMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setStyleMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-40 text-xs animate-fade-in space-y-0.5">
                          {styleOptions.map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setVoiceStyle(st);
                                saveSetting("voiceStyle", st);
                                setStyleMenuOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                                voiceStyle === st
                                  ? "bg-white/10 text-[var(--ink)] font-medium"
                                  : "text-[var(--ink-muted)] hover:bg-white/5 hover:text-[var(--ink)]"
                              }`}
                            >
                              <span>{st}</span>
                              {voiceStyle === st && (
                                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Voice Speed Setting */}
                <div className="flex items-center justify-between py-1 relative">
                  <span className="text-xs sm:text-sm text-[var(--ink)]">Speed</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                      className="flex items-center gap-1.5 text-xs text-[var(--ink)] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                    >
                      <span>{voiceSpeed}</span>
                      <ChevronDown className="w-3 h-3 text-[var(--ink-muted)]" />
                    </button>

                    {speedMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setSpeedMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-1 w-36 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1 z-40 text-xs animate-fade-in space-y-0.5">
                          {speedOptions.map((sp) => (
                            <button
                              key={sp}
                              type="button"
                              onClick={() => {
                                setVoiceSpeed(sp);
                                saveSetting("voiceSpeed", sp);
                                setSpeedMenuOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                                voiceSpeed === sp
                                  ? "bg-white/10 text-[var(--ink)] font-medium"
                                  : "text-[var(--ink-muted)] hover:bg-white/5 hover:text-[var(--ink)]"
                              }`}
                            >
                              <span>{sp}</span>
                              {voiceSpeed === sp && (
                                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6 animate-fade-in max-w-xl">
              <h3 className="text-base font-medium tracking-tight text-[var(--ink)]">
                Account Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-[var(--border)]">
                  <div className="w-10 h-10 rounded-full bg-blue-600/30 text-blue-300 border border-blue-400/20 flex items-center justify-center font-semibold text-sm">
                    {(user?.name || "Abhi").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--ink)]">{user?.name || "Abhi"}</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">{user?.email || "user@elixora.health"}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/complete-profile");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[var(--ink)] transition-colors border border-[var(--border)]"
                  >
                    <span>Update Clinical & Emergency Profile</span>
                    <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium text-rose-400">Sign out of session</p>
                    <p className="text-[11px] text-[var(--ink-muted)]">Securely end this authenticated consultation</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                      router.push("/login");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6 animate-fade-in max-w-xl">
              <h3 className="text-base font-medium tracking-tight text-[var(--ink)]">
                Privacy & Data Security
              </h3>
              <div className="space-y-4 text-xs text-[var(--ink-muted)]">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-emerald-300">HIPAA Safeguards Active</p>
                    <p className="text-[11px] text-emerald-400/80 mt-0.5">
                      Uploaded patient health documents and biomarker reports are processed with zero-retention encryption.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                  <span>Client-Side Data Storage</span>
                  <span className="text-[11px] text-emerald-400 font-mono">Encrypted</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                  <span>Diagnostic Analytics Sharing</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">Disabled</span>
                </div>
              </div>
            </div>
          )}


          {/* Capabilities, Skills & Connectors Tabs */}
          {(activeTab === "capabilities" || activeTab === "skills" || activeTab === "connectors" || activeTab === "plugins") && (
            <div className="space-y-6 animate-fade-in max-w-xl">
              <h3 className="text-base font-medium tracking-tight text-[var(--ink)] capitalize">
                {activeTab}
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Configure integrated healthcare skills, automated diagnostic tools, and external lab connectors.
              </p>
              <div className="space-y-2">
                {[
                  { name: "Blood Biomarker Range Normalizer", status: "Enabled", type: "Clinical Skill" },
                  { name: "Medication Cross-Interaction Scanner", status: "Active", type: "Safety Rule" },
                  { name: "Emergency Red-Flag Vital Triage", status: "Always On", type: "Protocol" },
                  { name: "FHIR Electronic Health Records Connector", status: "Available", type: "Integration" },
                ].map((sk) => (
                  <div key={sk.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-[var(--border)] text-xs">
                    <div>
                      <p className="font-medium text-[var(--ink)]">{sk.name}</p>
                      <p className="text-[10px] text-[var(--ink-muted)]">{sk.type}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {sk.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {["memory", "reflect", "time-focus", "elixora-api"].includes(activeTab) && (
            <div className="space-y-4 animate-fade-in max-w-xl">
              <h3 className="text-base font-medium tracking-tight text-[var(--ink)] capitalize">
                {activeTab.replace("-", " ")}
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Customize clinical memory retention and developer API access tokens for Elixora services.
              </p>
              <div className="p-4 rounded-xl bg-white/5 border border-[var(--border)] text-xs text-[var(--ink-muted)]">
                Feature settings synchronized with current account workspace.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
