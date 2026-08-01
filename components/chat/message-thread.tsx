"use client";

import React from "react";
import { BreathOrb } from "@/components/ui/breath-orb";
import { MedicineCard, MedicineDetails } from "./cards/medicine-card";
import { LabCard, LabReportData } from "./cards/lab-card";
import { PrescriptionCard, PrescriptionData } from "./cards/prescription-card";
import { EmergencyCard } from "./cards/emergency-card";
import { User, Copy, Check, Sparkles } from "lucide-react";

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  cardType?: "medicine" | "lab" | "prescription" | "emergency";
  cardData?: MedicineDetails | LabReportData | PrescriptionData | { message?: string; redFlagSymptoms?: string[] };
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
            className={`flex items-start gap-3 text-xs sm:text-sm ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--ink-muted)] shrink-0">
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
                <div className="inline-block px-4 py-3 rounded-2xl bg-[var(--accent)] text-white text-xs sm:text-sm shadow-xs font-normal leading-relaxed text-left">
                  {msg.text}
                </div>
              ) : (
                <div className="group relative bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-xs leading-relaxed text-[var(--ink)] space-y-2">
                  <p className="whitespace-pre-line">{msg.text}</p>

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
                        msg.cardData?.message ||
                        "Severe chest pain requires immediate emergency evaluation. Please dial emergency services right now."
                      }
                      redFlagSymptoms={msg.cardData?.redFlagSymptoms}
                    />
                  )}

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/40 text-[11px] text-[var(--ink-muted)]">
                    <span className="font-mono text-[10px]">{msg.timestamp}</span>

                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="flex items-center gap-1 opacity-70 hover:opacity-100 hover:text-[var(--accent)] transition-opacity"
                      title="Copy response text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
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
              )}
            </div>
          </div>
        );
      })}

      {/* Generating Indicator */}
      {isGenerating && (
        <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
          <BreathOrb size="sm" mode="thinking" />
          <div className="flex items-center gap-1 font-medium animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Analyzing health records & phrasing response...</span>
          </div>
        </div>
      )}
    </div>
  );
}
