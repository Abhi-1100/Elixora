"use client";

import React from "react";
import { AlertCircle, LucideIcon } from "lucide-react";
import Link from "next/link";

interface StateCardProps {
  type?: "empty" | "error";
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function StateCard({
  type = "empty",
  icon: Icon = AlertCircle,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: StateCardProps) {
  const isError = type === "error";

  return (
    <div
      className={`p-8 sm:p-12 rounded-3xl border text-center flex flex-col items-center justify-center space-y-4 transition-all ${
        isError
          ? "bg-[var(--warn-soft)]/40 border-[var(--warn)]/30 text-[var(--ink)]"
          : "bg-[var(--surface)] border-[var(--border)] text-[var(--ink)]"
      } ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          isError
            ? "bg-[var(--warn-soft)] text-[var(--warn)]"
            : "bg-[var(--accent-soft)] text-[var(--accent)]"
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs focus-ring ${
                isError
                  ? "bg-[var(--warn)] text-white hover:opacity-90"
                  : "bg-[var(--accent)] text-white hover:opacity-90"
              }`}
            >
              {actionLabel}
            </Link>
          ) : onAction ? (
            <button
              onClick={onAction}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs focus-ring ${
                isError
                  ? "bg-[var(--warn)] text-white hover:opacity-90"
                  : "bg-[var(--accent)] text-white hover:opacity-90"
              }`}
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
