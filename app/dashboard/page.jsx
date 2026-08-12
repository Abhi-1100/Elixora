"use client";
// app/dashboard/page.jsx

import { useEffect } from "react";
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
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-sm text-[var(--ink-muted)]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // redirecting

  // Derive initials
  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const quickActions = [
    {
      icon: <Mic className="w-6 h-6" />,
      label: "Voice Assistant",
      desc: "Start a hands-free health conversation",
      href: "/chat",
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      label: "Analyze Lab Report",
      desc: "Upload a PDF or image for OCR analysis",
      href: "/chat",
    },
    {
      icon: <Pill className="w-6 h-6" />,
      label: "Medication Guide",
      desc: "Look up dosage, interactions & side effects",
      href: "/chat",
    },
    {
      icon: <Activity className="w-6 h-6" />,
      label: "Symptom Checker",
      desc: "Describe symptoms and get structured insights",
      href: "/chat",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Welcome header */}
        <div className="relative p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-bl from-[var(--glow-a)] to-[var(--glow-b)] opacity-20 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] text-white text-2xl font-bold flex items-center justify-center shadow-md shrink-0">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-semibold text-[var(--ink)] truncate">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-[var(--ink-muted)] mt-0.5">
                Your AI health assistant is ready.
              </p>
            </div>

            <Link
              href="/chat"
              id="launch-assistant-btn"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shrink-0"
            >
              Launch Assistant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Profile summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider">Email</p>
              <p className="text-sm font-medium text-[var(--ink)] truncate">{user.email}</p>
            </div>
          </div>

          {user.age && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider">Age</p>
                <p className="text-sm font-medium text-[var(--ink)]">{user.age} years</p>
              </div>
            </div>
          )}

          {user.gender && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider">Gender</p>
                <p className="text-sm font-medium text-[var(--ink)]">{user.gender}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--ink-muted)] uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:shadow-md"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">{action.label}</p>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--ink-muted)] leading-relaxed">
          <strong className="text-[var(--ink)] font-semibold">Medical Disclaimer:</strong> Elixora
          is an AI tool for informational purposes only. It does not provide medical diagnoses and
          does not replace professional healthcare consultations.
        </div>
      </main>
    </div>
  );
}
