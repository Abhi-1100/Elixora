"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { listReports } from "@/lib/api";
import { Navbar } from "@/components/ui/navbar";
import { SkeletonList } from "@/components/ui/skeleton";
import { StateCard } from "@/components/ui/state-card";
import {
  FileText,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileQuestion,
} from "lucide-react";
import Link from "next/link";

interface ReportSummary {
  id: string;
  overall_status: string;
  uploaded_at: string;
  [key: string]: any;
}

export default function ReportsHistoryPage() {
  const { user, token, loading: authLoading } = useAuth() as {
    user: any;
    token: string | null;
    loading: boolean;
  };
  const router = useRouter();

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && token) {
      listReports(token)
        .then((data: { reports?: ReportSummary[] }) => setReports(data.reports || []))
        .catch((err: Error) => setError(err.message || "Failed to load reports history."))
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, token, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 space-y-8 animate-fade-in">
          <div className="space-y-2">
            <div className="h-8 skeleton-shimmer rounded-xl w-64" />
            <div className="h-4 skeleton-shimmer rounded-lg w-96" />
          </div>
          <SkeletonList count={4} />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const getStatusBadge = (status: string) => {
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

  const formatDate = (isoString: string) => {
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
    <div className="page-shell flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="page-container flex-1 py-8 sm:py-10 space-y-7 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="clinical-eyebrow">Clinical records</p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] mt-1">
              Lab reports
            </h1>
            <p className="text-sm text-[var(--ink-muted)] mt-0.5">
              View and track all your uploaded medical test reports.
            </p>
          </div>

          <Link
            href="/reports/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 clinical-button text-xs shrink-0 self-start sm:self-auto focus-ring"
          >
            <Plus className="w-4 h-4" />
            Upload New Report
          </Link>
        </div>

        {error && (
          <StateCard
            type="error"
            title="Unable to load reports history"
            description={error}
            actionLabel="Try Again"
            onAction={() => window.location.reload()}
          />
        )}

        {!error && reports.length === 0 ? (
          <StateCard
            type="empty"
            icon={FileText}
            title="No Lab Reports Uploaded Yet"
            description="Upload your blood test or clinical PDF scans to see AI analysis and tracking history here."
            actionLabel="Upload First Report"
            actionHref="/reports/upload"
          />
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const badge = getStatusBadge(r.overall_status);
              return (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="group flex items-center justify-between p-5 rounded-xl clinical-card hover:border-[var(--accent)] transition-all focus-ring"
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
