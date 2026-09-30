"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function GetInTouchSection() {
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
    <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-[28px] border border-white/10 p-8 sm:p-14 text-center bg-[#050507] overflow-hidden shadow-2xl"
      >
        {/* Subtle Ambient Radial Glow */}
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
              className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-[999px] bg-[#0A0E1A] border border-white/10 focus-within:border-blue-500 transition-all shadow-inner"
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
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs px-6 py-3 font-medium rounded-full flex items-center justify-center gap-2 shrink-0 transition-all shadow-md cursor-pointer"
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

export default GetInTouchSection;
