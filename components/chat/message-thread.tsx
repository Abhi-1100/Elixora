"use client";

import React from "react";
import { BreathOrb } from "@/components/ui/breath-orb";
import { BorderGlow } from "@/components/ui/border-glow";
import { MedicineCard, MedicineDetails } from "./cards/medicine-card";
import { LabCard, LabReportData } from "./cards/lab-card";
import { PrescriptionCard, PrescriptionData } from "./cards/prescription-card";
import { EmergencyCard } from "./cards/emergency-card";
import { User, Copy, Check, Sparkles, ExternalLink, FileText, Paperclip, FileCode } from "lucide-react";
import Link from "next/link";

export interface MessageAttachment {
  name: string;
  size?: string;
  type?: string;
  url?: string;
  fileType?: "pdf" | "image" | "doc";
}

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  attachment?: MessageAttachment;
  cardType?: "medicine" | "lab" | "prescription" | "emergency";
  cardData?: MedicineDetails | LabReportData | PrescriptionData | { message?: string; redFlagSymptoms?: string[] };
  /** When set, a 'View full report' button linking to this URL is shown in the AI bubble */
  reportLink?: string;
}

interface MessageThreadProps {
  messages: Message[];
  isGenerating?: boolean;
}

export function MessageThread({ messages, isGenerating = false }: MessageThreadProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 w-full max-w-3xl mx-auto">
      {messages.map((msg) => {
        const isUser = msg.sender === "user";

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 text-xs sm:text-sm animate-fade-in ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-muted)] shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            ) : (
              <div className="shrink-0 mt-0.5">
                <BreathOrb size="sm" mode="idle" />
              </div>
            )}

            {/* Content Body */}
            <div className={`space-y-2 max-w-[85%] sm:max-w-[80%] ${isUser ? "text-right" : "text-left"}`}>
              {/* User Bubble or AI Plain Text */}
              {isUser ? (
                <div className="inline-flex flex-col gap-2 items-end">
                  {msg.attachment && (
                    <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs max-w-xs text-left shadow-sm flex items-center gap-3">
                      {msg.attachment.fileType === "image" && msg.attachment.url ? (
                        <img
                          src={msg.attachment.url}
                          alt={msg.attachment.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/30 shrink-0"
                        />
                      ) : msg.attachment.fileType === "pdf" ? (
                        <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 flex items-center justify-center shrink-0">
                          <Paperclip className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate text-xs">{msg.attachment.name}</p>
                        <p className="text-[10px] text-white/80 font-mono">
                          {msg.attachment.type || "Document"} {msg.attachment.size ? `• ${msg.attachment.size}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {msg.text && (
                    <div className="inline-block px-4 py-3 rounded-2xl bg-[var(--accent)] text-white text-xs sm:text-sm shadow-xs font-normal leading-relaxed text-left">
                      {msg.text}
                    </div>
                  )}
                </div>
              ) : (
                <BorderGlow
                  edgeSensitivity={30}
                  glowColor="217 91 60"
                  backgroundColor="#0A0E1A"
                  borderRadius={16}
                  glowRadius={30}
                  glowIntensity={1.0}
                  coneSpread={25}
                  animated={false}
                  colors={["#3b82f6", "#60a5fa", "#1d4ed8"]}
                  className="w-full"
                >
                  <div className="group relative p-4 sm:p-5 leading-relaxed text-[var(--ink)] space-y-3">
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {/* Render Specialized Cards if present */}
                    {msg.cardType === "medicine" && msg.cardData && (
                      <MedicineCard data={msg.cardData as MedicineDetails} />
                    )}

                    {msg.cardType === "lab" && msg.cardData && (
                      <LabCard data={msg.cardData as LabReportData} />
                    )}

                    {msg.cardType === "prescription" && msg.cardData && (
                      <PrescriptionCard data={msg.cardData as PrescriptionData} />
                    )}

                    {msg.cardType === "emergency" && (
                      <EmergencyCard
                        message={
                          (msg.cardData as any)?.message ||
                          "Severe chest pain requires immediate emergency evaluation. Please dial emergency services right now."
                        }
                        redFlagSymptoms={(msg.cardData as any)?.redFlagSymptoms}
                      />
                    )}

                    {/* Report link button — shown when a file was analyzed */}
                    {msg.reportLink && (
                      <Link
                        href={msg.reportLink}
                        className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm focus-ring"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View full report
                      </Link>
                    )}

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)]/60 text-[11px] text-[var(--ink-muted)]">
                      <span className="font-mono text-[10px]">{msg.timestamp}</span>

                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1.5 opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-opacity focus-ring rounded-md px-1.5 py-0.5"
                        title="Copy response text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </BorderGlow>
              )}
            </div>
          </div>
        );
      })}

      {/* Generating Skeleton Loader Indicator */}
      {isGenerating && (
        <div className="flex items-start gap-3.5 text-xs text-[var(--ink-muted)] animate-fade-in">
          <div className="shrink-0 mt-0.5">
            <BreathOrb size="sm" mode="thinking" />
          </div>
          <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-xs w-full max-w-[75%] space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing clinical reference response...</span>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3.5 skeleton-shimmer rounded-md w-11/12" />
              <div className="h-3.5 skeleton-shimmer rounded-md w-4/5" />
              <div className="h-3.5 skeleton-shimmer rounded-md w-2/3" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
