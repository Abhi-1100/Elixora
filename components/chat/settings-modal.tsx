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
  HeartHandshake,
  Plus,
  Pencil,
  Phone,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { addContact, deleteContact, getContacts, updateContact } from "@/lib/api";

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone?: string | null;
  email?: string | null;
  is_primary?: boolean;
  notify_email?: boolean;
  notify_sms?: boolean;
}

interface ContactDraft {
  name: string;
  relation: string;
  phone: string;
  email: string;
  is_primary: boolean;
  notify_email: boolean;
  notify_sms: boolean;
}

const EMPTY_CONTACT: ContactDraft = {
  name: "",
  relation: "Family",
  phone: "",
  email: "",
  is_primary: false,
  notify_email: true,
  notify_sms: true,
};

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

export function SettingsModal({ isOpen, onClose, initialTab = "general" }: SettingsModalProps) {
  const { user, token, logout } = useAuth() as { user: any; token: string | null; logout: () => void };
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

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState("");
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(EMPTY_CONTACT);

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

  useEffect(() => {
    if (!isOpen || activeTab !== "contacts" || !token) return;
    let mounted = true;
    setContactsLoading(true);
    setContactError("");
    getContacts(token)
      .then((data) => {
        if (mounted) setContacts(data.contacts || []);
      })
      .catch((error) => {
        if (mounted) setContactError(error instanceof Error ? error.message : "Unable to load emergency contacts.");
      })
      .finally(() => {
        if (mounted) setContactsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeTab, isOpen, token]);

  const updateContactDraft = (key: keyof ContactDraft, value: string | boolean) => {
    setContactDraft((current) => ({ ...current, [key]: value }));
  };

  const resetContactForm = () => {
    setEditingContactId(null);
    setContactDraft(EMPTY_CONTACT);
    setContactError("");
  };

  const saveContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setContactSaving(true);
    setContactError("");
    try {
      const result = editingContactId
        ? await updateContact(editingContactId, contactDraft, token)
        : await addContact(contactDraft, token);
      const saved = result.contact as EmergencyContact;
      setContacts((current) => editingContactId
        ? current.map((contact) => contact.id === saved.id ? saved : contact)
        : [...current, saved]);
      resetContactForm();
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to save this contact.");
    } finally {
      setContactSaving(false);
    }
  };

  const editContact = (contact: EmergencyContact) => {
    setEditingContactId(contact.id);
    setContactDraft({
      name: contact.name,
      relation: contact.relation || "Family",
      phone: contact.phone || "",
      email: contact.email || "",
      is_primary: Boolean(contact.is_primary),
      notify_email: contact.notify_email !== false,
      notify_sms: contact.notify_sms !== false,
    });
    setContactError("");
  };

  const removeContact = async (id: string) => {
    if (!token || !window.confirm("Remove this emergency contact?")) return;
    try {
      await deleteContact(id, token);
      setContacts((current) => current.filter((contact) => contact.id !== id));
      if (editingContactId === id) resetContactForm();
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Unable to remove this contact.");
    }
  };

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
                  { id: "contacts", label: "Emergency contacts", icon: HeartHandshake },
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

          {/* Emergency Contacts Tab */}
          {activeTab === "contacts" && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div>
                <h3 className="flex items-center gap-2 text-base font-medium tracking-tight text-[var(--ink)]">
                  <HeartHandshake className="h-4 w-4 text-[var(--accent)]" />
                  Emergency contacts
                </h3>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  Add family members or trusted people who should receive your SOS alerts.
                </p>
              </div>

              {contactError && (
                <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-200" role="alert">
                  {contactError}
                </div>
              )}

              <form onSubmit={saveContact} className="space-y-4 rounded-xl border border-[var(--border)] bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[var(--ink)]">
                    {editingContactId ? "Edit contact" : "Add a contact"}
                  </h4>
                  <span className="text-[10px] text-[var(--ink-muted)]">Up to 5 contacts</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-medium text-[var(--ink-muted)]">Name</span>
                    <input
                      required
                      value={contactDraft.name}
                      onChange={(event) => updateContactDraft("name", event.target.value)}
                      placeholder="Family member name"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-medium text-[var(--ink-muted)]">Relation</span>
                    <input
                      required
                      value={contactDraft.relation}
                      onChange={(event) => updateContactDraft("relation", event.target.value)}
                      placeholder="Parent, spouse, sibling..."
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-muted)]"><Phone className="h-3 w-3" />Mobile number</span>
                    <input
                      type="tel"
                      value={contactDraft.phone}
                      onChange={(event) => updateContactDraft("phone", event.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-muted)]"><Mail className="h-3 w-3" />Email address</span>
                    <input
                      type="email"
                      value={contactDraft.email}
                      onChange={(event) => updateContactDraft("email", event.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--ink-muted)]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={contactDraft.is_primary} onChange={(event) => updateContactDraft("is_primary", event.target.checked)} className="accent-[var(--accent)]" />
                    Primary contact
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={contactDraft.notify_email} onChange={(event) => updateContactDraft("notify_email", event.target.checked)} className="accent-[var(--accent)]" />
                    Email alerts
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={contactDraft.notify_sms} onChange={(event) => updateContactDraft("notify_sms", event.target.checked)} className="accent-[var(--accent)]" />
                    SMS alerts
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button type="submit" disabled={contactSaving || (!editingContactId && contacts.length >= 5)} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#111114] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                    {editingContactId ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {contactSaving ? "Saving..." : editingContactId ? "Update contact" : "Add contact"}
                  </button>
                  {editingContactId && (
                    <button type="button" onClick={resetContactForm} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--ink-muted)] hover:bg-white/10">Cancel</button>
                  )}
                </div>
              </form>

              <div className="space-y-2">
                {contactsLoading ? (
                  <p className="text-xs text-[var(--ink-muted)]">Loading emergency contacts...</p>
                ) : contacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--ink-muted)]">
                    No emergency contacts saved yet. Add someone you trust so SOS can reach them.
                  </div>
                ) : contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white/5 p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-semibold text-[var(--ink)]">{contact.name}</p>
                        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--accent)]">{contact.relation}</span>
                        {contact.is_primary && <span className="text-[10px] text-emerald-300">Primary</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--ink-muted)]">
                        {contact.phone && <span>{contact.phone}</span>}
                        {contact.email && <span className="truncate">{contact.email}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => editContact(contact)} className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-white/10 hover:text-[var(--accent)]" title="Edit contact"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => void removeContact(contact.id)} className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-red-500/10 hover:text-red-300" title="Remove contact"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
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
