"use client";

import React, { useState } from "react";
import { ParticleOrbCanvas } from "./particle-orb-canvas";
import { Mic, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface VoiceAssistantSectionProps {
  onOpenVoice?: () => void;
}

export function VoiceAssistantSection({ onOpenVoice }: VoiceAssistantSectionProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setName("");
      setEmail("");
      setContactSubmitted(false);
    }, 4000);
  };

  const handleVoiceAction = () => {
    if (onOpenVoice) {
      onOpenVoice();
    } else {
      router.push("/voice");
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-24">
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

      {/* 2. Contact Section */}
      <motion.div
        id="contact"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative rounded-[28px] border border-white/10 p-8 sm:p-14 text-center bg-[#050507] overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 110%, rgba(59, 130, 246, 0.25) 0%, rgba(10, 14, 26, 0) 80%)",
          }}
        />

        <div className="relative z-10 max-w-xl mx-auto space-y-3 mb-8">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Get in touch
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Got questions or need assistance? Elixora AI is here to help. Reach out and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        {/* Horizontal Form with Pill Inputs */}
        <div className="relative z-10 max-w-2xl mx-auto">
          {contactSubmitted ? (
            <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Thank you! We received your message and will respond shortly.</span>
            </div>
          ) : (
            <form
              onSubmit={handleContactSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-[999px] bg-[#0A0E1A] border border-white/10 focus-within:border-blue-500 transition-all"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full sm:flex-1 bg-transparent px-5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
              <div className="hidden sm:block w-px h-6 bg-white/10" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full sm:flex-1 bg-transparent px-5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs px-6 py-3 font-medium rounded-full flex items-center justify-center gap-2 shrink-0 transition-all shadow-md"
              >
                <span>Contact us</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </section>
  );
}

