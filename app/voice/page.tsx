"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ParticleOrbCanvas } from "@/components/landing/particle-orb-canvas";
import { GradientWaves } from "@/components/ui/gradient-waves";
import { Mic, Volume2, Sparkles, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VoicePage() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(true);
  const [statusText, setStatusText] = useState("Speak with Elixora");
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle speech interaction simulation
  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      setStatusText("Voice Paused — Tap to Resume");
    } else {
      setIsListening(true);
      setStatusText("Listening to your voice...");
    }
  };

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    if (isListening) {
      setStatusText("Listening to your voice...");
      timer1 = setTimeout(() => {
        setIsProcessing(true);
        setStatusText("Processing health query...");
        setTranscript("What are the side effects and proper timing for taking Amoxicillin 500mg?");
      }, 3500);

      timer2 = setTimeout(() => {
        setIsProcessing(false);
        setStatusText("Elixora: Take Amoxicillin 500mg every 8 hours with meals to minimize stomach upset.");
      }, 7000);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isListening]);

  return (
    <div className="relative min-h-screen w-full bg-[#030611] text-white flex flex-col items-center justify-between overflow-hidden select-none font-sans">
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
      {/* Additional side corner light bleeds */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-500/25 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Close Button */}
      <div className="relative z-20 pt-6 px-8 w-full flex justify-end">
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg"
          title="Exit Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Center Section: Headline + 3D Particle Orb */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl px-4 py-8 text-center space-y-6">
        {/* Main Title (Matches Reference Image Typography 1:1) */}
        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-zinc-300 max-w-3xl leading-[1.15]"
        >
          Talk to Elixora AI – <span className="text-white">Smarter, Faster, Better</span>
        </motion.h1>

        {/* 3D Particle Orb with Mic Core */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative py-2 flex justify-center items-center"
        >
          <ParticleOrbCanvas
            size={380}
            isListening={isListening}
            onMicClick={handleToggleVoice}
          />
        </motion.div>

        {/* Live Audio / Transcript Display */}
        <AnimatePresence mode="wait">
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-lg mx-auto bg-black/40 backdrop-blur-md border border-cyan-500/30 px-6 py-3 rounded-2xl text-xs sm:text-sm text-cyan-200 shadow-xl"
            >
              <div className="flex items-center gap-2 mb-1 text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                <Sparkles className="w-3 h-3" />
                <span>Realtime Voice Transcription</span>
              </div>
              <p className="leading-relaxed font-mono">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Bottom Control Pill (Matches Reference Image 1:1) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-2"
        >
          <button
            onClick={handleToggleVoice}
            className="group relative bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-500 hover:to-cyan-500 border border-cyan-400/40 text-white font-medium text-xs sm:text-sm px-7 py-3 rounded-full flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(37,99,235,0.55)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Animated Mic / Wave Icon */}
            <div className="relative flex items-center justify-center">
              <Mic className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              {isListening && (
                <span className="absolute -inset-1 rounded-full bg-cyan-400/40 animate-ping pointer-events-none" />
              )}
            </div>

            <span className="tracking-wide">{statusText}</span>
          </button>
        </motion.div>
      </main>

      {/* Footer minimal info */}
      <footer className="relative z-10 pb-6 text-center text-[11px] text-zinc-500">
        <p>Elixora Voice AI • Hands-Free Clinical Intelligence</p>
      </footer>
    </div>
  );
}
