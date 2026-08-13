"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BreathOrb } from "@/components/ui/breath-orb";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, LogOut, ChevronDown, LayoutDashboard, MessageSquare } from "lucide-react";

interface NavbarProps {
  /** Show the centered nav links (Features, How it Works, etc.) */
  showNavLinks?: boolean;
}

export function Navbar({ showNavLinks = false }: NavbarProps) {
  const { user, logout } = useAuth() as { user: any; logout: () => void };
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    router.push("/login");
  }

  // Derive initials from name (up to 2 chars)
  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between transition-colors duration-200">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <BreathOrb size="sm" mode="idle" />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg tracking-tight text-[var(--ink)]">
            Elixora
          </span>
          <span className="hidden sm:inline text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold">
            AI Healthcare Assistant
          </span>
        </div>
      </Link>

      {/* Center Nav Links (optional) */}
      {showNavLinks && (
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--ink-muted)]">
          <a href="#features" className="hover:text-[var(--accent)] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[var(--accent)] transition-colors">
            How it Works
          </a>
          <a href="#security" className="hover:text-[var(--accent)] transition-colors">
            HIPAA Security
          </a>
          <a href="#pricing" className="hover:text-[var(--accent)] transition-colors">
            Pricing
          </a>
        </nav>
      )}

      {/* Right-side Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {user ? (
          /* ── Logged-in state ── */
          <div className="relative">
            <button
              id="user-menu-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--surface-muted)] transition-colors text-sm font-medium text-[var(--ink)] border border-[var(--border)]"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {/* Avatar circle with initials */}
              <span className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </span>
              <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--ink-muted)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div
                  id="user-dropdown"
                  className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in"
                >
                  {/* User info row */}
                  <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]/50">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">{user.name}</p>
                    <p className="text-xs text-[var(--ink-muted)] truncate">{user.email}</p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-muted)] rounded-xl transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[var(--accent)]" />
                      Dashboard
                    </Link>

                    <Link
                      href="/chat"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-muted)] rounded-xl transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                      Launch Assistant
                    </Link>
                  </div>

                  <div className="border-t border-[var(--border)] p-1">
                    <button
                      id="logout-btn"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out / Switch Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Logged-out state ── */
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              id="nav-login-btn"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors border border-transparent hover:border-[var(--border)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              id="nav-signup-btn"
              className="text-xs font-semibold px-4 py-2 rounded-full bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Sign up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
