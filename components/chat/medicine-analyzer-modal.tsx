"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Pill, X } from "lucide-react";
import { analyzeMedicineImage } from "@/lib/api";

interface MedicineAnalysis {
  status: "identified" | "uncertain";
  medicine?: string | null;
  identification_source?: "ocr" | "model" | null;
  ocr_match_score?: number;
  model_confidence?: number;
  message?: string;
  medicine_info?: {
    medicineName?: string;
    dosageForm?: string;
    commonUses?: string;
    foodInstructions?: string;
    ageInformation?: string;
    doseInformation?: string;
  } | null;
}

interface MedicineAnalyzerModalProps {
  token: string | null;
  onClose: () => void;
}

const INFO_FIELDS: { key: keyof NonNullable<MedicineAnalysis["medicine_info"]>; label: string }[] = [
  { key: "dosageForm", label: "Dosage form" },
  { key: "commonUses", label: "Common uses" },
  { key: "foodInstructions", label: "Food instructions" },
  { key: "ageInformation", label: "Age information" },
  { key: "doseInformation", label: "Dose information" },
];

export function MedicineAnalyzerModal({ token, onClose }: MedicineAnalyzerModalProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<MedicineAnalysis | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chooseImage = (file?: File) => {
    setImage(file ?? null);
    setResult(null);
    setError("");
  };

  const analyze = async () => {
    if (!image) {
      setError("Choose or capture a medicine image first.");
      return;
    }
    if (!token) {
      setError("Your session has expired. Sign in again to analyze an image.");
      return;
    }

    const formData = new FormData();
    formData.append("file", image);
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await analyzeMedicineImage(formData, token);
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Medicine analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const info = result?.medicine_info;
  const confidence = result?.identification_source === "ocr"
    ? (typeof result.ocr_match_score === "number" ? `OCR match ${result.ocr_match_score.toFixed(1)}%` : "OCR match")
    : result?.identification_source === "model" && typeof result.model_confidence === "number"
      ? `Image model ${(result.model_confidence * 100).toFixed(1)}%`
      : "Not available";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isLoading) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="medicine-analyzer-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]"><Pill className="h-4 w-4" /></span>
            <div>
              <h2 id="medicine-analyzer-title" className="text-base font-semibold">Medicine Analyzer</h2>
              <p className="text-xs text-[var(--ink-muted)]">Image-based identification and reference information</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isLoading} aria-label="Close Medicine Analyzer" className="rounded-md p-2 text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] disabled:opacity-50"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-4 p-5">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              chooseImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex min-h-36 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
          >
            <ImagePlus className="h-7 w-7 text-[var(--accent)]" />
            <span className="max-w-full truncate">{image?.name || "Choose or capture a medicine image"}</span>
            <span className="text-xs">JPG, PNG, WEBP, BMP, or TIFF ? up to 10 MB</span>
          </button>

          <div className="flex justify-end">
            <button type="button" onClick={analyze} disabled={!image || isLoading} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing</> : <><Pill className="h-4 w-4" /> Analyze image</>}
            </button>
          </div>

          {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-[var(--warn)]/30 bg-[var(--warn-soft)] p-3 text-sm text-[var(--ink)]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" /><span>{error}</span></div>}

          {result?.status === "uncertain" && <div role="status" className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-muted)]" /><div><p className="font-medium">Medicine could not be confidently identified</p><p className="mt-1 text-[var(--ink-muted)]">Confidence: insufficient for identification</p><p className="mt-1 text-[var(--ink-muted)]">{result.message || "Try a clearer image showing the medicine name."}</p></div></div>}

          {result?.status === "identified" && <div role="status" className="space-y-4 border-t border-[var(--border)] pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                <div>
                  <p className="text-xs text-[var(--ink-muted)]">Medicine name</p>
                  <h3 className="text-lg font-semibold">{info?.medicineName || result.medicine || "Name unavailable"}</h3>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-[var(--ink-muted)]">Confidence</p>
                <p className="text-sm font-medium">{confidence}</p>
              </div>
            </div>

            {INFO_FIELDS.map(({ key, label }) => <div key={key} className="border-t border-[var(--border)] pt-3">
              <h4 className="mb-1 text-xs font-semibold uppercase text-[var(--ink-muted)]">{label}</h4>
              <p className="text-sm leading-relaxed">{info?.[key] || "Not available in the verified medicine information."}</p>
            </div>)}
          </div>}
        </div>
      </section>
    </div>
  );
}