"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleOrbCanvas } from "@/components/landing/particle-orb-canvas";
import { GradientWaves } from "@/components/ui/gradient-waves";
import { Mic, X, Sparkles, Volume2 } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTranscript?: (transcript: string) => void | Promise<string | null | undefined>;
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

export function VoiceModeModal({ isOpen, onClose, onSendTranscript }: VoiceModeModalProps) {
  const [statusText, setStatusText] = useState("Speak with Elixora");
  const [currentSpeech, setCurrentSpeech] = useState<string>("");
  const { isSpeaking, speak, stopSpeaking } = useVoiceOutput();
  const { isListening, error, startListening, stopListening } = useVoiceInput(
    useCallback(async (transcript: string) => {
      setCurrentSpeech(`You: ${transcript}`);
      setStatusText("Elixora is processing...");
      const reply = await onSendTranscript?.(transcript);
      if (reply) {
        setCurrentSpeech(`Elixora: ${reply}`);
        speak(cleanForSpeech(reply));
      }
      setStatusText("Speak with Elixora");
    }, [onSendTranscript, speak])
  );

  useEffect(() => {
    if (isOpen) {
      setStatusText("Listening to your voice...");
      startListening();
      return;
    }
    stopListening();
    stopSpeaking();
  }, [isOpen, startListening, stopListening, stopSpeaking]);

  const handleClose = () => {
    stopListening();
    stopSpeaking();
    onClose();
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      return;
    }
    stopSpeaking();
    setStatusText("Listening to your voice...");
    startListening();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#030611] text-white p-6 select-none overflow-hidden font-sans">
        {/* Animated GradientWaves WebGL Background Effect */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-80">
          <GradientWaves
            horizonColor="#3B82F6"
            waveColor="#FF9FFC"
            crestColor="#FFFFFF"
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
          {(currentSpeech || error) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/50 border border-cyan-500/30 px-6 py-3 rounded-2xl max-w-md text-xs sm:text-sm text-cyan-200 shadow-xl"
            >
              <p className="leading-relaxed font-mono flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{error || currentSpeech}</span>
              </p>
            </motion.div>
          )}

          {/* 4. Bottom Action Pill (Matches Reference Image 1:1) */}
          <div className="pt-2">
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
              <span className="tracking-wide">{isSpeaking ? "Tap to interrupt" : statusText}</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-zinc-500 pb-2">
          Elixora Realtime AI Voice Assistant
        </div>
      </div>
    </AnimatePresence>
  );
}
