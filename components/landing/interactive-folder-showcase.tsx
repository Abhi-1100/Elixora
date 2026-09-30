"use client";

import React from "react";
import { FolderFloat } from "@/components/ui/folder-float";
import { motion } from "framer-motion";
import { FolderArchive, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function InteractiveFolderShowcase() {
  const router = useRouter();

  const clinicalItems = [
    "Amoxicillin 500mg Guidance",
    "Lipid Panel Analysis",
    "Drug Interactions Check",
    "Biomarker Trends",
    "Emergency Triage"
  ];

  const handleSelectNote = (value: string) => {
    router.push(`/chat?prompt=${encodeURIComponent(value)}`);
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
      {/* Subtle radial cyan/blue background glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, rgba(59, 130, 246, 0.12) 0%, rgba(5, 5, 7, 0) 70%)",
        }}
      />

      {/* Header section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl mx-auto mb-16 space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Zero-Gravity Clinical Records</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Clinical data organized in seconds.
        </h2>

        <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
          Hover or tap the folder below to release interactive clinical records. Drag, float, or select any note to launch instant AI health guidance.
        </p>
      </motion.div>

      {/* Interactive FolderFloat Component with physical cloud space */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative z-20 w-full flex items-center justify-center pt-28 pb-8"
      >
        <FolderFloat
          items={clinicalItems}
          label="Clinical Records"
          sublabel="5 AI dossiers"
          trigger="hover"
          closeOnSelect={true}
          physics={true}
          drift={0.6}
          onSelect={handleSelectNote}
          folderColor="#0F172A"
          frontColor="#1E293B"
          paperColor="#3B82F6"
          itemColor="rgba(15, 23, 42, 0.92)"
          itemTextColor="#F8FAFC"
          labelColor="#F8FAFC"
          width={220}
          height={154}
          radius={16}
          spread={200}
          lift={32}
          tilt={8}
          flapAngle={36}
          restAngle={16}
          openDuration={500}
          stagger={45}
          bounce={0.3}
          className="shadow-2xl"
        />
      </motion.div>

      {/* Helpful Hint */}
      <div className="relative z-10 flex items-center gap-2 text-xs text-zinc-500 font-mono mt-4 opacity-75">
        <FolderArchive className="w-3.5 h-3.5 text-blue-400" />
        <span>Hover to open • Drag pills with gravity physics • Click to analyze</span>
      </div>
    </section>
  );
}

export default InteractiveFolderShowcase;
