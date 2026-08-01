"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BreathOrb } from "@/components/ui/breath-orb";
import { Mic, MicOff, X, Sparkles, Activity } from "lucide-react";

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTranscript?: (transcript: string) => void;
}

export function VoiceModeModal({ isOpen, onClose, onSendTranscript }: VoiceModeModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState<string[]>([
    "Aether Voice initialized. How can I assist your health query today?",
  ]);
  const [currentSpeech, setCurrentSpeech] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    // Simulate interactive voice conversation loop
    const timer1 = setTimeout(() => {
      setCurrentSpeech("Checking Amoxicillin dosage guidelines...");
    }, 2000);

    const timer2 = setTimeout(() => {
      const userText = "User: What is the recommended timing for taking Amoxicillin 500mg?";
      const aiText = "Aether: Take 500mg every 8 hours with or without food. Finish the full course as prescribed.";
      setTranscript((prev) => [...prev, userText, aiText]);
      onSendTranscript?.(userText);
      setCurrentSpeech("");
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, onSendTranscript]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#101713]/95 backdrop-blur-xl text-white p-6 select-none">
        {/* Top Header */}
        <div className="w-full max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base tracking-tight text-emerald-50">
                Aether Live Voice
              </h3>
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active Hands-Free Session
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Exit Voice Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Hero High-Presence Breath Orb & Live Speech */}
        <div className="flex flex-col items-center justify-center my-auto space-y-8 max-w-lg text-center">
          <div className="relative">
            <BreathOrb size="xl" mode={isListening ? "listening" : "idle"} />
          </div>

          {/* Waveform Bar Visualizer */}
          <div className="flex items-center justify-center gap-1.5 h-10">
            {[40, 70, 30, 90, 50, 100, 60, 85, 45, 95, 35, 65, 80, 50].map((height, i) => (
              <motion.div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-purple-400"
                animate={{
                  height: isListening && !isMuted ? [`${height * 0.2}%`, `${height}%`, `${height * 0.3}%`] : "20%",
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>

          {/* Current Live Transcription Line */}
          <div className="min-h-[50px] flex items-center justify-center px-4">
            {currentSpeech ? (
              <p className="text-lg font-medium text-emerald-200 animate-pulse font-display">
                &quot;{currentSpeech}&quot;
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Listening to your voice... Speak anytime
              </p>
            )}
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="w-full max-w-xl bg-black/40 border border-white/10 rounded-2xl p-4 max-h-36 overflow-y-auto space-y-2 text-xs font-mono text-slate-300">
          <div className="text-[10px] uppercase text-emerald-400 tracking-wider font-semibold mb-1">
            Realtime Transcript Log:
          </div>
          {transcript.map((line, idx) => (
            <p key={idx} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="mt-6 flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 shadow-2xl">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full transition-all ${
              isMuted ? "bg-red-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setIsListening(!isListening)}
            className={`px-6 py-3 rounded-full font-semibold text-xs tracking-wider uppercase transition-all shadow-lg ${
              isListening
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {isListening ? "Listening Active" : "Paused"}
          </button>

          <button
            onClick={onClose}
            className="p-3.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-all"
            title="End Session"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
}
