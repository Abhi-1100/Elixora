"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileQuestion,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TestResult {
  test_name: string;
  value: number;
  unit: string;
  status: string;
  normal_range: string;
}

export interface ReportData {
  report_id: string;
  overall_status: string;
  uploaded_at?: string;
  file_url: string;
  results: TestResult[];
  unmatched_lines?: string[];
}

interface ReportSidePanelProps {
  report: ReportData;
  onClose: () => void;
}

const FLASK_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://localhost:5000";

function getStatusPill(status: string) {
  switch (status) {
    case "Normal":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    case "Borderline":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    case "Critical":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
    default:
      return "bg-[var(--surface-muted)] text-[var(--ink-muted)] border-[var(--border)]";
  }
}

function getOverallBadge(status: string) {
  switch (status) {
    case "Normal":
      return {
        badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        icon: <CheckCircle2 className="w-4 h-4" />,
      };
    case "Borderline":
      return {
        badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    case "Critical":
      return {
        badge: "bg-rose-500/10 text-rose-600 border-rose-500/30",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    default:
      return {
        badge: "bg-[var(--surface-muted)] text-[var(--ink-muted)] border-[var(--border)]",
        icon: <FileQuestion className="w-4 h-4" />,
      };
  }
}

export function ReportSidePanel({ report, onClose }: ReportSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "document">("summary");
  const [showUnmatched, setShowUnmatched] = useState(false);

  const filePreviewUrl = report.file_url
    ? report.file_url.startsWith("http")
      ? report.file_url
      : `${FLASK_BASE}${report.file_url}`
    : null;

  const isPdf = filePreviewUrl?.toLowerCase().endsWith(".pdf");

  // Stat counts derived dynamically from real report.results
  const statCounts = useMemo(() => {
    if (!report?.results) return { Critical: 0, Borderline: 0, Normal: 0 };
    return report.results.reduce(
      (acc, r) => {
        const s = r.status as keyof typeof acc;
        if (s in acc) acc[s]++;
        return acc;
      },
      { Critical: 0, Borderline: 0, Normal: 0 }
    );
  }, [report]);

  const badge = getOverallBadge(report.overall_status);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--surface)] border-l border-[var(--border)] shadow-xl overflow-hidden animate-in slide-in-from-right duration-200">
      {/* ── Top Bar / Header ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0 bg-[var(--surface-muted)]/50">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <h3 className="font-semibold text-xs sm:text-sm text-[var(--ink)] truncate">
            Report Analyzer
          </h3>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${badge.badge}`}>
            {badge.icon}
            <span>{report.overall_status}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {filePreviewUrl && (
            <a
              href={filePreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--accent)] rounded-lg hover:bg-[var(--surface-muted)] transition-colors"
              title="Open document in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--surface-muted)] transition-colors"
            title="Close report panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab Selector ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-[var(--border)] bg-[var(--surface)] text-xs font-semibold shrink-0">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 py-2.5 px-4 border-b-2 text-center transition-all ${
            activeTab === "summary"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]/20"
              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          Biomarker Breakdown ({report.results?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("document")}
          className={`flex-1 py-2.5 px-4 border-b-2 text-center transition-all ${
            activeTab === "document"
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]/20"
              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          Document Preview
        </button>
      </div>

      {/* ── Panel Content Stage ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "summary" ? (
          <div className="p-4 space-y-4">
            {/* ── 3 STAT CARDS ────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center flex flex-col items-center justify-center">
                <AlertCircle className="w-4 h-4 text-rose-500 mb-1" />
                <span className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                  {statCounts.Critical}
                </span>
                <span className="text-[10px] font-semibold uppercase text-rose-600/80 dark:text-rose-400/80">
                  Critical
                </span>
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center flex flex-col items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
                <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
                  {statCounts.Borderline}
                </span>
                <span className="text-[10px] font-semibold uppercase text-amber-600/80 dark:text-amber-400/80">
                  Borderline
                </span>
              </div>

              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {statCounts.Normal}
                </span>
                <span className="text-[10px] font-semibold uppercase text-emerald-600/80 dark:text-emerald-400/80">
                  Normal
                </span>
              </div>
            </div>

            {/* ── BIOMARKER RESULTS TABLE ─────────────────────────────── */}
            <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)] text-[var(--ink-muted)] font-mono uppercase text-[10px] tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-3 py-2.5">Test Name</th>
                      <th className="px-3 py-2.5">Value</th>
                      <th className="px-3 py-2.5">Reference</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-medium">
                    {report.results?.map((res, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-[var(--ink)] max-w-[120px] truncate">
                          {res.test_name}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[var(--ink)] whitespace-nowrap">
                          {res.value} <span className="text-[10px] text-[var(--ink-muted)]">{res.unit}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-[var(--ink-muted)] whitespace-nowrap">
                          {res.normal_range}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusPill(res.status)}`}>
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!report.results || report.results.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-[var(--ink-muted)] text-xs">
                          No parsed test values found in this report.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── UNMATCHED OCR LINES (collapsible) ───────────────────── */}
            {report.unmatched_lines && report.unmatched_lines.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <button
                  onClick={() => setShowUnmatched((v) => !v)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  <span>Other detected text ({report.unmatched_lines.length} lines)</span>
                  {showUnmatched ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showUnmatched && (
                  <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--surface-muted)]/30 font-mono text-[10px] text-[var(--ink-muted)] space-y-1 max-h-36 overflow-y-auto">
                    {report.unmatched_lines.map((line, idx) => (
                      <p key={idx} className="truncate">• {line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ── DOCUMENT PREVIEW TAB ────────────────────────────────────── */
          <div className="w-full h-full flex flex-col bg-[var(--surface-muted)]">
            {filePreviewUrl ? (
              isPdf ? (
                <iframe
                  src={filePreviewUrl}
                  title="Document Preview"
                  className="w-full h-full min-h-[400px] border-0"
                />
              ) : (
                <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreviewUrl}
                    alt="Lab Report Scan"
                    className="max-w-full h-auto rounded-xl border border-[var(--border)] shadow-md"
                  />
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-[var(--ink-muted)] text-xs text-center">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p>No document preview available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
