"use client";

import React, { useState } from "react";
import {
  Mic,
  FileSpreadsheet,
  Pill,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  Star,
  Zap,
  Lock,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function FeaturesPricingFAQ() {
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const features = [
    {
      icon: <Mic className="w-5 h-5 text-[var(--accent-blue-glow)]" />,
      title: "Hands-Free Voice Mode",
      description: "Full-screen immersive audio conversation with live real-time transcript streaming and wave visualizer.",
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5 text-[var(--accent-blue-glow)]" />,
      title: "Lab Report OCR Analysis",
      description: "Instant parsing of PDF and image blood reports with precise biomarker reference tables.",
    },
    {
      icon: <Pill className="w-5 h-5 text-[var(--accent-blue-glow)]" />,
      title: "Medication & Rx Guides",
      description: "Clear dosage schedules, food instructions, potential side effects, and drug interaction alerts.",
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-[var(--accent-blue-glow)]" />,
      title: "Emergency Triage Guard",
      description: "Automated red-flag symptom detection with direct emergency hotline integration.",
    },
  ];

  const testimonials = [
    {
      quote: "Elixora translated my father's complex lab report into plain English in seconds. The voice mode makes asking follow-up questions completely effortless.",
      name: "Dr. Elena Rostova",
      role: "Clinical Director & Caregiver",
      stars: 5,
    },
    {
      quote: "The interface is breathtakingly clean and serene. It removed all the anxiety I usually feel when reviewing prescription drug interactions.",
      name: "Marcus Vance",
      role: "Patient & Health Tech Reviewer",
      stars: 5,
    },
    {
      quote: "Having multi-language voice support allowed our family to communicate care instructions seamlessly across generations.",
      name: "Amina Al-Mansoor",
      role: "Family Subscriber",
      stars: 5,
    },
  ];

  const faqs = [
    {
      question: "Is Elixora HIPAA compliant and secure?",
      answer: "Yes. All personal health queries, uploaded lab reports, and voice interactions are encrypted in transit and at rest using AES-256 standards. We never sell your personal data or use private health logs to train public models.",
    },
    {
      question: "How does the OCR lab report parser work?",
      answer: "Simply upload a PDF document or snapshot photo of your blood report. Elixora's OCR model extracts key metrics (like Cholesterol, Glucose, HbA1c), matches them against standard clinical ranges, and highlights anything outside normal bounds.",
    },
    {
      question: "Can I use Elixora in multiple languages?",
      answer: "Absolutely! Elixora supports real-time text and voice translation across 40+ languages, automatically adapting complex clinical terms to your preferred native tongue.",
    },
    {
      question: "Is Elixora a replacement for a physician?",
      answer: "No. Elixora provides structured educational guidance and informational synthesis. It is designed to assist your health literacy, not to issue formal medical diagnoses or replace emergency care.",
    },
  ];

  return (
    <div className="space-y-32 py-12 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* 1. Feature Grid Section */}
      <section id="features" className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(59,130,246,0.1)] border border-[rgba(91,156,255,0.2)] text-xs text-[var(--accent-blue-glow)] font-medium">
            <Zap className="w-3.5 h-3.5" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold text-[var(--text-primary)] tracking-[-0.03em]">
            Everything You Need for Clinical Clarity
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            From instant AI chat responses to OCR lab parsing and voice assistance.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass-panel p-8 space-y-4 group cursor-default"
            >
              {/* Circular glowing blue badge */}
              <div className="w-12 h-12 rounded-full bg-[rgba(59,130,246,0.12)] border border-[rgba(91,156,255,0.3)] flex items-center justify-center group-hover:scale-110 group-hover:border-[var(--accent-blue-glow)] transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                {item.icon}
              </div>

              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>


      {/* 3. Testimonials Section */}
      <section className="space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] tracking-[-0.025em]">
            Loved by patients & clinicians
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass-panel p-6 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--accent-blue)] to-[var(--accent-blue-glow)] text-white font-bold text-xs flex items-center justify-center">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-primary)]">{t.name}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. FAQ Accordion Section */}
      <section className="space-y-10 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--text-primary)] tracking-[-0.025em]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[#0A0E1A] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-blue-glow)] transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[var(--accent-blue-glow)]" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-6 pb-5 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[rgba(255,255,255,0.04)] pt-3"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
