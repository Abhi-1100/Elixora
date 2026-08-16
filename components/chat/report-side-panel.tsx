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
  Eye,
  Code2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    case "Borderline":
      return {
        badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    case "Critical":
      return {
        badge: "bg-rose-500/10 text-rose-600 border-rose-500/30",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      };
    default:
      return {
        badge: "bg-[var(--surface-muted)] text-[var(--ink-muted)] border-[var(--border)]",
        icon: <FileQuestion className="w-3.5 h-3.5" />,
      };
  }
}

export function ReportSidePanel({
  report,
  onClose,
  isExpanded = false,
  onToggleExpand,
}: ReportSidePanelProps) {
  // View mode: 'document' (Eye preview) vs 'data' (Biomarker breakdown & Code)
  const [viewMode, setViewMode] = useState<"document" | "data">("document");
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageScale, setImageScale] = useState(1);

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

  // Copy biomarker summary to clipboard
  const handleCopySummary = () => {
    const summaryText =
      `Report Analysis Summary (${report.overall_status})\n` +
      `Report ID: ${report.report_id}\n\n` +
      `Biomarkers:\n` +
      (report.results || [])
        .map(
          (r) =>
            `• ${r.test_name}: ${r.value} ${r.unit} (${r.status} — Ref: ${r.normal_range} ${r.unit})`
        )
        .join("\n");

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
      {/* ── Top Artifact Header Toolbar (Aligned seamlessly with TopBar) ──── */}
      <div className="h-14 px-4 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0 bg-[var(--surface)]/90 backdrop-blur-md">
        {/* Left: View Mode Toggle Pill (Eye vs Code) */}
        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-0.5 shadow-2xs">
          <button
            onClick={() => setViewMode("document")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "document"
                ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-2xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            title="Document / Image Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => setViewMode("data")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "data"
                ? "bg-[var(--accent-soft)] text-[var(--accent)] shadow-2xs"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            title="Biomarker Data & Breakdown"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Breakdown</span>
          </button>
        </div>

        {/* Center: Document Title Tag */}
        <div className="flex items-center gap-2 min-w-0 px-2">
          <FileText className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="font-semibold text-xs text-[var(--ink)] truncate max-w-[180px] sm:max-w-[240px]">
            Lab Report ({report.report_id ? report.report_id.slice(0, 8) : "Preview"})
          </span>
          <span className="hidden md:inline font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-md bg-[var(--surface-muted)] text-[var(--ink-muted)] border border-[var(--border)]">
            {isPdf ? "PDF" : "IMG"}
          </span>
        </div>

        {/* Right: Actions (Copy, Maximize, Close) */}
        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-2xs focus-ring"
            title="Copy biomarker analysis"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Expand / Minimize Toggle */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-colors focus-ring"
              title={isExpanded ? "Standard width" : "Expand panel"}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-colors focus-ring"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Status Bar Sub-header ────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[var(--ink-muted)] font-mono text-[11px]">Overall Status:</span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${badge.badge}`}>
            {badge.icon}
            <span>{report.overall_status}</span>
          </span>
        </div>
        <span className="text-[10px] font-mono text-[var(--ink-muted)]">
          {report.results?.length ?? 0} Biomarkers Detected
        </span>
      </div>

      {/* ── Main Canvas View Stage ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 relative bg-[var(--bg)]">
        {viewMode === "document" ? (
          /* ── DOCUMENT / IMAGE PREVIEW CANVAS ─────────────────────────── */
          <div className="w-full h-full flex flex-col relative bg-slate-900/5 dark:bg-black/30">
            {/* Image zoom controls bar if previewing an image */}
            {filePreviewUrl && !isPdf && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-md text-xs">
                <button
                  onClick={() => setImageScale((s) => Math.max(0.6, s - 0.2))}
                  className="p-1 text-[var(--ink-muted)] hover:text-[var(--accent)]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 font-mono text-[10px] text-[var(--ink-muted)]">
                  {Math.round(imageScale * 100)}%
                </span>
                <button
                  onClick={() => setImageScale((s) => Math.min(2.5, s + 0.2))}
                  className="p-1 text-[var(--ink-muted)] hover:text-[var(--accent)]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setImageScale(1)}
                  className="p-1 text-[10px] text-[var(--ink-muted)] hover:text-[var(--accent)] underline"
                >
                  Reset
                </button>
              </div>
            )}

            {filePreviewUrl ? (
              isPdf ? (
                <iframe
                  src={filePreviewUrl}
                  title="Lab Report Document PDF"
                  className="w-full h-full min-h-[500px] border-0"
                />
              ) : (
                <div className="w-full h-full overflow-auto p-6 flex items-center justify-center">
                  <div
                    className="transition-transform duration-200 origin-center"
                    style={{ transform: `scale(${imageScale})` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreviewUrl}
                      alt="Lab Report Image Scan"
                      className="max-w-full h-auto rounded-2xl border border-[var(--border)] shadow-2xl bg-white"
                    />
                  </div>
                </div>
              )
            ) : (
              /* Fallback scan image preview element */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shadow-md">
                  <FileText className="w-10 h-10 opacity-70" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h4 className="font-semibold text-sm text-[var(--ink)]">
                    Document Image Preview
                  </h4>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Report scanned & parsed successfully. Click &apos;Breakdown&apos; above to view clinical test parameters.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── BIOMARKER BREAKDOWN & DATA VIEW ────────────────────────── */
          <div className="p-4 sm:p-5 space-y-5 animate-fade-in">
            {/* ── 3 STAT CARDS ────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center flex flex-col items-center justify-center shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-500 mb-1" />
                <span className="font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {statCounts.Critical}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600/80 dark:text-rose-400/80 font-mono">
                  Critical
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center flex flex-col items-center justify-center shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
                <span className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {statCounts.Borderline}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 font-mono">
                  Borderline
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center flex flex-col items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {statCounts.Normal}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80 font-mono">
                  Normal
                </span>
              </div>
            </div>

            {/* ── BIOMARKER RESULTS TABLE ─────────────────────────────── */}
            <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-xs">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider font-mono">
                  Extracted Biomarkers ({report.results?.length || 0})
                </h4>
                {filePreviewUrl && (
                  <a
                    href={filePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View original file</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-muted)]/50 text-[var(--ink-muted)] font-mono uppercase text-[10px] tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-3.5 py-2.5">Test Name</th>
                      <th className="px-3.5 py-2.5">Value</th>
                      <th className="px-3.5 py-2.5">Reference</th>
                      <th className="px-3.5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-medium">
                    {report.results?.map((res, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface-muted)]/40 transition-colors">
                        <td className="px-3.5 py-3 font-semibold text-[var(--ink)] max-w-[130px] truncate">
                          {res.test_name}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[var(--ink)] whitespace-nowrap">
                          {res.value} <span className="text-[10px] text-[var(--ink-muted)]">{res.unit}</span>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[10px] text-[var(--ink-muted)] whitespace-nowrap">
                          {res.normal_range}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusPill(res.status)}`}>
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!report.results || report.results.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[var(--ink-muted)] text-xs">
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
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <button
                  onClick={() => setShowUnmatched((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  <span>Other detected text ({report.unmatched_lines.length} lines)</span>
                  {showUnmatched ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showUnmatched && (
                  <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-muted)]/30 font-mono text-[10px] text-[var(--ink-muted)] space-y-1 max-h-40 overflow-y-auto">
                    {report.unmatched_lines.map((line, idx) => (
                      <p key={idx} className="truncate">• {line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
