"use client";

import React from "react";
import { Navbar } from "@/components/ui/navbar";
import { ParticleHandsCanvas } from "@/components/landing/particle-hands-canvas";
import { VoiceAssistantSection } from "@/components/landing/voice-assistant-section";
import { FeaturesPricingFAQ } from "@/components/landing/features-pricing-faq";
import { SpecularButton } from "@/components/ui/specular-button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  const handleLaunchSandbox = (promptText?: string) => {
    const text = promptText || "Explain Amoxicillin 500mg dosage";
    router.push(`/chat?prompt=${encodeURIComponent(text)}`);
  };

  const handleOpenVoice = () => {
    router.push("/chat?mode=voice");
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] flex flex-col font-sans select-none transition-colors duration-200">
      {/* 1. Navbar matching screenshot */}
      <Navbar showNavLinks={true} />

      {/* 2. Hero Section matching screenshot 1:1 layout */}
      <section className="relative pt-16 sm:pt-24 pb-8 px-6 max-w-6xl mx-auto flex flex-col items-center text-center z-10">
        
        {/* Centered Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl lg:text-7xl tracking-[-0.035em] leading-[1.1] max-w-5xl mb-6 font-headline"
        >
          <span className="text-zinc-400 block font-normal text-3xl sm:text-5xl lg:text-6xl mb-1">
            Grow Faster by
          </span>
          <span className="text-white block font-bold text-4xl sm:text-6xl lg:text-7xl">
            Unlocking Healthcare Intelligence
          </span>
        </motion.h1>

        {/* Subheading matching Elixora Healthcare AI Domain */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-xs sm:text-base text-zinc-400 max-w-[620px] mb-10 leading-relaxed font-normal"
        >
          We connect your clinical data to reveal the bigger picture: lab trends, symptoms, medication, and care guidance.
        </motion.p>

        {/* Two Pill CTAs Side by Side matching screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex items-center justify-center gap-4 mb-4"
        >
          <SpecularButton
            size="md"
            radius={9999}
            tint="#ffffff"
            tintOpacity={0.05}
            blur={10}
            textColor="#ffffff"
            lineColor="#5227FF"
            baseColor="#525252"
            intensity={1.2}
            shineSize={12}
            shineFade={40}
            thickness={1}
            speed={0.35}
            followMouse={true}
            proximity={250}
            autoAnimate={false}
            className="text-xs sm:text-sm font-medium px-8 py-3"
            onClick={() => handleLaunchSandbox()}
          >
            Get started
          </SpecularButton>

          <a
            href="#features"
            className="rounded-full bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-medium px-8 py-3 transition-all cursor-pointer"
          >
            Learn more
          </a>
        </motion.div>
      </section>

      {/* 3. Signature Particle ASCII Point-Cloud Canvas */}
      <section className="relative w-full max-w-full overflow-hidden flex flex-col items-center justify-center my-0 px-4 z-0">
        <ParticleHandsCanvas />
      </section>

      {/* 4. Voice Assistant Section */}
      <VoiceAssistantSection onOpenVoice={handleOpenVoice} />

      {/* 5. Features & Pricing */}
      <FeaturesPricingFAQ />

      {/* 6. Footer matching Elixora branding */}
      <footer className="mt-auto border-t border-white/10 py-12 px-6 bg-[#050507] text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">/Elixora.</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Empowering individuals with AI clinical assistant tools and structured medical intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/chat" className="hover:text-white transition-colors">Voice Assistant</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">Lab OCR Reader</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">Prescription Guide</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">Symptom Checker</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Security & Legal</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#security" className="hover:text-white transition-colors">HIPAA Safeguards</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">AES-256 Encryption</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Medical Disclaimer</h4>
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Elixora is an artificial intelligence platform designed for informational and educational purposes. It does not replace licensed medical consultations or emergency services.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026 Elixora Healthcare AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/chat" className="hover:text-white">Launch App</Link>
            <span>•</span>
            <a href="#security" className="hover:text-white">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}



