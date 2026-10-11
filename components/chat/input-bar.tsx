"use client";

import React, { useRef } from "react";
import { Pill, ShieldCheck, Mic } from "lucide-react";
import { DEFAULT_SOURCES, PromptBar, PromptBarModel } from "@/components/ui/prompt-bar";
import { useVoiceInput, type VoiceLanguage } from "@/hooks/useVoiceInput";

interface InputBarProps {
  onSendMessage: (text: string, attachment?: File | null, voiceTranscribed?: boolean) => void;
  onOpenVoiceMode: () => void;
  onOpenMedicineAnalyzer: () => void;
  language: VoiceLanguage;
  isLoading?: boolean;
  className?: string;
}

export function InputBar({
  onSendMessage,
  onOpenVoiceMode,
  onOpenMedicineAnalyzer,
  language,
  isLoading = false,
  className = "sticky bottom-0 z-20 pb-4",
}: InputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);
  const { startListening, isListening, interimTranscript, error } = useVoiceInput(() => {});

  const handleAttach = (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = fileInputRef.current;
      if (!input) {
        resolve(null);
        return;
      }
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        if (file) {
          pendingFileRef.current = file;
          resolve(file);
        } else {
          resolve(null);
        }
        target.value = "";
      };
      input.click();
    });
  };

  const handleDictate = (signal: AbortSignal, onInterim?: (text: string) => void) =>
    startListening(language, signal, onInterim);

  const handleSend = (
    text: string,
    options: { attachments: any[]; model: PromptBarModel; effort: string; voiceTranscribed: boolean }
  ) => {
    // Check if an attachment was passed
    const file =
      options.attachments.find((item) => item instanceof File) ||
      pendingFileRef.current ||
      null;

    pendingFileRef.current = null;
    onSendMessage(text, file, options.voiceTranscribed);
  };

  return (
    <div
      className={`w-full max-w-3xl mx-auto px-4 pb-[env(safe-area-inset-bottom)] flex flex-col items-center justify-center pointer-events-none gap-2 ${className}`}
    >
      {/* Hidden file input for native file dialog integration */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
        aria-hidden="true"
      />

      <div className="w-full pointer-events-auto flex flex-col items-center gap-2">
        <PromptBar
          sources={[
            ...DEFAULT_SOURCES,
            {
              key: "medicine-analyzer",
              name: "Medicine Analyzer",
              description: "Identify a medicine from an image",
              icon: <Pill className="h-4 w-4" />,
            },
          ]}
          placeholder="Ask about symptoms, medications, or attach lab reports..."
          busy={isLoading}
          onSend={handleSend}
          onAttach={handleAttach}
          onMedicineAnalyzer={onOpenMedicineAnalyzer}
          onDictate={handleDictate}
          background="var(--bg-secondary, #0A0E1A)"
          color="var(--text-primary, #F5F5F7)"
          menuBackground="rgba(15, 23, 42, 0.94)"
          sparkColor="#5B9CFF"
          sparkBoost={1.2}
          width="100%"
          radius={20}
          maxRows={5}
          morphDuration={240}
          squash={0.12}
          tilt={8}
          pressScale={0.96}
          className="w-full shadow-2xl"
        />
        {(isListening || interimTranscript || error) && (
          <p aria-live="polite" className="w-full px-3 text-xs text-[var(--ink-muted)]">
            {error || interimTranscript || "Listening…"}
          </p>
        )}

        {/* Quick Voice Mode & Medical Disclaimer Bar */}
        <div className="w-full flex items-center justify-between text-[11px] text-[var(--ink-muted)] px-2 font-mono">
          <p className="flex items-center gap-1.5 opacity-80">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>AI guidance only. Not a medical diagnosis. Consult a physician for emergencies.</span>
          </p>

          <button
            type="button"
            onClick={onOpenVoiceMode}
            className="flex items-center gap-1 text-[var(--accent-blue-glow)] hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded-full hover:bg-[var(--accent-soft)] shrink-0"
            title="Open Fullscreen Interactive Voice Mode"
          >
            <Mic className="w-3 h-3" />
            <span className="hidden sm:inline">Voice Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default InputBar;
