"use client";

import React, { useState } from "react";
import { BreathOrb } from "@/components/ui/breath-orb";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Mic,
  FileSpreadsheet,
  Pill,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [sandboxInput, setSandboxInput] = useState("");

  const handleLaunchSandbox = (promptText?: string) => {
    const text = promptText || sandboxInput || "Explain Amoxicillin 500mg dosage";
    router.push(`/chat?prompt=${encodeURIComponent(text)}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans transition-colors duration-200 selection:bg-[var(--accent-soft)]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BreathOrb size="sm" mode="idle" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-[var(--ink)]">
              Elixora
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold">
              AI Healthcare Assistant
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/chat"
            className="text-xs font-medium px-3.5 py-2 rounded-xl text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/chat"
            className="text-xs font-medium px-4 py-2 rounded-full bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Launch Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Ambient Glow Backdrop */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-[var(--glow-a)] to-[var(--glow-b)] opacity-30 blur-3xl pointer-events-none" />

        {/* Security Badge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-xs text-xs font-medium text-[var(--ink-muted)] mb-8 animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>HIPAA Safeguarded • Encrypted Health AI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Signature Breath Orb Hero Center */}
        <div className="mb-8 hover:scale-105 transition-transform cursor-pointer">
          <BreathOrb size="xl" mode="idle" />
        </div>

        {/* Main Display Headline (Fraunces Serif) */}
        <h1 className="font-display text-4xl sm:text-6xl font-semibold text-[var(--ink)] tracking-tight max-w-4xl leading-[1.15] mb-6">
          Conversational health intelligence, simplified for human peace of mind.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[var(--ink-muted)] max-w-2xl mb-10 leading-relaxed font-normal">
          Talk naturally with your personalized AI assistant about prescriptions, lab values, and symptom checks. Get clear clinical breakdowns in plain language.
        </p>

        {/* Interactive Sandbox Launcher Card */}
        <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-3 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 px-3 pt-1">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-xs font-medium text-[var(--ink-muted)]">
              Try an instant query in the sandbox:
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLaunchSandbox();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              placeholder="e.g. Analyze my Lipid report (Cholesterol 240 mg/dL)..."
              className="flex-1 bg-[var(--surface-muted)] text-[var(--ink)] placeholder-[var(--ink-muted)] text-xs sm:text-sm py-3 px-4 rounded-2xl border border-transparent focus:border-[var(--accent)] focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shrink-0 shadow-md"
            >
              <span>Ask Elixora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Starter Chips */}
          <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
            {[
              "Amoxicillin 500mg guide",
              "Lipid Panel analysis",
              "Symptom check: dry cough",
              "Drug interactions check",
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleLaunchSandbox(chip)}
                className="text-[11px] px-3 py-1 rounded-full bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] text-[var(--ink-muted)] border border-[var(--border)] transition-colors font-medium"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-[var(--ink)]">
              Designed for clinical precision and warmth
            </h2>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              Every interface element is crafted to provide instant clarity without overwhelming medical jargon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] space-y-4 hover:border-[var(--accent)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[var(--ink)]">
                Hands-Free Voice Mode
              </h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Full-screen immersive audio conversation with live real-time transcript streaming and wave visualizer.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] space-y-4 hover:border-[var(--accent)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[var(--ink)]">
                Lab Report OCR Analysis
              </h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Instant parsing of PDF and image blood reports with IBM Plex Mono biomarker reference tables.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] space-y-4 hover:border-[var(--accent)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[var(--ink)]">
                Medication & Rx Guides
              </h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Clear dosage schedules, food instructions, potential side effects, and drug interaction alerts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-[var(--bg)] border border-[var(--border)] space-y-4 hover:border-[var(--warn)] transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-[var(--warn-soft)] text-[var(--warn)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-[var(--ink)]">
                Emergency Triage Notice
              </h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Automated red-flag symptom detection with direct one-tap emergency 911 / 112 hotline links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="space-y-14">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase font-mono text-[var(--accent)] tracking-wider font-semibold">
              Simple Workflow
            </span>
            <h2 className="font-display text-3xl font-semibold text-[var(--ink)]">
              3 Steps to Clinical Clarity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <span className="font-mono text-2xl font-bold text-[var(--accent)]">01</span>
              <h3 className="font-semibold text-sm text-[var(--ink)]">Ask or Upload</h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Type your symptom query, speak via voice mode, or drop a lab PDF report into the input bar.
              </p>
            </div>

            <div className="relative p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <span className="font-mono text-2xl font-bold text-[var(--accent)]">02</span>
              <h3 className="font-semibold text-sm text-[var(--ink)]">AI Synthesis</h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Elixora references validated medical datasets to structure biomarker ranges and dosage guides.
              </p>
            </div>

            <div className="relative p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <span className="font-mono text-2xl font-bold text-[var(--accent)]">03</span>
              <h3 className="font-semibold text-sm text-[var(--ink)]">Interactive Card Guidance</h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Review color-coded specialized cards with actionable insights and exportable medical history logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HIPAA & Security Section */}
      <section id="security" className="py-16 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-8 bg-gradient-to-r from-[var(--accent-soft)]/60 to-[var(--surface)] p-8 rounded-3xl border border-[var(--border)]">
          <div className="p-4 rounded-2xl bg-[var(--accent)] text-white shrink-0">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="font-semibold text-lg text-[var(--ink)]">
              HIPAA Compliant & End-to-End Encrypted
            </h3>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              Your health data and upload records are encrypted using AES-256 standards. We strictly adhere to HIPAA privacy safeguards and never sell your personal medical queries.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="font-display text-3xl font-semibold text-[var(--ink)]">
              Transparent & Accessible Pricing
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Free forever for personal symptom checks. Upgrade for multi-family lab tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-semibold text-base text-[var(--ink)]">Free Personal</h3>
                <div className="font-mono text-3xl font-bold text-[var(--ink)]">$0</div>
                <ul className="space-y-2 text-xs text-[var(--ink-muted)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Unlimited text queries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>5 Lab OCR uploads/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Basic Voice Mode</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/chat"
                className="w-full py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] text-center text-xs font-semibold text-[var(--ink)] block"
              >
                Get Started
              </Link>
            </div>

            {/* Tier 2 (Highlighted) */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border-2 border-[var(--accent)] space-y-6 flex flex-col justify-between shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-base text-[var(--ink)]">Health Plus</h3>
                <div className="font-mono text-3xl font-bold text-[var(--accent)]">
                  $12 <span className="text-xs font-normal text-[var(--ink-muted)]">/mo</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--ink-muted)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                    <span>Unlimited PDF & Image OCR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                    <span>Unlimited Hands-free Voice Mode</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                    <span>Export Medical Record PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                    <span>Multi-Language Translation</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/chat"
                className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-center text-xs font-semibold hover:opacity-90 block"
              >
                Start 14-Day Trial
              </Link>
            </div>

            {/* Tier 3 */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-semibold text-base text-[var(--ink)]">Family & Clinic</h3>
                <div className="font-mono text-3xl font-bold text-[var(--ink)]">
                  $29 <span className="text-xs font-normal text-[var(--ink-muted)]">/mo</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--ink-muted)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Up to 6 Family Profiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Shared Medication Vault</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Priority Clinical Processing</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/chat"
                className="w-full py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] text-center text-xs font-semibold text-[var(--ink)] block"
              >
                Contact Clinic Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 bg-[var(--surface)] border-t border-[var(--border)] text-xs text-[var(--ink-muted)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BreathOrb size="sm" mode="idle" />
              <span className="font-semibold text-sm text-[var(--ink)]">Elixora Health</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Empowering individuals with AI clinical assistant tools and structured medical intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--ink)] mb-3">Product</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/chat">Voice Assistant</Link></li>
              <li><Link href="/chat">Lab OCR Reader</Link></li>
              <li><Link href="/chat">Prescription Guide</Link></li>
              <li><Link href="/chat">Symptom Checker</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--ink)] mb-3">Security & Compliance</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#security">HIPAA Compliance</a></li>
              <li><a href="#security">AES-256 Encryption</a></li>
              <li><a href="#security">Privacy Safeguards</a></li>
              <li><a href="#security">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--ink)] mb-3">Medical Disclaimer</h4>
            <p className="text-[10px] leading-relaxed opacity-80">
              Elixora is an artificial intelligence application designed for informational and educational purposes only. Elixora does not provide medical diagnoses or replace professional healthcare consultations.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026 Elixora Health Assistant Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/chat">Launch App</Link>
            <span>•</span>
            <a href="#security">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
