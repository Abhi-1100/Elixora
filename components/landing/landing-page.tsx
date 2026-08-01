"use client";

import React from "react";
import { BreathOrb } from "@/components/ui/breath-orb";
import {
  MessageSquare,
  Mic,
  FileSpreadsheet,
  ShieldCheck,
  Globe2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  HeartPulse,
} from "lucide-react";

interface LandingPageProps {
  onStartChat: () => void;
  onOpenVoice: () => void;
}

export function LandingPage({ onStartChat, onOpenVoice }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans select-none">
      {/* Navbar */}
      <nav className="h-16 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BreathOrb size="sm" mode="idle" />
          <span className="font-semibold text-lg tracking-tight text-[var(--ink)]">
            Aether
          </span>
          <span className="text-[10px] font-mono uppercase bg-[var(--accent-soft)] text-[var(--accent)] px-2 py-0.5 rounded-full font-bold">
            AI Healthcare
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--ink-muted)]">
          <a href="#features" className="hover:text-[var(--accent)] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[var(--accent)] transition-colors">
            How it works
          </a>
          <a href="#safety" className="hover:text-[var(--accent)] transition-colors">
            Safety & HIPAA
          </a>
          <a href="#pricing" className="hover:text-[var(--accent)] transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onStartChat}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-all font-medium text-xs shadow-sm flex items-center gap-1.5"
          >
            <span>Open Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--ink-muted)] mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Next-Generation Patient AI • Voice First & Multilingual</span>
        </div>

        {/* Hero Signature Breath Orb */}
        <div
          onClick={onStartChat}
          className="mb-8 cursor-pointer hover:scale-105 transition-transform"
          title="Click to launch AI Health Assistant"
        >
          <BreathOrb size="xl" mode="idle" />
        </div>

        {/* Display Headline in Fraunces warm humanist serif */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-[var(--ink)] tracking-tight max-w-3xl leading-[1.15] mb-6">
          Talk to your healthcare assistant in any language.
        </h1>

        <p className="text-sm sm:text-base text-[var(--ink-muted)] max-w-xl mb-8 leading-relaxed">
          Aether explains prescriptions, analyzes lab reports, and answers medical questions through natural conversation. No clinical jargon, no complex dashboards.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button
            onClick={onStartChat}
            className="px-6 py-3.5 rounded-2xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-95 transition-all shadow-md flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Start Health Conversation</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="px-6 py-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] font-medium text-sm hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] transition-all shadow-xs flex items-center gap-2"
          >
            <Mic className="w-4 h-4 text-[var(--accent)]" />
            <span>Try Live Voice Mode</span>
          </button>
        </div>

        {/* Live Conversation Interactive Preview Card */}
        <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-2xl text-left space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-xs text-[var(--ink-muted)]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live Conversation Preview
            </span>
            <span className="font-mono text-[11px]">Lab Analysis & Dosage</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* User Bubble */}
            <div className="flex justify-end">
              <div className="bg-[var(--accent)] text-white px-4 py-2.5 rounded-2xl max-w-[85%]">
                Can you check if my Cholesterol 240 mg/dL is high, and explain Amoxicillin side effects?
              </div>
            </div>

            {/* AI Response Preview */}
            <div className="flex gap-3">
              <BreathOrb size="sm" mode="idle" />
              <div className="bg-[var(--surface-muted)] p-4 rounded-2xl border border-[var(--border)] flex-1 space-y-2">
                <p className="text-[var(--ink)]">
                  Your Total Cholesterol of <strong className="font-mono text-[var(--accent)]">240 mg/dL</strong> is borderline high (normal is under 200 mg/dL).
                </p>
                <div className="bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)] text-[11px] space-y-1">
                  <span className="font-semibold text-[var(--accent)]">Amoxicillin 500mg Guidance:</span>
                  <p className="text-[var(--ink-muted)]">
                    Take every <span className="font-mono text-[var(--ink)]">8 hours</span> with food to reduce nausea. Common side effects include mild diarrhea or stomach upset.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-16 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
              Designed for Patients
            </h2>
            <h3 className="font-display text-3xl font-semibold text-[var(--ink)]">
              Everything centered around conversation
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-3">
              <div className="p-3 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] w-fit">
                <Globe2 className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-base text-[var(--ink)]">
                Multilingual Voice Input
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Speak in over 40 languages. Aether automatically translates medical terminology into your native tongue in clear, plain language.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-3">
              <div className="p-3 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] w-fit">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-base text-[var(--ink)]">
                Lab Report OCR Parsing
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Upload PDFs or photos of blood tests. Key lab metrics are extracted with monospaced precision and formatted with clear reference ranges.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-[var(--surface-muted)] border border-[var(--border)] space-y-3">
              <div className="p-3 rounded-2xl bg-[var(--warn-soft)] text-[var(--warn)] w-fit">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-base text-[var(--ink)]">
                Emergency Triage Guard
              </h4>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                Red-flag symptom detection immediately alerts you to contact emergency services (911/112) without interrupting your ongoing conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & HIPAA Section */}
      <section id="safety" className="px-6 py-16 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto bg-[var(--surface-muted)] rounded-3xl p-8 border border-[var(--border)] flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 rounded-3xl bg-[var(--accent)] text-white shrink-0">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] uppercase font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>HIPAA Compliant & End-to-End Encrypted</span>
            </div>
            <h3 className="font-display text-2xl font-semibold text-[var(--ink)]">
              Your health data stays private and protected.
            </h3>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
              We adhere to strict medical privacy standards. Conversations are never sold or used to train public AI models without explicit patient consent.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-16 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h3 className="font-display text-3xl font-semibold text-[var(--ink)]">
              Simple, transparent pricing
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Start for free with essential health guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="p-6 rounded-3xl bg-[var(--surface-muted)] border border-[var(--border)] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-[var(--ink)]">Standard</h4>
                <div className="text-3xl font-bold font-mono text-[var(--ink)]">$0</div>
                <p className="text-xs text-[var(--ink-muted)]">Forever free for personal health queries.</p>
                <ul className="space-y-2 text-xs text-[var(--ink)] pt-4 border-t border-[var(--border)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Unlimited text queries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Basic lab report uploads</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStartChat}
                className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink)] font-medium text-xs hover:bg-[var(--surface)] transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Plus Tier */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border-2 border-[var(--accent)] flex flex-col justify-between space-y-6 relative shadow-lg">
              <span className="absolute -top-3 right-6 bg-[var(--accent)] text-white text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full font-semibold">
                Most Popular
              </span>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-[var(--ink)]">Aether Plus</h4>
                <div className="text-3xl font-bold font-mono text-[var(--accent)]">$12<span className="text-xs font-normal text-[var(--ink-muted)]">/mo</span></div>
                <p className="text-xs text-[var(--ink-muted)]">Includes live voice mode and OCR analysis.</p>
                <ul className="space-y-2 text-xs text-[var(--ink)] pt-4 border-t border-[var(--border)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Unlimited Live Voice Mode</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Full Lab PDF & OCR Parsing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Priority Response Speed</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStartChat}
                className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-xs hover:opacity-90 transition-all shadow-sm"
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Family Tier */}
            <div className="p-6 rounded-3xl bg-[var(--surface-muted)] border border-[var(--border)] flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-[var(--ink)]">Family Care</h4>
                <div className="text-3xl font-bold font-mono text-[var(--ink)]">$24<span className="text-xs font-normal text-[var(--ink-muted)]">/mo</span></div>
                <p className="text-xs text-[var(--ink-muted)]">Up to 5 family member profiles.</p>
                <ul className="space-y-2 text-xs text-[var(--ink)] pt-4 border-t border-[var(--border)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>5 Separate Health Histories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Shared Medication Manager</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStartChat}
                className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink)] font-medium text-xs hover:bg-[var(--surface)] transition-all"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] py-8 px-6 text-xs text-[var(--ink-muted)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BreathOrb size="sm" mode="idle" />
            <span className="font-semibold text-[var(--ink)]">Aether Assistant</span>
          </div>

          <p className="text-[11px] font-mono text-center">
            AI medical guidance only. Always consult a licensed healthcare professional for diagnoses.
          </p>

          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-[var(--ink)]">Privacy</a>
            <a href="#terms" className="hover:text-[var(--ink)]">Terms</a>
            <a href="#hipaa" className="hover:text-[var(--ink)]">HIPAA Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
