"use client";

import React, { useState, useRef } from "react";
import {
  Paperclip,
  Mic,
  Send,
  X,
  FileText,
  ShieldCheck,
  Volume2,
} from "lucide-react";

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
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  // Keep reference to the real File object so it can be sent to the backend
  const attachedFileRef = useRef<File | null>(null);
  const [isListeningLocal, setIsListeningLocal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !attachedFile) || isLoading) return;

    // Pass the real File object so the parent can send it to the backend
    onSendMessage(text.trim(), attachedFileRef.current);
    setText("");
    setAttachedFile(null);
    attachedFileRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the real File object for sending to backend
      attachedFileRef.current = file;
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type.includes("pdf") ? "PDF Lab Document" : "Medical Image",
      });
    }
  };

  const toggleLocalMic = () => {
    if (!isListeningLocal) {
      setIsListeningLocal(true);
      // Simulate speech recognition filling text
      setTimeout(() => {
        setText("What are the side effects of taking Metformin with meals?");
        setIsListeningLocal(false);
      }, 2500);
    } else {
      setIsListeningLocal(false);
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center pointer-events-none gap-2 ${className}`}>
      {/* Container Card */}
      <div className="w-full pointer-events-auto flex flex-col gap-2 relative rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-2.5 transition-all focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
        {/* Attached File Preview Tag */}
        {attachedFile && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] inline-flex items-center gap-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="font-medium text-[var(--ink)] truncate max-w-[200px]">
              {attachedFile.name}
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">
              ({attachedFile.size})
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-0.5 hover:bg-[var(--surface)] rounded-full text-[var(--ink-muted)] hover:text-red-500"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Listening Speech Visualizer Overlay */}
        {isListeningLocal && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-2 font-medium">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>Listening to voice...Speak now</span>
            </div>
            <button
              onClick={() => setIsListeningLocal(false)}
              className="text-[11px] underline"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* File Attachment Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
          />

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-muted)] active:scale-95 transition-all focus-ring"
            title="Attach lab report or prescription (PDF, Image)"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about symptoms, medicines, or upload lab reports..."
            rows={1}
            className="flex-1 bg-transparent text-[var(--ink)] placeholder-[var(--ink-muted)] text-xs sm:text-sm py-2 px-1 focus:outline-none resize-none max-h-28 overflow-y-auto"
          />

          {/* Mic / Voice Button */}
          <button
            type="button"
            onClick={toggleLocalMic}
            onDoubleClick={onOpenVoiceMode}
            className={`p-2.5 rounded-full active:scale-95 transition-all focus-ring ${
              isListeningLocal
                ? "bg-red-500 text-white animate-pulse"
                : "text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-muted)]"
            }`}
            title="Click to dictate, Double-click for Fullscreen Voice Mode"
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!text.trim() && !attachedFile) || isLoading}
            className={`p-2.5 rounded-full transition-all focus-ring ${
              text.trim() || attachedFile
                ? "bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 shadow-xs"
                : "bg-[var(--surface-muted)] text-[var(--ink-muted)] cursor-not-allowed opacity-50"
            }`}
            title="Send message"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Persistent Quiet Disclaimer */}
      <p className="text-center text-[11px] text-[var(--ink-muted)] mt-2 font-mono flex items-center justify-center gap-1 opacity-80">
        <ShieldCheck className="w-3 h-3 text-[var(--accent)] inline" />
        AI guidance only. Not a medical diagnosis. Consult a physician for emergencies.
      </p>
    </div>
  );
}
