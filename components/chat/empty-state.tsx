"use client";

import React from "react";
import { BreathOrb } from "@/components/ui/breath-orb";
import {
  Pill,
  FileSpreadsheet,
  Stethoscope,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface StarterChip {
  icon: React.ElementType;
  label: string;
  query: string;
  category: string;
}

const STARTER_CHIPS: StarterChip[] = [
  {
    icon: Pill,
    label: "Explain a Medicine",
    query: "Explain Amoxicillin 500mg dosage, side effects, and food instructions",
    category: "Medication",
  },
  {
    icon: FileSpreadsheet,
    label: "Read my Lab Report",
    query: "Analyze my Blood Test report: Lipid Panel (Cholesterol 240 mg/dL, HDL 45 mg/dL)",
    category: "Diagnostics",
  },
  {
    icon: Stethoscope,
    label: "Symptom Check",
    query: "I've had a dry cough, low-grade fever, and fatigue for 3 days. What could it be?",
    category: "Assessment",
  },
  {
    icon: FileText,
    label: "Prescription Help",
    query: "Summarize my prescription for Lisinopril and check drug interactions",
    category: "Rx Guide",
  },
];

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto select-none">
      {/* Signature Breath Orb */}
      <div className="mb-6 hover:scale-105 transition-transform cursor-pointer">
        <BreathOrb size="lg" mode="idle" />
      </div>

      {/* Greeting Headline in Fraunces warm humanist serif */}
      <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] mb-3 leading-snug">
        How can I assist with your health today?
      </h2>

      <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mb-8 leading-relaxed">
        Speak naturally or upload documents. Elixora answers your questions about medications, lab values, and symptoms in plain language.
      </p>

      {/* Starter Suggestion Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
        {STARTER_CHIPS.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(chip.query)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/50 transition-all text-left group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="p-2.5 rounded-xl bg-[var(--surface-muted)] text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-wider block">
                    {chip.category}
                  </span>
                  <span className="font-medium text-xs text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate block">
                    {chip.label}
                  </span>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Voice Hint Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-muted)] text-[var(--ink-muted)] text-xs border border-[var(--border)]">
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Tip: Click the microphone in the bar below for hands-free voice mode</span>
      </div>
    </div>
  );
}
