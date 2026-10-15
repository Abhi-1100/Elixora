"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Baby,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Loader2,
  Maximize2,
  Pill,
  ShieldAlert,
  Sparkles,
  Utensils,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { analyzeMedicineImage } from "@/lib/api";

interface MedicineAnalysis {
  status: "identified" | "uncertain";
  medicine?: string | null;
  identification_source?: "ocr" | "model" | "gemini" | null;
  ocr_match_score?: number;
  model_confidence?: number;
  gemini_status?: string;
  message?: string;
  candidates?: MedicineCandidate[];
  side_effects?: string | string[];
  medicine_info?: {
    medicineName?: string;
    activeIngredients?: string[];
    strength?: string | null;
    reference?: string;
    dosageForm?: string;
    commonUses?: string;
    foodInstructions?: string;
    ageInformation?: string;
    doseInformation?: string;
    sideEffects?: string | string[];
    side_effects?: string | string[];
  } | null;
}

interface MedicineCandidate {
  medicine: string;
  confidence?: number;
  score?: number;
  source?: "ocr" | "model" | "gemini";
  evidence?: string;
  medicine_info?: MedicineAnalysis["medicine_info"];
}

interface MedicineAnalyzerModalProps {
  token: string | null;
  onClose: () => void;
}

function formatSideEffects(value?: string | string[]) {
  if (Array.isArray(value)) return value.filter(Boolean).join(" · ");
  return value?.trim() || "";
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Pill;
  label: string;
  value?: string;
}) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/65 p-3.5">
      <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
        <Icon className="h-4 w-4 shrink-0" />
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          {label}
        </h4>
      </div>
      <p className="whitespace-pre-line break-words text-sm leading-relaxed text-[var(--ink)]">
        {value || "Not available in the analysis."}
      </p>
    </article>
  );
}

export function MedicineAnalyzerModal({ token, onClose }: MedicineAnalyzerModalProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<MedicineAnalysis | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<MedicineCandidate | null>(null);
  const [confirmedCandidate, setConfirmedCandidate] = useState<MedicineCandidate | null>(null);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const chooseImage = (file?: File) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setPreviewUrl(previewUrlRef.current);
    setImageZoom(1);
    setImage(file ?? null);
    setResult(null);
    setError("");
    setSelectedCandidate(null);
    setConfirmedCandidate(null);
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
    setSelectedCandidate(null);
    setConfirmedCandidate(null);
    try {
      const data = await analyzeMedicineImage(formData, token);
      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Medicine analysis failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const info = result?.status === "identified"
    ? result.medicine_info
    : confirmedCandidate?.medicine_info;
  const confidence = result?.identification_source === "ocr"
    ? (typeof result.ocr_match_score === "number" ? `OCR match ${result.ocr_match_score.toFixed(1)}%` : "OCR match")
      : result?.identification_source === "model" && typeof result.model_confidence === "number"
      ? `Image model ${(result.model_confidence * 100).toFixed(1)}%`
      : result?.identification_source === "gemini"
        ? "Gemini · dataset verified"
      : "Not available";
  const sideEffects = formatSideEffects(
    info?.sideEffects ?? info?.side_effects ?? result?.side_effects
  );
  const geminiFallbackMessage = result?.gemini_status && result.gemini_status !== "ok"
    ? result.gemini_status === "invalid_key" || result.gemini_status === "not_configured"
      ? "Gemini label reading is unavailable because its server configuration needs attention. Showing existing analyzer results."
      : result.gemini_status === "rate_limited"
        ? "Gemini is temporarily rate-limited. Showing existing analyzer results."
        : result.gemini_status === "timeout"
          ? "Gemini label reading timed out. Showing existing analyzer results."
          : result.gemini_status === "unsupported_image"
            ? "Gemini does not support this image format. Showing existing analyzer results."
            : "Gemini is temporarily unavailable. Showing existing analyzer results."
    : null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="medicine-analyzer-title"
        className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Pill className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="medicine-analyzer-title" className="text-base font-semibold sm:text-lg">
                Medicine Analyzer
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Image identification and medicine reference
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close Medicine Analyzer"
            className="rounded-lg p-2 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
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

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={isLoading}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span className="max-w-[min(58vw,460px)] truncate">
                  {image?.name || "Choose or capture a medicine image"}
                </span>
              </button>
              <p className="mt-1.5 pl-1 text-[11px] text-[var(--ink-muted)]">
                JPG, PNG, WEBP, BMP, TIFF, GIF, HEIC, HEIF, or AVIF · up to 10 MB
              </p>
            </div>
            <button
              type="button"
              onClick={analyze}
              disabled={!image || isLoading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze image
                </>
              )}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-[var(--warn)]/30 bg-[var(--warn-soft)] p-3.5 text-sm text-[var(--ink)]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className={`grid items-stretch gap-4 lg:gap-5 ${image ? "lg:grid-cols-2" : ""}`}>
            {image && (
              <section aria-label="Medicine image preview" className="min-w-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                    Uploaded image
                  </h3>
                  <span className="text-[11px] text-[var(--ink-muted)]">{Math.round(imageZoom * 100)}%</span>
                </div>
                <div className={`relative flex h-[min(40vh,460px)] min-h-[240px] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-4 sm:h-[min(50vh,540px)] lg:h-[min(62vh,640px)] ${imageZoom > 1 ? "items-start justify-start" : "items-center justify-center"}`}>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Uploaded medicine package or label"
                      className="max-h-full max-w-full rounded-lg object-contain shadow-md transition-transform duration-150"
                      style={{ transform: `scale(${imageZoom})`, transformOrigin: imageZoom > 1 ? "top left" : "center" }}
                    />
                  )}
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 p-1 shadow-lg backdrop-blur">
                    <button
                      type="button"
                      onClick={() => setImageZoom((zoom) => Math.max(0.5, +(zoom - 0.25).toFixed(2)))}
                      disabled={imageZoom <= 0.5}
                      aria-label="Zoom out"
                      title="Zoom out"
                      className="rounded-lg p-2 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageZoom(1)}
                      aria-label="Fit to image"
                      title="Fit to image"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--accent)]"
                    >
                      <Maximize2 className="h-4 w-4" />
                      <span>Fit to Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageZoom((zoom) => Math.min(3, +(zoom + 0.25).toFixed(2)))}
                      disabled={imageZoom >= 3}
                      aria-label="Zoom in"
                      title="Zoom in"
                      className="rounded-lg p-2 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section aria-label="Medicine analysis results" className="min-w-0 space-y-3 lg:min-h-[min(62vh,640px)]">
              {isLoading && (
                <div role="status" aria-live="polite" className="flex h-full min-h-60 flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/45 p-6 text-center">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </span>
                  <h3 className="font-semibold">Analyzing medicine image</h3>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-[var(--ink-muted)]">
                    Reading the label and preparing available medicine information…
                  </p>
                </div>
              )}

              {!isLoading && result?.status === "uncertain" && !confirmedCandidate && (
                <div role="status" className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/55 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] text-[var(--ink-muted)]">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold">Medicine not confidently identified</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                        {result.message || "Try a clearer photo with the medicine name and label in focus."}
                      </p>
                      {geminiFallbackMessage && (
                        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">{geminiFallbackMessage}</p>
                      )}
                    </div>
                  </div>
                  {!!result.candidates?.length && (
                    <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                        Possible matches · confirm against the package
                      </p>
                      {result.candidates.slice(0, 5).map((candidate) => (
                        <button
                          key={`${candidate.medicine}-${candidate.source}`}
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setConfirmedCandidate(null);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${selectedCandidate?.medicine === candidate.medicine ? "border-[var(--accent)] bg-[var(--accent-soft)]/60" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/60"}`}
                        >
                          <span className="min-w-0">
                            <span className="block break-words text-sm font-medium text-[var(--ink)]">{candidate.medicine}</span>
                            <span className="mt-0.5 block text-[10px] text-[var(--ink-muted)]">
                              {candidate.source === "ocr"
                                ? "OCR name match · confirm on package"
                                : candidate.source === "gemini"
                                  ? "Package name read · not verified in reference data"
                                  : "Unverified image model suggestion"}
                            </span>
                          </span>
                          {candidate.source === "ocr" && typeof candidate.score === "number" ? (
                            <span className="shrink-0 font-mono text-[10px] text-[var(--ink-muted)]">
                              {Math.round(candidate.score * 100)}% match
                            </span>
                          ) : typeof candidate.confidence === "number" ? (
                            <span className="shrink-0 font-mono text-[10px] text-[var(--ink-muted)]">
                              {Math.round(candidate.confidence * 100)}% model
                            </span>
                          ) : null}
                        </button>
                      ))}
                      {selectedCandidate && !confirmedCandidate && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--bg)]/60 p-3">
                          <p className="min-w-0 flex-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                            Check the name and active ingredients on your package before confirming.
                          </p>
                          <button
                            type="button"
                            onClick={() => setConfirmedCandidate(selectedCandidate)}
                            className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white hover:brightness-105"
                          >
                            Confirm match
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isLoading && (result?.status === "identified" || confirmedCandidate) && (
                <div role="status" className="space-y-3">
                  {geminiFallbackMessage && !confirmedCandidate && (
                    <p role="status" className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                      {geminiFallbackMessage}
                    </p>
                  )}
                  <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)]/45 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                            {confirmedCandidate ? "Your confirmed match" : "Identified medicine"}
                          </p>
                          <h3 className="mt-1 break-words text-lg font-semibold leading-snug">
                            {info?.medicineName || confirmedCandidate?.medicine || result?.medicine || "Name unavailable"}
                          </h3>
                          {info?.dosageForm && (
                            <p className="mt-1 text-sm text-[var(--ink-muted)]">{info.dosageForm}</p>
                          )}
                        </div>
                      </div>
                      {!confirmedCandidate && (
                        <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--ink-muted)]">
                          {confidence}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {info?.activeIngredients?.length ? (
                      <InfoCard icon={Pill} label="Active ingredients · package label" value={info.activeIngredients.join(", ")} />
                    ) : null}
                    <InfoCard icon={Pill} label="Common uses" value={info?.commonUses} />
                    <InfoCard icon={Clock3} label="Dosage guidance" value={info?.doseInformation} />
                    <InfoCard icon={Baby} label="Age guidance" value={info?.ageInformation} />
                    <InfoCard icon={Utensils} label="Food instructions" value={info?.foodInstructions} />
                    <InfoCard
                      icon={ShieldAlert}
                      label="Side effects"
                      value={sideEffects || "Side-effect information was not supplied for this match."}
                    />
                  </div>
                  {info?.reference && (
                    <p className="px-1 text-[11px] text-[var(--ink-muted)]">Verified reference: {info.reference}</p>
                  )}
                  <p className="px-1 text-[11px] leading-relaxed text-[var(--ink-muted)]">
                    Reference information only. Follow the medicine label and advice from a qualified clinician.
                  </p>
                </div>
              )}

              {!isLoading && !result && !error && (
                <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/35 p-6 text-center">
                  <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    {image ? <Sparkles className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
                  </span>
                  <h3 className="text-sm font-semibold">
                    {image ? "Ready to analyze" : "Add a medicine photo"}
                  </h3>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-[var(--ink-muted)]">
                    {image
                      ? "Review the image, then analyze it to see the available medicine details."
                      : "Choose a clear photo of the medicine package or label to get started."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
