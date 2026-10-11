"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleOrbCanvas } from "@/components/landing/particle-orb-canvas";
import { GradientWaves } from "@/components/ui/gradient-waves";
import { Mic, X, Sparkles, Send } from "lucide-react";
import { useVoiceInput, type VoiceLanguage } from "@/hooks/useVoiceInput";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";

type VoiceChatReply = {
  text: string;
  englishTranslation?: string;
  translationStatus?: string;
};

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: VoiceLanguage;
  onLanguageChange: (language: VoiceLanguage) => void;
  onSendTranscript?: (
    transcript: string,
    translateToEnglish: boolean,
  ) => string | VoiceChatReply | null | undefined | Promise<string | VoiceChatReply | null | undefined>;
}

function cleanForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_~`>#]/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/AI guidance only\. Not a medical diagnosis\. Consult a physician for emergencies\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function VoiceModeModal({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  onSendTranscript,
}: VoiceModeModalProps) {
  const [statusText, setStatusText] = useState("Speak with Elixora");
  const [currentSpeech, setCurrentSpeech] = useState<string>("");
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const { isSpeaking, speak, stopSpeaking } = useVoiceOutput();

  const onTranscript = useCallback(async (transcript: string) => {
    if (transcript) {
      setSpokenTranscript(transcript);
      setCurrentSpeech(`You: ${transcript}`);
      setStatusText("Press Enter ↵ to send to chatbox");
    }
  }, []);

  const onInterim = useCallback((transcript: string) => {
    if (transcript) {
      setSpokenTranscript(transcript);
      setCurrentSpeech(`You: ${transcript}…`);
      setStatusText("Listening… press Enter ↵ to send to chatbox");
    }
  }, []);

  const { isListening, interimTranscript, error, startListening, stopListening } =
    useVoiceInput(onTranscript, onInterim);

  const handleSendToChatbox = useCallback(async () => {
    const textToSend = (spokenTranscript || currentSpeech || "")
      .replace(/^You:\s*/i, "")
      .replace(/[….]+$/g, "")
      .trim();
    if (!textToSend) return;
    stopListening();
    stopSpeaking();
    onClose();
    await onSendTranscript?.(textToSend, true);
  }, [spokenTranscript, currentSpeech, stopListening, stopSpeaking, onClose, onSendTranscript]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendToChatbox();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleSendToChatbox]);

  useEffect(() => {
    if (isOpen) {
      setSpokenTranscript("");
      setCurrentSpeech("");
      setStatusText("Speak with Elixora");
      stopListening();
      void startListening(language);
      return;
    }
    stopListening();
    stopSpeaking();
  }, [isOpen, language, startListening, stopListening, stopSpeaking]);

  const handleClose = () => {
    stopListening();
    stopSpeaking();
    onClose();
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setStatusText("Speak with Elixora");
      return;
    }
    stopSpeaking();
    setStatusText("Listening to your voice...");
    void startListening(language);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#030611] text-white p-6 select-none overflow-hidden font-sans">
        {/* Animated GradientWaves WebGL Background Effect */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-80">
          <GradientWaves
              horizonColor="#96beff"
              waveColor="#96beff"
              crestColor="#ffffff"
            speed={0.3}
            amplitude={1.55}
            waveScale={0.8}
            waveRatio={0.55}
            swell={35}
            turbulence={23.5}
            tilt={1.11}
            zoom={0.75}
            height={3.1}
            fogDepth={15}
            detail="medium"
            brightness={0.95}
            opacity={1.0}
            mouseInteraction={true}
            parallaxStrength={0.5}
            grain={true}
            grainIntensity={0.05}
          />
        </div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-500/25 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Close Button */}
        <div className="relative z-20 w-full flex justify-end">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg"
            title="Close Voice Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3. Main Center Area: Title & 3D Particle Orb */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-3xl text-center space-y-6">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-medium tracking-tight text-zinc-300 max-w-2xl leading-[1.18]"
          >
            Talk to Elixora AI – <span className="text-white">Smarter, Faster, Better</span>
          </motion.h1>

          {/* 3D Audio Particle Orb */}
          <div className="relative flex justify-center items-center py-2">
            <ParticleOrbCanvas
              size={360}
              isListening={isListening}
              onMicClick={handleMicClick}
            />
          </div>

          {/* Live Transcription / Response Line */}
          {(currentSpeech || interimTranscript || error || spokenTranscript) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/60 border border-cyan-500/40 px-6 py-4 rounded-2xl max-w-lg text-xs sm:text-sm text-cyan-200 shadow-2xl backdrop-blur-md flex flex-col items-center gap-3"
            >
              <p className="leading-relaxed font-mono flex items-center justify-center gap-2 text-center">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="whitespace-pre-wrap">{error || currentSpeech || interimTranscript || spokenTranscript}</span>
              </p>

              {(spokenTranscript || interimTranscript) && !error && (
                <button
                  type="button"
                  onClick={handleSendToChatbox}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Send to Chatbox</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-black/40 border border-white/20 rounded font-mono">Enter ↵</kbd>
                </button>
              )}
            </motion.div>
          )}

          {/* 4. Bottom Action Pill (Matches Reference Image 1:1) */}
          <div className="pt-2">
            <label className="mb-3 flex items-center justify-center gap-2 text-xs text-zinc-300">
              <span>Speech and reply language</span>
              <select
                value={language}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (value === "auto" || value === "en" || value === "hi" || value === "gu") {
                    onLanguageChange(value);
                  }
                }}
                title="Auto detects the reply language from the transcript. Choose Hindi or Gujarati for speech recognition in that language."
                className="rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-white"
              >
                <option value="auto">Auto-detect reply</option>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </label>
            <p className="mb-3 max-w-md text-[10px] leading-relaxed text-zinc-400">
              Hindi and Gujarati voice transcripts are sent to Google Cloud Translation for English text.
              Machine translations can be imperfect; check important medical details.
            </p>
            <button
              onClick={handleMicClick}
              className="group bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-500 hover:to-cyan-500 border border-cyan-400/40 text-white font-medium text-xs sm:text-sm px-7 py-3 rounded-full flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(37,99,235,0.55)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="relative flex items-center justify-center">
                <Mic className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                {isListening && (
                  <span className="absolute -inset-1 rounded-full bg-cyan-400/40 animate-ping pointer-events-none" />
                )}
              </div>
              <span className="tracking-wide">
                {isSpeaking ? "Tap to interrupt" : isListening ? "Listening..." : statusText}
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-zinc-500 pb-2">
          Elixora voice assistant · Interim speech appears as you speak
        </div>
      </div>
    </AnimatePresence>
  );
}
