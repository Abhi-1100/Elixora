"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { uploadReport } from "@/lib/api";
import { Navbar } from "@/components/ui/navbar";
import { UploadCloud, FileText, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReportUploadPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] transition-colors duration-200">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  function handleFileSelect(selectedFile) {
    setError("");
    if (!selectedFile) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(selectedFile.type)) {
      setError("Please select a valid PDF, JPG, or PNG file.");
      return;
    }

    setFile(selectedFile);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please select a report file to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await uploadReport(formData, token);
      if (data.report_id) {
        router.push(`/reports/${data.report_id}`);
      } else {
        throw new Error("No report ID returned.");
      }
    } catch (err) {
      setError(err.message || "Failed to analyze report. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--accent)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reports History
        </Link>

        <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-xl p-8 transition-colors duration-200">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-semibold text-[var(--ink)] mb-1.5">
              Upload Lab Report
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Upload your blood test or clinical report (PDF, JPG, or PNG) for instant AI extraction and reference analysis.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 text-sm text-[var(--warn)] bg-[var(--warn-soft)] border border-[var(--warn)]/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {uploading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin" />
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-[var(--ink)]">
                  Analyzing your report...
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Extracting biomarkers, matching reference ranges, and evaluating clinical statuses.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  dragActive
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]/50 scale-[0.99]"
                    : file
                    ? "border-[var(--accent)] bg-[var(--surface-muted)]"
                    : "border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface-muted)]/50"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-[var(--ink)] max-w-xs truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Click to browse or drag and drop report
                      </p>
                      <p className="text-xs text-[var(--ink-muted)]">
                        Supports PDF documents, JPG or PNG scan images up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file}
                className="w-full bg-[var(--accent)] text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Submit for Analysis
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
