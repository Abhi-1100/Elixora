"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Mic,
  Activity,
  Check,
  X,
} from "lucide-react";

export interface Conversation {
  id: string;
  title: string;
  date: string;
  category: "Today" | "Yesterday" | "Previous 7 Days";
  isPinned?: boolean;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenVoiceMode: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenVoiceMode,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: ("Today" | "Yesterday" | "Previous 7 Days")[] = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
  ];

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

  return (
    <aside
      className={`h-screen bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-300 flex flex-col z-30 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Header & New Chat Button */}
      <div className="p-3 border-b border-[var(--border)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-1">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-semibold text-xs">
                <Activity className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-[var(--ink)]">
                Elixora
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--ink-muted)]">
                AI Health
              </span>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-muted)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors mx-auto"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* New Conversation Button */}
        <button
          onClick={onNewConversation}
          className={`flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all py-2.5 px-3 font-medium text-xs shadow-sm ${
            isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full"
          }`}
          title="New Health Query"
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Query</span>}
        </button>

        {/* Quick Voice Mode Button */}
        <button
          onClick={onOpenVoiceMode}
          className={`flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] text-[var(--ink)] hover:text-[var(--accent)] transition-all py-2 px-3 text-xs font-medium ${
            isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full"
          }`}
          title="Launch Voice Mode"
        >
          <Mic className="w-3.5 h-3.5 text-[var(--accent)]" />
          {!isCollapsed && <span>Voice Assistant</span>}
        </button>
      </div>

      {/* Search Input (Expanded only) */}
      {!isCollapsed && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-muted)] text-[var(--ink)] text-xs rounded-lg pl-8 pr-3 py-1.5 border border-transparent focus:border-[var(--accent)] focus:outline-none transition-all placeholder-[var(--ink-muted)]"
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {isCollapsed ? (
          /* Collapsed Icon Rail View */
          <div className="flex flex-col gap-1.5 items-center">
            {conversations.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`p-2.5 rounded-xl transition-all relative group ${
                  activeConversationId === c.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                }`}
                title={c.title}
              >
                <MessageSquare className="w-4 h-4" />
                {/* Tooltip on hover */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[var(--ink)] text-white text-xs px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {c.title}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Expanded Categorized View */
          categories.map((category) => {
            const categoryItems = filteredConversations.filter(
              (c) => c.category === category
            );

            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                <div className="px-2 text-[10px] font-medium tracking-wider uppercase text-[var(--ink-muted)]">
                  {category}
                </div>
                {categoryItems.map((c) => {
                  const isActive = activeConversationId === c.id;
                  const isEditing = editingId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectConversation(c.id)}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                        isActive
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                          : "text-[var(--ink)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        {isEditing ? (
                          <form
                            onSubmit={(e) => handleSaveRename(c.id, e)}
                            className="flex items-center gap-1 w-full"
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="w-full bg-[var(--surface)] text-[var(--ink)] px-1.5 py-0.5 text-xs rounded border border-[var(--accent)] focus:outline-none"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              type="button"
                              onClick={(e) => handleSaveRename(c.id, e)}
                              className="p-0.5 hover:text-green-600"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              className="p-0.5 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </form>
                        ) : (
                          <span className="truncate">{c.title}</span>
                        )}
                      </div>

                      {/* Hover Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleStartRename(c, e)}
                            className="p-1 hover:bg-[var(--surface)] rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(c.id);
                            }}
                            className="p-1 hover:bg-[var(--surface)] rounded text-[var(--ink-muted)] hover:text-red-500"
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
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[var(--border)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HIPAA Safeguards Active</span>
          </span>
          <Sparkles className="w-3 h-3 text-[var(--accent)]" />
        </div>
      )}
    </aside>
  );
}
