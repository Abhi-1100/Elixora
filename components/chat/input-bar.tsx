"use client";

import React, { useRef } from "react";
import { ShieldCheck, Sparkles, Mic } from "lucide-react";
import { PromptBar, PromptBarModel } from "@/components/ui/prompt-bar";

interface InputBarProps {
  onSendMessage: (text: string, attachment?: File | null) => void;
  onOpenVoiceMode: () => void;
  isLoading?: boolean;
  className?: string;
}

export function InputBar({
  onSendMessage,
  onOpenVoiceMode,
  isLoading = false,
  className = "sticky bottom-0 z-20 pb-4",
}: InputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

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

  const handleDictate = (): Promise<string> => {
    return new Promise((resolve) => {
      const SpeechRecognition =
        typeof window !== "undefined"
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (!SpeechRecognition) {
        onOpenVoiceMode();
        resolve("");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() || "";
        resolve(transcript);
      };

      recognition.onerror = () => {
        resolve("");
      };

      recognition.onend = () => {
        resolve("");
      };

      try {
        recognition.start();
      } catch {
        resolve("");
      }
    });
  };

  const handleSend = (
    text: string,
    options: { attachments: any[]; model: PromptBarModel; effort: string }
  ) => {
    // Check if an attachment was passed
    const file =
      options.attachments.find((item) => item instanceof File) ||
      pendingFileRef.current ||
      null;

    pendingFileRef.current = null;
    onSendMessage(text, file);
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
          placeholder="Ask about symptoms, medications, or attach lab reports..."
          busy={isLoading}
          onSend={handleSend}
          onAttach={handleAttach}
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
