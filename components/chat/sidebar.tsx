"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SquarePen,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Pin,
  PanelLeft,
  PanelLeftClose,
  X,
  Check,
  User as UserIcon,
  LogOut,
  Settings,
  Activity,
  Mic,
  Plus,
  Folder,
  Layers,
  SlidersHorizontal,
  Download,
  ChevronRight,
  ChevronDown,
  ListFilter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export interface Conversation {
  id: string;
  title: string;
  date: string;
  category: "Today" | "Yesterday" | "Previous 7 Days";
  isPinned?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapse: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenVoiceMode: () => void;
  onOpenSettings?: (tab?: string) => void;
}

export function Sidebar({
  isCollapsed,
  isMobileOpen = false,
  onCloseMobile,
  onToggleCollapse,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenVoiceMode,
  onOpenSettings,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const { user, logout } = useAuth() as { user: any; logout: () => void };
  const router = useRouter();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute display name & user initials
  const displayName = user?.name ? user.name.split(" ")[0].toLowerCase() : "abhi";
  const userInitial = (user?.name || "abhi").charAt(0).toUpperCase();

  const getUserInitials = () => {
    if (!user?.name) return "AK";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase() || "AK";
  };

  const userInitials = getUserInitials();

  // Listen for Ctrl+K / Cmd+K to toggle search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  const pinnedConversations = conversations.filter((c) => c.isPinned);
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleExportChats = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(conversations, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `elixora-chats-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <aside
      className={`h-screen bg-black border-r border-white/10 transition-all duration-300 flex flex-col z-40 select-none fixed inset-y-0 left-0 sm:static sm:translate-x-0 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
      } ${isCollapsed ? "w-14" : "w-64"}`}
    >
      {/* ──────────────────────────────────────────────────────────────────────────
          1. COLLAPSED ICON RAIL MODE (Image 1)
          - Popups appear ONLY on cursor hover (not permanent!)
          ────────────────────────────────────────────────────────────────────────── */}
      {isCollapsed ? (
        <div className="flex flex-col h-full items-center py-3 justify-between relative bg-black">
          {/* Top Actions Rail */}
          <div className="flex flex-col items-center gap-4 w-full">
            {/* 1. Panel Toggle Icon */}
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Expand sidebar"
              >
                <PanelLeft className="w-5 h-5 stroke-[1.75]" />
              </button>
              {/* Tooltip on hover only */}
              <div className="absolute left-12 ml-2 px-2.5 py-1 rounded-md bg-[#1F2128] border border-white/10 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                Expand sidebar
              </div>
            </div>

            {/* 2. New Chat / Compose Icon */}
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={onNewConversation}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="New chat"
              >
                <SquarePen className="w-5 h-5 stroke-[1.75]" />
              </button>
              {/* Tooltip on hover only */}
              <div className="absolute left-12 ml-2 px-2.5 py-1 rounded-md bg-[#1F2128] border border-white/10 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                New chat
              </div>
            </div>

            {/* 3. Search Icon with 'Search Ctrl + K' Pill on HOVER */}
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Search (Ctrl + K)"
              >
                <Search className="w-5 h-5 stroke-[1.75]" />
              </button>

              {/* 'Search Ctrl + K' pill - ONLY SHOWN ON HOVER matching Image 1 */}
              <div
                onClick={() => setIsSearchModalOpen(true)}
                className="absolute left-12 ml-2 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F2128] border border-white/10 text-white text-xs font-medium cursor-pointer shadow-xl whitespace-nowrap hover:bg-[#282B34] transition-all opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50"
              >
                <span className="font-semibold text-xs">Search</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-zinc-400 font-mono">
                  Ctrl + K
                </span>
              </div>
            </div>

            {/* 4. Pin Icon */}
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setIsPinnedOpen(!isPinnedOpen);
                  setIsHistoryOpen(false);
                  setIsSearchModalOpen(false);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isPinnedOpen
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
                title="Pinned queries"
              >
                <Pin className="w-5 h-5 stroke-[1.75]" />
              </button>
              {/* Tooltip on hover when not open */}
              {!isPinnedOpen && (
                <div className="absolute left-12 ml-2 px-2.5 py-1 rounded-md bg-[#1F2128] border border-white/10 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  Pinned queries
                </div>
              )}

              {/* ── Pinned queries popup on click ── */}
              {isPinnedOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPinnedOpen(false)}
                  />
                  <div className="absolute left-14 top-0 ml-2 w-64 sm:w-72 bg-[#202227] border border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 text-white animate-fade-in">
                    <div className="flex items-center justify-between px-2 pt-1 pb-2">
                      <span className="text-xs font-semibold text-zinc-400 tracking-tight">
                        Pinned Queries
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPinnedOpen(false)}
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-0.5 pr-0.5">
                      {pinnedConversations.length === 0 ? (
                        <p className="text-xs text-zinc-400 px-2 py-3 italic">
                          No pinned conversations
                        </p>
                      ) : (
                        pinnedConversations.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              onSelectConversation(c.id);
                              setIsPinnedOpen(false);
                            }}
                            className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[13px] cursor-pointer transition-all ${
                              activeConversationId === c.id
                                ? "bg-white/15 text-white font-medium"
                                : "text-zinc-300 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <span className="truncate">{c.title}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 5. Chat Bubble Icon (Click opens history chat list, click any chat to open) */}
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(!isHistoryOpen);
                  setIsPinnedOpen(false);
                  setIsSearchModalOpen(false);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isHistoryOpen
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
                title="History"
              >
                <MessageSquare className="w-5 h-5 stroke-[1.75]" />
              </button>

              {/* Tooltip on hover when not open */}
              {!isHistoryOpen && (
                <div className="absolute left-12 ml-2 px-2.5 py-1 rounded-md bg-[#1F2128] border border-white/10 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  History
                </div>
              )}

              {/* ── History chat list popup on click ── */}
              {isHistoryOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsHistoryOpen(false)}
                  />
                  <div className="absolute left-14 top-0 ml-2 w-64 sm:w-72 bg-[#202227] border border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 text-white animate-fade-in">
                    <div className="flex items-center justify-between px-2 pt-1 pb-2">
                      <span className="text-xs font-semibold text-zinc-400 tracking-tight">
                        Recents
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsHistoryOpen(false)}
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-0.5 pr-0.5">
                      {filteredConversations.length === 0 ? (
                        <p className="text-xs text-zinc-400 px-2 py-3 italic">
                          No recent conversations
                        </p>
                      ) : (
                        filteredConversations.map((c) => {
                          const isActive = activeConversationId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                onSelectConversation(c.id);
                                setIsHistoryOpen(false);
                              }}
                              className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[13px] cursor-pointer transition-all ${
                                isActive
                                  ? "bg-white/15 text-white font-medium"
                                  : "text-zinc-300 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              <span className="truncate">{c.title}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search Palette Dialog (when clicked or Ctrl+K) */}
          {isSearchModalOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/60"
                onClick={() => setIsSearchModalOpen(false)}
              />
              <div className="absolute left-14 top-16 ml-2 w-80 bg-[#202227] border border-white/10 rounded-2xl shadow-2xl p-3 z-50 text-white animate-fade-in">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 text-white text-xs rounded-lg pl-8 pr-7 py-2 border border-white/10 focus:border-blue-500 focus:outline-none placeholder-zinc-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {filteredConversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectConversation(c.id);
                        setIsSearchModalOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/10 truncate block"
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bottom Avatar with 'AK' matching Image 1 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-[#10B981] hover:brightness-110 active:scale-95 text-black font-semibold text-xs flex items-center justify-center transition-transform shadow-md"
              title="User Profile & Settings"
            >
              {userInitials}
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute bottom-10 left-12 ml-2 w-56 bg-[#202227] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs text-white animate-fade-in space-y-1">
                  <div className="px-2.5 py-1.5 border-b border-white/10">
                    <p className="font-semibold text-white truncate">
                      {user?.name || "Abhishek"}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {user?.email || "user@elixora.health"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onOpenSettings) onOpenSettings("account");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenVoiceMode();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Assistant</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      router.push("/login");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ──────────────────────────────────────────────────────────────────────────
            2. EXPANDED SIDEBAR MODE (Image 2)
            - Exact layout from Image 2:
              * Elixora project name
              * "+ New" pill button
              * Projects, Artifacts, Code, Customize
              * Pinned >
              * Chats and tasks
              * Circular outline bullets
              * Bottom profile pill: avatar, abhi · Free, dropdown, download, search
            ────────────────────────────────────────────────────────────────────────── */
        <div className="flex flex-col h-full bg-[#141416] text-[var(--ink)] select-none">
          {/* Header Row: Panel toggle & Brand Name 'Elixora' */}
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1 rounded-md text-[var(--ink-muted)] hover:text-white hover:bg-white/10 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeft className="w-4 h-4 stroke-[1.75]" />
              </button>
              <span className="text-lg tracking-tight font-medium text-white">
                Elixora
              </span>
            </div>

            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onToggleCollapse();
              }}
              className="p-1 rounded-md text-[var(--ink-muted)] hover:text-white hover:bg-white/10 transition-colors sm:hidden"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* "+ New" Pill Button matching Image 2 */}
          <div className="px-3 py-1.5">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#232428] hover:bg-[#2C2E35] active:scale-[0.99] text-white transition-all py-2.5 px-3 text-xs font-medium"
              title="New Health Query"
            >
              <Plus className="w-4 h-4 shrink-0 text-white" />
              <span className="font-medium text-xs">New</span>
            </button>
          </div>

          {/* Navigation Links: Projects, Artifacts, Code, Customize matching Image 2 */}
          <div className="px-3 py-1 space-y-0.5 text-xs text-zinc-300">
            <button
              onClick={() => router.push("/reports")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors text-left"
            >
              <Folder className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => router.push("/reports")}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors text-left"
            >
              <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>Artifacts</span>
            </button>


            <button
              onClick={() => {
                if (onOpenSettings) onOpenSettings("general");
                else router.push("/settings");
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-colors text-left"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>Customize</span>
            </button>
          </div>

          {/* "Pinned >" Accordion */}
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPinnedOpen(!isPinnedOpen)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-md transition-colors w-full text-left"
            >
              <span>Pinned</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isPinnedOpen ? "rotate-90" : ""
                }`}
              />
              {pinnedConversations.length > 0 && (
                <span className="text-[10px] ml-auto text-zinc-500">
                  {pinnedConversations.length}
                </span>
              )}
            </button>

            {isPinnedOpen && (
              <div className="mt-1 pl-2 space-y-0.5 animate-fade-in">
                {pinnedConversations.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 px-2 py-1 italic">
                    No pinned chats
                  </p>
                ) : (
                  pinnedConversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectConversation(c.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs text-left truncate transition-colors ${
                        activeConversationId === c.id
                          ? "bg-white/10 text-white font-medium"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Pin className="w-2.5 h-2.5 shrink-0 text-blue-400" />
                      <span className="truncate">{c.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* "Chats and tasks" Header with Filter Icon matching Image 2 */}
          <div className="px-4 pt-4 pb-1.5 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-normal text-[11px] tracking-tight">Chats and tasks</span>
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="p-1 rounded hover:bg-white/10 hover:text-white text-zinc-400 transition-colors"
              title="Filter or search chats"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Conversation List with Outline Circle Bullets matching Image 2 */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {filteredConversations.map((c) => {
              const isActive = activeConversationId === c.id;
              const isEditing = editingId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                    isActive
                      ? "bg-white/10 text-white font-medium"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {/* Outline bullet circle matching Image 2 */}
                    <span className="w-1.5 h-1.5 rounded-full border border-zinc-500 shrink-0 opacity-70 group-hover:opacity-100" />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(c.id, e)}
                        className="flex items-center gap-1 w-full"
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="w-full bg-[#18181A] text-white px-1.5 py-0.5 text-xs rounded border border-blue-500 focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(c.id, e)}
                          className="p-0.5 hover:text-green-400"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="p-0.5 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate text-xs">{c.title}</span>
                    )}
                  </div>

                  {/* Hover Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(c, e)}
                        className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(c.id);
                        }}
                        className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Bottom Profile Pill matching Image 2 ── */}
          <div className="p-2 border-t border-white/10 relative bg-[#141416]">
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute bottom-14 left-2 right-2 bg-[#202227] border border-white/10 rounded-xl shadow-2xl p-2 z-50 text-xs animate-fade-in space-y-1">
                  <div className="px-2.5 py-1.5 border-b border-white/10">
                    <p className="font-medium text-white truncate">
                      {user?.name || "Abhi"}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {user?.email || "user@elixora.health"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onOpenSettings) onOpenSettings("account");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenVoiceMode();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Assistant</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      router.push("/login");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}

            <div className="flex items-center justify-between gap-1.5">
              {/* Profile pill button with blue focus outline matching Image 2 */}
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-blue-500/60 bg-[#1A1C22] hover:bg-[#22242B] transition-colors text-left min-w-0 flex-1 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {userInitial}
                </div>

                <span className="text-xs text-white font-normal truncate">
                  {displayName} <span className="text-zinc-400">· Free</span>
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto shrink-0" />
              </button>

              {/* Download & Search icons on right matching Image 2 */}
              <div className="flex items-center gap-0.5 shrink-0 text-zinc-400">
                <button
                  type="button"
                  onClick={handleExportChats}
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  title="Download / Export Conversations"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                  title="Search Chats"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
