"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getReport } from "@/lib/api";
import { Navbar } from "@/components/ui/navbar";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  MessageSquare,
  FileText,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FLASK_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://localhost:5000";

function getStatusPill(status) {
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

function getOverallConfig(status) {
  switch (status) {
    case "Normal":
      return {
        ring: "border-emerald-500/40",
        badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        icon: <CheckCircle2 className="w-5 h-5" />,
        desc: "All extracted biomarkers are within standard reference limits.",
      };
    case "Borderline":
      return {
        ring: "border-amber-500/40",
        badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        icon: <AlertTriangle className="w-5 h-5" />,
        desc: "Some values are slightly outside expected limits. Consult your physician.",
      };
    case "Critical":
      return {
        ring: "border-rose-500/40",
        badge: "bg-rose-500/10 text-rose-600 border-rose-500/30",
        icon: <AlertCircle className="w-5 h-5" />,
        desc: "Significant out-of-range values detected. Prompt medical review recommended.",
      };
    default:
      return {
        ring: "border-[var(--border)]",
        badge: "bg-[var(--surface-muted)] text-[var(--ink-muted)] border-[var(--border)]",
        icon: <FileQuestion className="w-5 h-5" />,
        desc: "No recognizable test values were found. Please try a clearer document.",
      };
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, count, colorClass, icon }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border ${colorClass} text-center flex-1 min-w-0`}
    >
      <div className="opacity-80">{icon}</div>
      <span className="font-mono text-2xl font-bold">{count}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params?.id;
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user && token && reportId) {
      getReport(reportId, token)
        .then((data) => setReport(data))
        .catch((err) => setError(err.message || "Failed to load report."))
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, token, reportId, router]);

  // Stat counts — derived from real results array
  const statCounts = useMemo(() => {
    if (!report?.results) return { Critical: 0, Borderline: 0, Normal: 0 };
    return report.results.reduce(
      (acc, r) => {
        const s = r.status;
        if (s in acc) acc[s]++;
        return acc;
      },
      { Critical: 0, Borderline: 0, Normal: 0 }
    );
  }, [report]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-sm text-[var(--ink-muted)]">Loading report analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 text-center">
          <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
            <AlertCircle className="w-12 h-12 text-[var(--warn)] mx-auto" />
            <h2 className="text-xl font-semibold">{error}</h2>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!report) return null;

  const isUnreadable = report.overall_status === "Unreadable";
  const overallCfg = getOverallConfig(report.overall_status);

  // File preview — derive type from file_url extension
  const fileExt = report.file_url?.split(".").pop()?.toLowerCase();
  const isPdf = fileExt === "pdf";
  const filePreviewUrl = report.file_url
    ? `${FLASK_BASE}${report.file_url}`
    : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
      <Navbar />

      {/* ── Top nav strip ─────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Reports
        </Link>

        <div className="flex items-center gap-2">
          {/* Overall status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${overallCfg.badge}`}
          >
            {overallCfg.icon}
            {report.overall_status}
          </span>
        </div>

        <Link
          href={`/chat?report=${reportId}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Ask AI about this
        </Link>
      </div>

      {/* ── Split-view body ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* ─── LEFT PANEL: File Preview (40%) ─────────────────────────────── */}
        <div
          className={`
            lg:w-[42%] shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border)]
            flex flex-col bg-[var(--surface-muted)] overflow-hidden
            ${previewCollapsed ? "h-14 lg:h-full" : "h-56 sm:h-72 lg:h-full"}
            transition-all duration-300
          `}
        >
          {/* Preview panel header (collapsible on mobile) */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)]">
              <FileText className="w-3.5 h-3.5" />
              <span>Document Preview</span>
            </div>
            <div className="flex items-center gap-2">
              {filePreviewUrl && (
                <a
                  href={filePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                className="lg:hidden p-1 text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
                onClick={() => setPreviewCollapsed((v) => !v)}
              >
                {previewCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Preview content */}
          {!previewCollapsed && (
            <div className="flex-1 overflow-hidden relative">
              {filePreviewUrl ? (
                isPdf ? (
                  <iframe
                    src={filePreviewUrl}
                    title="Report PDF Preview"
                    className="w-full h-full border-0"
                    style={{ minHeight: "100%" }}
                  />
                ) : (
                  <div className="w-full h-full overflow-auto flex items-start justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreviewUrl}
                      alt="Lab report scan"
                      className="max-w-full h-auto rounded-xl shadow-md border border-[var(--border)]"
                    />
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--ink-muted)] text-sm">
                  <div className="text-center space-y-2">
                    <FileText className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs">No preview available</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL: Summary results ───────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

            {/* Header row */}
            <div>
              <h1 className="font-display text-xl font-semibold text-[var(--ink)] leading-snug">
                Lab Report Analysis
              </h1>
              <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                Analyzed on {formatDate(report.uploaded_at)} •{" "}
                <span className="font-mono">{reportId.slice(0, 8)}</span>
              </p>
            </div>

            {/* Unreadable state */}
            {isUnreadable ? (
              <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
                <FileQuestion className="w-10 h-10 text-[var(--warn)] mx-auto" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="font-semibold text-sm text-[var(--ink)]">
                    No Recognizable Test Results Found
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                    We could not parse any clear clinical test names or values. Please
                    ensure the document is a readable lab report with clear text or good
                    photo quality.
                  </p>
                </div>
                <Link
                  href="/reports/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Link>
              </div>
            ) : (
              <>
                {/* Overall status description */}
                <div
                  className={`px-4 py-3 rounded-2xl border text-xs leading-relaxed ${overallCfg.badge}`}
                >
                  {overallCfg.desc}
                </div>

                {/* ── THREE STAT CARDS ──────────────────────────────────── */}
                <div className="flex gap-3">
                  <StatCard
                    label="Critical"
                    count={statCounts.Critical}
                    colorClass="bg-rose-500/5 text-rose-600 border-rose-500/20 dark:text-rose-400"
                    icon={<AlertCircle className="w-5 h-5" />}
                  />
                  <StatCard
                    label="Borderline"
                    count={statCounts.Borderline}
                    colorClass="bg-amber-500/5 text-amber-600 border-amber-500/20 dark:text-amber-400"
                    icon={<AlertTriangle className="w-5 h-5" />}
                  />
                  <StatCard
                    label="Normal"
                    count={statCounts.Normal}
                    colorClass="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                  />
                </div>

                {/* ── RESULTS TABLE ─────────────────────────────────────── */}
                <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
                  <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-muted)]">
                    <h2 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider font-mono">
                      Detected Biomarkers ({report.results?.length ?? 0})
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[var(--ink-muted)] font-mono uppercase tracking-wider border-b border-[var(--border)] bg-[var(--surface-muted)]/50">
                        <tr>
                          <th className="px-5 py-3">Test</th>
                          <th className="px-5 py-3">Value</th>
                          <th className="px-5 py-3 hidden sm:table-cell">Reference</th>
                          <th className="px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {report.results?.map((res, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-[var(--surface-muted)]/40 transition-colors"
                          >
                            <td className="px-5 py-3.5 font-semibold text-[var(--ink)] max-w-[140px]">
                              <span className="line-clamp-2">{res.test_name}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[var(--ink)] whitespace-nowrap">
                              {res.value}{" "}
                              <span className="text-[var(--ink-muted)]">{res.unit}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[var(--ink-muted)] whitespace-nowrap hidden sm:table-cell">
                              {res.normal_range}{" "}
                              <span className="text-[10px]">{res.unit}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getStatusPill(
                                  res.status
                                )}`}
                              >
                                {res.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!report.results || report.results.length === 0) && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-8 text-center text-[var(--ink-muted)] text-xs"
                            >
                              No matched biomarkers found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── UNMATCHED LINES (collapsed) ────────────────────────── */}
                {report.unmatched_lines && report.unmatched_lines.length > 0 && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    <button
                      onClick={() => setShowUnmatched((v) => !v)}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                    >
                      <span>
                        Other detected text ({report.unmatched_lines.length} lines)
                      </span>
                      {showUnmatched ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {showUnmatched && (
                      <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-muted)]/30 font-mono text-[11px] text-[var(--ink-muted)] space-y-1.5 max-h-48 overflow-y-auto">
                        {report.unmatched_lines.map((line, idx) => (
                          <p key={idx} className="truncate">
                            • {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sticky bottom CTA ───────────────────────────────────────── */}
          <div className="shrink-0 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
            <Link
              href="/reports"
              className="text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All reports
            </Link>

            <Link
              href={`/chat?report=${reportId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI about this report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
