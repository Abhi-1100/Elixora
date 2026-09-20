"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Mic,
  Send,
  X,
  FileText,
  ShieldCheck,
  Volume2,
  FileImage,
  FileCode,
} from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

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
    fileType: "pdf" | "image" | "doc";
    previewUrl?: string;
  } | null>(null);
  // Keep reference to the real File object so it can be sent to the backend
  const attachedFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isListening: isListeningLocal, startListening, stopListening } = useVoiceInput((transcript) => {
    setText(transcript);
  });

  // Auto-expand textarea based on scrollHeight (ChatGPT & Claude style)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [text]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !attachedFile) || isLoading) return;

    // Pass the real File object so the parent can send it to the backend
    onSendMessage(text.trim(), attachedFileRef.current);
    setText("");
    if (attachedFile?.previewUrl) {
      URL.revokeObjectURL(attachedFile.previewUrl);
    }
    setAttachedFile(null);
    attachedFileRef.current = null;
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
      const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
      const isImg = file.type.startsWith("image/");
      const fileKind: "pdf" | "image" | "doc" = isPdf ? "pdf" : isImg ? "image" : "doc";

      let prevUrl: string | undefined;
      if (isImg) {
        prevUrl = URL.createObjectURL(file);
      }

      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: isPdf ? "PDF Document" : isImg ? "Image File" : "Medical Document",
        fileType: fileKind,
        previewUrl: prevUrl,
      });
    }
  };

  const handleRemoveFile = () => {
    if (attachedFile?.previewUrl) {
      URL.revokeObjectURL(attachedFile.previewUrl);
    }
    setAttachedFile(null);
    attachedFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleLocalMic = () => {
    if (isListeningLocal) stopListening();
    else startListening();
  };

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 pb-[env(safe-area-inset-bottom)] flex flex-col items-center justify-center pointer-events-none gap-2 ${className}`}>
      {/* Container Card */}
      <div className="w-full pointer-events-auto flex flex-col gap-2 relative rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl p-3 transition-all focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
        {/* Attached File Preview Tag */}
        {attachedFile && (
          <div className="mb-1 p-2 rounded-2xl bg-[var(--surface-muted)] border border-[var(--border)] inline-flex items-center gap-3 text-xs w-fit max-w-full animate-fade-in shadow-xs">
            {attachedFile.fileType === "image" && attachedFile.previewUrl ? (
              <img
                src={attachedFile.previewUrl}
                alt={attachedFile.name}
                className="w-9 h-9 rounded-xl object-cover border border-[var(--border)]"
              />
            ) : attachedFile.fileType === "pdf" ? (
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[var(--ink)] truncate max-w-[220px]">
                  {attachedFile.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)]">
                  {attachedFile.fileType}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ink-muted)] block">
                {attachedFile.size} • Ready to submit
              </span>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 hover:bg-[var(--surface)] rounded-full text-[var(--ink-muted)] hover:text-rose-500 transition-colors"
              title="Remove attached file"
            >
              <X className="w-4 h-4" />
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
              onClick={stopListening}
              className="text-[11px] underline"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* File Attachment Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden"
          />

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-muted)] active:scale-95 transition-all focus-ring shrink-0 mb-0.5"
            title="Attach lab report or prescription (PDF, Image, Doc)"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Auto-expanding Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about symptoms, medicines, or upload lab reports..."
            rows={1}
            className="flex-1 bg-transparent text-[var(--ink)] placeholder-[var(--ink-muted)] text-xs sm:text-sm py-2 px-1 focus:outline-none resize-none min-h-[38px] max-h-[220px] overflow-y-auto leading-relaxed transition-[height] duration-150"
          />

          {/* Mic / Voice Button */}
          <button
            type="button"
            onClick={toggleLocalMic}
            onDoubleClick={onOpenVoiceMode}
            className={`p-2.5 rounded-full active:scale-95 transition-all focus-ring shrink-0 mb-0.5 ${isListeningLocal
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
            className={`p-2.5 rounded-full transition-all focus-ring shrink-0 mb-0.5 ${text.trim() || attachedFile
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
      <p className="text-center text-[11px] text-[var(--ink-muted)] mt-1 font-mono flex items-center justify-center gap-1 opacity-80">
        <ShieldCheck className="w-3 h-3 text-[var(--accent)] inline" />
        AI guidance only. Not a medical diagnosis. Consult a physician for emergencies.
      </p>
    </div>
  );
}
