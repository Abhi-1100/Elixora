"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type User } from "@/context/AuthContext";
import { LogOut, ChevronDown, LayoutDashboard, MessageSquare } from "lucide-react";

interface NavbarProps {
  showNavLinks?: boolean;
}

export function Navbar({ showNavLinks = true }: NavbarProps) {
  const { user, logout } = useAuth() as { user: User | null; logout: () => void };
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    logout();
    setDropdownOpen(false);
    router.push("/login");
  }

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
    <header className="sticky top-0 z-50 w-full bg-[#050507]/90 backdrop-blur-md transition-colors duration-200 border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand logo left matching screenshot: /Elixora. */}
        <Link href="/" className="flex items-center gap-1.5 group select-none">
          <span className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
            /Elixora.
          </span>
        </Link>

        {/* Center Nav Links matching screenshot: Product, Services, About us, Research */}
        {showNavLinks && (
          <nav className="hidden md:flex items-center gap-10 text-xs sm:text-sm font-normal text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About us
            </a>
            <a href="#research" className="hover:text-white transition-colors">
              Research
            </a>
          </nav>
        )}

        {/* Right Action: White Pill CTA 'Get started' matching screenshot */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="btn-pill-secondary py-2 px-4 text-xs flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {initials}
                </span>
                <span className="hidden sm:inline text-white font-medium">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 glass-panel p-2 shadow-2xl z-50 space-y-1 bg-[#0A0E1A] border border-white/10">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:bg-white/5 rounded-xl"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      Dashboard
                    </Link>
                    <Link
                      href="/chat"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:bg-white/5 rounded-xl"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      Launch Assistant
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/chat"
              className="rounded-full bg-white text-black text-xs sm:text-sm font-medium px-5 py-2 hover:bg-zinc-200 transition-all shadow-sm"
            >
              Get started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}


