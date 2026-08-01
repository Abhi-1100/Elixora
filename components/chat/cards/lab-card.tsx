"use client";

import React from "react";
import { FileSpreadsheet, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface LabItem {
  biomarker: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: "Normal" | "High" | "Low" | "Critical";
  note?: string;
}

export interface LabReportData {
  reportTitle: string;
  patientName: string;
  date: string;
  labName: string;
  items: LabItem[];
  overallSummary: string;
}

interface LabCardProps {
  data: LabReportData;
}

export function LabCard({ data }: LabCardProps) {
  return (
    <div className="my-3 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] overflow-hidden shadow-xs border-l-4 border-l-[var(--accent)] text-xs">
      {/* Header */}
      <div className="p-3.5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[var(--ink)] tracking-tight">
              {data.reportTitle}
            </h4>
            <p className="text-[11px] font-mono text-[var(--ink-muted)]">
              Date: {data.date} • {data.labName}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--ink-muted)] font-mono text-[11px]">
          OCR Verified
        </span>
      </div>

      {/* Lab Values Table */}
      <div className="p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-medium">
                <th className="pb-2 font-medium">Biomarker</th>
                <th className="pb-2 font-medium">Result</th>
                <th className="pb-2 font-medium">Ref Range</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60 font-mono">
              {data.items.map((item, index) => {
                const isNormal = item.status === "Normal";
                const isHigh = item.status === "High" || item.status === "Critical";

                return (
                  <tr key={index} className="hover:bg-[var(--surface)]/50 transition-colors">
                    <td className="py-2.5 font-sans font-medium text-[var(--ink)] pr-2">
                      {item.biomarker}
                    </td>

                    <td className="py-2.5 font-semibold text-[var(--ink)] pr-2">
                      {item.result} <span className="text-[10px] text-[var(--ink-muted)]">{item.unit}</span>
                    </td>

                    <td className="py-2.5 text-[var(--ink-muted)] text-[11px] pr-2">
                      {item.referenceRange}
                    </td>

                    <td className="py-2.5 text-right">
                      {isNormal ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-sans font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Normal
                        </span>
                      ) : isHigh ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--warn-soft)] text-[var(--warn)] text-[10px] font-sans font-semibold">
                          <ArrowUpRight className="w-3 h-3" />
                          {item.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-sans font-medium">
                          <ArrowDownRight className="w-3 h-3" />
                          {item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Insight Summary */}
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
          <span className="font-semibold text-[11px] text-[var(--accent)] flex items-center gap-1">
            Clinical AI Summary:
          </span>
          <p className="text-[var(--ink)] leading-relaxed text-[11px]">
            {data.overallSummary}
          </p>
        </div>
      </div>
    </div>
  );
}
