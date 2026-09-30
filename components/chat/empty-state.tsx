"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface EmptyStateProps {
  onSelectPrompt?: (promptText: string) => void;
  InputBarComponent?: React.ReactNode;
  userName?: string;
}

export function EmptyState({ onSelectPrompt, InputBarComponent, userName }: EmptyStateProps) {
  const { user } = useAuth() as { user: any };

  // Use provided userName prop, or logged in user's name, or default fallback
  const displayName = userName || user?.name || "there";

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-10 text-center max-w-3xl w-full mx-auto my-auto select-none gap-5 sm:gap-8 animate-fade-in">
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

      {/* Input Bar Placeholder */}
      {InputBarComponent && (
        <div className="w-full max-w-2xl mt-0 sm:mt-2">
          {InputBarComponent}
        </div>
      )}
    </div>
  );
}
