"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface EmptyStateProps {
  onSelectPrompt?: (promptText: string) => void;
  InputBarComponent?: React.ReactNode;
  userName?: string;
}

export function EmptyState({ onSelectPrompt, InputBarComponent, userName }: EmptyStateProps) {
  const { user } = useAuth() as { user: any };

  // Format first name in lowercase like: "Good morning, abhi"
  const rawName = userName || user?.name || "abhi";
  const firstName = rawName.split(" ")[0].toLowerCase();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 select-none animate-fade-in w-full my-auto pb-16">
      {/* ── Headline: Clean greeting without logo ── */}
      <div className="flex items-center justify-center mb-7">
        <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[var(--ink)]">
          {greeting}, {firstName}
        </h2>
      </div>

      {/* ── Centered Prompt Box ── */}
      {InputBarComponent && (
        <div className="w-full max-w-2xl">
          {InputBarComponent}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
