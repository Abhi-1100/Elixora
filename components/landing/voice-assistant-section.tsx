"use client";

import React from "react";
import { ParticleOrbCanvas } from "./particle-orb-canvas";
import { Mic, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface VoiceAssistantSectionProps {
  onOpenVoice?: () => void;
}

export function VoiceAssistantSection({ onOpenVoice }: VoiceAssistantSectionProps) {
  const router = useRouter();

  const handleVoiceAction = () => {
    if (onOpenVoice) {
      onOpenVoice();
    } else {
      router.push("/voice");
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* 1. Voice Assistant Container with Ambient Cyan/Blue Glow (Matches Reference 1:1) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-[32px] overflow-hidden border border-white/10 p-8 sm:p-16 text-center bg-[#030611] shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
      >
        {/* Radial Blue Glow Background Effect */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 105%, rgba(37, 99, 235, 0.38) 0%, rgba(6, 182, 212, 0.2) 35%, rgba(3, 6, 17, 0) 75%)",
          }}
        />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-cyan-500/25 rounded-full blur-[100px] pointer-events-none" />

        {/* Header content matching screenshot */}
        <div className="relative z-10 space-y-4 max-w-3xl mx-auto mb-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-zinc-300 tracking-tight leading-tight">
            Talk to Elixora AI – <span className="text-white">Smarter, Faster, Better</span>
          </h2>
        </div>

        {/* 3D Audio Particle Orb Visual */}
        <div className="relative z-10 flex justify-center items-center my-4">
          <ParticleOrbCanvas size={360} isListening={true} onMicClick={handleVoiceAction} />
        </div>

        {/* Speak Button CTA (Matches Reference Image Bottom Control Pill 1:1) */}
        <div className="relative z-10 pt-2">
          <button
            onClick={handleVoiceAction}
            className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600/90 to-cyan-600/90 hover:from-blue-500 hover:to-cyan-500 border border-cyan-400/40 text-white font-medium text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.55)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Mic className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide">Speak with Elixora</span>
          </button>
        </div>
      </motion.div>
    </section>
  );
}

