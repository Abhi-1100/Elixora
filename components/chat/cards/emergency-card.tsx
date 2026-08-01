"use client";

import React from "react";
import { AlertTriangle, PhoneCall, ShieldAlert } from "lucide-react";

interface EmergencyCardProps {
  title?: string;
  message: string;
  redFlagSymptoms?: string[];
}

export function EmergencyCard({
  title = "Urgent Medical Alert",
  message,
  redFlagSymptoms = [
    "Severe chest pain or pressure spreading to arms/jaw",
    "Sudden difficulty breathing or shortness of breath",
    "Sudden numbness, weakness, or facial drooping",
    "Uncontrolled severe bleeding or acute trauma",
  ],
}: EmergencyCardProps) {
  return (
    <div className="my-4 rounded-2xl bg-[var(--warn-soft)] border-2 border-[var(--warn)] p-4 shadow-sm space-y-3 text-xs text-[var(--ink)]">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[var(--warn)]/20 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--warn)] text-white animate-pulse">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-[var(--warn)] uppercase tracking-wide">
            {title}
          </h4>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-[var(--warn)] text-white font-mono text-[10px] font-bold tracking-wider">
          EMERGENCY TRIAGE
        </span>
      </div>

      {/* Main Guidance Text */}
      <p className="font-medium text-[var(--ink)] leading-relaxed">
        {message}
      </p>

      {/* Red Flag Checklist */}
      {redFlagSymptoms && redFlagSymptoms.length > 0 && (
        <div className="bg-[var(--surface)]/80 backdrop-blur-xs p-3 rounded-xl border border-[var(--warn)]/30 space-y-1.5">
          <span className="font-semibold text-[var(--warn)] text-[11px] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 inline" />
            Red-Flag Emergency Symptoms:
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[var(--ink)]">
            {redFlagSymptoms.map((symptom, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] mt-1 shrink-0" />
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Direct Action Hotline Button Bar */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[var(--ink-muted)]">
          If you are experiencing a medical emergency, do not wait for AI advice.
        </span>

        <a
          href="tel:911"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--warn)] text-white font-bold text-xs hover:opacity-95 transition-all shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          Call Emergency Services (911 / 112)
        </a>
      </div>
    </div>
  );
}
