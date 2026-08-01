"use client";

import React from "react";
import { FileText, UserCheck, Calendar, RefreshCw } from "lucide-react";

export interface PrescriptionData {
  rxNumber: string;
  doctorName: string;
  clinic: string;
  issueDate: string;
  refillsRemaining: number;
  medications: Array<{
    name: string;
    instructions: string;
    quantity: string;
  }>;
}

interface PrescriptionCardProps {
  data: PrescriptionData;
}

export function PrescriptionCard({ data }: PrescriptionCardProps) {
  return (
    <div className="my-3 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] overflow-hidden shadow-xs border-l-4 border-l-[var(--accent)] text-xs">
      {/* Header */}
      <div className="p-3.5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[var(--ink)] tracking-tight">
              Prescription Summary
            </h4>
            <p className="text-[11px] font-mono text-[var(--ink-muted)]">
              Rx #{data.rxNumber} • {data.clinic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full font-medium">
          <RefreshCw className="w-3 h-3" />
          <span>{data.refillsRemaining} Refills Left</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] pb-2 border-b border-[var(--border)]">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            Doctor: {data.doctorName}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            Issued: {data.issueDate}
          </span>
        </div>

        {/* Medication List */}
        <div className="space-y-2">
          {data.medications.map((med, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--ink)] text-xs">
                  {med.name}
                </span>
                <span className="font-mono text-[11px] text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded">
                  Qty: {med.quantity}
                </span>
              </div>
              <p className="text-[var(--ink-muted)] text-[11px]">
                {med.instructions}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
