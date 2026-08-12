"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { listReports } from "@/lib/api";
import { Navbar } from "@/components/ui/navbar";
import {
  FileText,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileQuestion,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function ReportsHistoryPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && token) {
      listReports(token)
        .then((data) => setReports(data.reports || []))
        .catch((err) => setError(err.message || "Failed to load reports history."))
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, token, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
          <p className="text-sm text-[var(--ink-muted)]">Loading reports history...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Normal":
        return {
          pill: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "Borderline":
        return {
          pill: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "Critical":
        return {
          pill: "bg-rose-500/10 text-rose-600 border-rose-500/20",
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          pill: "bg-[var(--surface-muted)] text-[var(--ink-muted)] border-[var(--border)]",
          icon: <FileQuestion className="w-3.5 h-3.5" />,
        };
    }
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">
              Lab Reports History
            </h1>
            <p className="text-sm text-[var(--ink-muted)] mt-0.5">
              View and track all your uploaded medical test reports.
            </p>
          </div>

          <Link
            href="/reports/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-md shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Upload New Report
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[var(--warn-soft)] text-[var(--warn)] text-sm border border-[var(--warn)]/20">
            {error}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
            <FileText className="w-12 h-12 text-[var(--ink-muted)] mx-auto opacity-50" />
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-[var(--ink)]">
                No Lab Reports Uploaded Yet
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                Upload your blood tests or lab PDF scans to see AI analysis and history here.
              </p>
            </div>
            <Link
              href="/reports/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Upload First Report
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const badge = getStatusBadge(r.overall_status);
              return (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--ink)] truncate">
                        Lab Report ({r.id.slice(0, 8)})
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Uploaded on {formatDate(r.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${badge.pill}`}>
                      {badge.icon}
                      <span>{r.overall_status || "Unknown"}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
