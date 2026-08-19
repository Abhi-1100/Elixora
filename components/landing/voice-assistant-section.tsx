"use client";

import React, { useState } from "react";
import { ParticleOrbCanvas } from "./particle-orb-canvas";
import { Mic, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceAssistantSectionProps {
  onOpenVoice?: () => void;
}

export function VoiceAssistantSection({ onOpenVoice }: VoiceAssistantSectionProps) {
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

  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-24">
      {/* 1. Voice Assistant Container with Radial Blue Glow */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-[28px] overflow-hidden border border-[var(--border-subtle)] p-8 sm:p-14 text-center bg-[#0A0E1A]"
      >
        {/* Radial Blue Glow Background Effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(91, 156, 255, 0.28) 0%, rgba(59, 130, 246, 0.12) 40%, rgba(5, 5, 7, 0) 100%)",
          }}
        />

        {/* Header content */}
        <div className="relative z-10 space-y-4 max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(59,130,246,0.1)] border border-[rgba(91,156,255,0.2)] text-xs text-[var(--accent-blue-glow)] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Voice AI</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold text-[var(--text-primary)] tracking-[-0.03em] leading-tight">
            Talk to <span className="text-[var(--accent-blue-glow)] font-bold">Elixora AI</span> — Smarter, Faster, Better
          </h2>
        </div>

        {/* 3D Audio Particle Orb Visual */}
        <div className="relative z-10 flex justify-center items-center my-4">
          <ParticleOrbCanvas size={300} isListening={true} />
        </div>

        {/* Speak Button CTA */}
        <div className="relative z-10 pt-4">
          <button
            onClick={onOpenVoice}
            className="btn-pill-primary text-sm px-8 py-3.5 font-medium shadow-[0_0_25px_rgba(59,130,246,0.4)]"
          >
            <Mic className="w-4 h-4" />
            <span>Speak with Elixora</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Contact Section with Radial Bleed Glow */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative rounded-[28px] border border-[var(--border-subtle)] p-8 sm:p-14 text-center bg-[#050507] overflow-hidden"
      >
        {/* Glow bleeding up from bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 110%, rgba(59, 130, 246, 0.25) 0%, rgba(10, 14, 26, 0) 80%)",
          }}
        />

        <div className="relative z-10 max-w-xl mx-auto space-y-3 mb-8">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] tracking-[-0.025em]">
            Get in touch
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
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
              className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-[999px] bg-[#0A0E1A] border border-[var(--border-subtle)] focus-within:border-[var(--accent-blue)] transition-all"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full sm:flex-1 bg-transparent px-5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
              />
              <div className="hidden sm:block w-px h-6 bg-[var(--border-subtle)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full sm:flex-1 bg-transparent px-5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto btn-pill-primary text-xs px-6 py-3 font-medium shrink-0"
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
