"use client";

import React from "react";
import { Pill, Clock, ShieldAlert } from "lucide-react";

export interface MedicineDetails {
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  timing: string;
  purpose: string;
  sideEffects: string[];
  warnings?: string[];
}

interface MedicineCardProps {
  data: MedicineDetails;
}

export function MedicineCard({ data }: MedicineCardProps) {
  return (
    <div className="my-3 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] overflow-hidden shadow-xs border-l-4 border-l-[var(--accent)] text-xs">
      {/* Header */}
      <div className="p-3.5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[var(--ink)] tracking-tight">
              {data.name}
            </h4>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Generic: {data.genericName}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-medium text-[11px]">
          Medication Guide
        </span>
      </div>

      {/* Body Grid */}
      <div className="p-4 space-y-3">
        {/* Purpose */}
        <p className="text-[var(--ink)] leading-relaxed">
          <strong className="font-medium text-[var(--ink-muted)]">Indication: </strong>
          {data.purpose}
        </p>

        {/* Dosage & Frequency Row (Mono font for precision) */}
        <div className="grid grid-cols-2 gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider font-medium">
              Prescribed Dosage
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--accent)]">
              {data.dosage}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider font-medium">
              Schedule & Timing
            </span>
            <span className="font-mono text-xs font-medium text-[var(--ink)] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[var(--accent)] inline" />
              {data.frequency} ({data.timing})
            </span>
          </div>
        </div>

        {/* Possible Side Effects */}
        <div>
          <span className="text-[11px] font-medium text-[var(--ink-muted)] block mb-1.5">
            Common Side Effects:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {data.sideEffects.map((effect, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] text-[11px]"
              >
                {effect}
              </span>
            ))}
          </div>
        </div>

        {/* Warnings Section (if present) */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-[var(--warn-soft)] border border-[var(--warn)]/30 text-[var(--warn)] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[var(--warn)]" />
            <div className="space-y-1">
              <span className="font-semibold text-[11px]">Important Caution:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                {data.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
