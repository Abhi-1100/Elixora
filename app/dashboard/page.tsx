"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/navbar";
import Link from "next/link";
import {
  User,
  Mail,
  Calendar,
  Activity,
  ArrowRight,
  Mic,
  FileSpreadsheet,
  Pill,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth() as { user: any; loading: boolean };
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8 animate-fade-in">
          <div className="h-32 skeleton-shimmer rounded-3xl w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-20 skeleton-shimmer rounded-2xl" />
            <div className="h-20 skeleton-shimmer rounded-2xl" />
            <div className="h-20 skeleton-shimmer rounded-2xl" />
          </div>
          <div className="space-y-4">
            <div className="h-5 skeleton-shimmer rounded-lg w-36" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-24 skeleton-shimmer rounded-2xl" />
              <div className="h-24 skeleton-shimmer rounded-2xl" />
              <div className="h-24 skeleton-shimmer rounded-2xl" />
              <div className="h-24 skeleton-shimmer rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const quickActions = [
    {
      icon: <Mic className="w-5 h-5" />,
      label: "Voice Assistant",
      desc: "Start a hands-free health conversation",
      href: "/chat",
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5" />,
      label: "Analyze Lab Report",
      desc: "Upload a PDF or image for OCR analysis",
      href: "/chat",
    },
    {
      icon: <Pill className="w-5 h-5" />,
      label: "Medication Guide",
      desc: "Look up dosage, interactions & side effects",
      href: "/chat",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Symptom Checker",
      desc: "Describe symptoms and get structured insights",
      href: "/chat",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8 animate-fade-in">
        {/* Welcome header */}
        <div className="relative p-7 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-bl from-[var(--glow-a)] to-[var(--glow-b)] opacity-15 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] text-white text-xl font-bold flex items-center justify-center shadow-xs shrink-0">
                {initials}
              </div>

              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-[var(--ink)] truncate">
                  Welcome back, {user.name ? user.name.split(" ")[0] : "User"}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-0.5">
                  Your AI health assistant is ready.
                </p>
              </div>
            </div>

            <Link
              href="/chat"
              id="launch-assistant-btn"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-xs shrink-0 focus-ring"
            >
              Launch Assistant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Profile summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider font-mono">Email</p>
              <p className="text-xs sm:text-sm font-medium text-[var(--ink)] truncate">{user.email}</p>
            </div>
          </div>

          {user.age && (
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider font-mono">Age</p>
                <p className="text-xs sm:text-sm font-medium text-[var(--ink)]">{user.age} years</p>
              </div>
            </div>
          )}

          {user.gender && (
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider font-mono">Gender</p>
                <p className="text-xs sm:text-sm font-medium text-[var(--ink)]">{user.gender}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider font-mono px-0.5">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-xs hover:shadow-md focus-ring"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-[var(--ink)]">{action.label}</p>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4.5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--ink-muted)] leading-relaxed">
          <strong className="text-[var(--ink)] font-semibold">Medical Disclaimer:</strong> Elixora
          is an AI healthcare guidance assistant for informational reference only. It does not provide formal medical diagnosis or prescription treatments.
        </div>
      </main>
    </div>
  );
}
