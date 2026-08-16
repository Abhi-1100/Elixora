"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
  InputBarComponent?: React.ReactNode;
  userName?: string;
}

export function EmptyState({ onSelectPrompt, InputBarComponent, userName }: EmptyStateProps) {
  const { user } = useAuth() as { user: any };

  // Use provided userName prop, or logged in user's name, or default fallback
  const displayName = userName || user?.name || "there";

  const suggestions = [
    "Explain Amoxicillin 500mg dosage and side effects",
    "Analyze Lipid Panel lab report parameters",
    "What should I do for a mild persistent cough?",
    "Summarize prescription instructions for Lisinopril",
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center max-w-3xl w-full mx-auto my-auto select-none gap-8 animate-fade-in">
      {/* Greeting Headline */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shadow-xs">
          <Sparkles className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[var(--ink)] capitalize">
          How can I help with your health today, {displayName}?
        </h2>
        <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md">
          Ask questions about symptoms, medications, or upload a lab report PDF for clinical extraction.
        </p>
      </div>

      {/* Suggested Starter Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
        {suggestions.map((promptText, i) => (
          <button
            key={i}
            onClick={() => onSelectPrompt(promptText)}
            className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-medium text-[var(--ink)] transition-all hover:shadow-xs active:scale-[0.99] focus-ring"
          >
            <span className="text-[var(--ink-muted)] font-mono text-[10px] block mb-1">
              0{i + 1} • Suggestion
            </span>
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Bar Placeholder */}
      {InputBarComponent && (
        <div className="w-full max-w-2xl mt-2">
          {InputBarComponent}
        </div>
      )}
    </div>
  );
}
