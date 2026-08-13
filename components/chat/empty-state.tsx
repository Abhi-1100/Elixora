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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl w-full mx-auto my-auto select-none gap-8">
      
      {/* Greeting Headline */}
      <div className="flex items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--warn)]" />
        <h2 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-[var(--ink)] capitalize">
          Hey there, {displayName}
        </h2>
      </div>

      {/* Input Bar Placeholder */}
      {InputBarComponent && (
        <div className="w-full max-w-2xl mt-4">
          {InputBarComponent}
        </div>
      )}
      
    </div>
  );
}
