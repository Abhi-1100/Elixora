"use client";

import React from "react";
import { motion } from "framer-motion";

interface BreathOrbProps {
  size?: "sm" | "md" | "lg" | "xl";
  mode?: "idle" | "listening" | "thinking" | "speaking";
  className?: string;
}

export function BreathOrb({
  size = "md",
  mode = "idle",
  className = "",
}: BreathOrbProps) {
  // Dimensions for different sizes
  const dimensions = {
    sm: "w-7 h-7",
    md: "w-14 h-14",
    lg: "w-28 h-28",
    xl: "w-44 h-44",
  };

  const coreSizes = {
    sm: "w-3 h-3",
    md: "w-6 h-6",
    lg: "w-12 h-12",
    xl: "w-20 h-20",
  };

  // Pulse animation speeds based on mode
  const duration = mode === "listening" ? 1.5 : mode === "thinking" ? 2.0 : 4.0;
  const isFast = mode === "listening";

  return (
    <div
      className={`relative flex items-center justify-center select-none ${dimensions[size]} ${className}`}
      aria-label="AI presence indicator"
      role="status"
    >
      {/* Outer Ring 3 */}
      <motion.div
        className="absolute inset-0 rounded-full mix-blend-multiply dark:mix-blend-screen opacity-30 blur-md"
        style={{
          background: "linear-gradient(135deg, var(--glow-a), var(--glow-b))",
        }}
        animate={{
          scale: isFast ? [1, 1.25, 1] : [1, 1.15, 1],
          opacity: isFast ? [0.25, 0.5, 0.25] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Middle Ring 2 */}
      <motion.div
        className="absolute inset-1.5 rounded-full mix-blend-normal opacity-50 blur-sm"
        style={{
          background: "linear-gradient(135deg, var(--glow-a), var(--glow-b))",
        }}
        animate={{
          scale: isFast ? [1, 1.18, 1] : [1, 1.08, 1],
          opacity: isFast ? [0.4, 0.7, 0.4] : [0.35, 0.6, 0.35],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          scale: { duration: duration, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: duration, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: duration * 3, repeat: Infinity, ease: "linear" },
        }}
      />

      {/* Inner Ring 1 */}
      <motion.div
        className="absolute inset-3 rounded-full opacity-70 blur-[2px]"
        style={{
          background: "linear-gradient(135deg, var(--accent-soft), var(--glow-b))",
        }}
        animate={{
          scale: isFast ? [1, 1.12, 1] : [1, 1.04, 1],
          opacity: [0.6, 0.85, 0.6],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* Core Glowing Center */}
      <motion.div
        className={`relative rounded-full shadow-sm flex items-center justify-center ${coreSizes[size]}`}
        style={{
          background: "linear-gradient(135deg, var(--glow-a), var(--glow-b))",
          boxShadow: "0 0 15px rgba(201, 184, 240, 0.4)",
        }}
        animate={{
          scale: isFast ? [0.95, 1.08, 0.95] : [0.98, 1.03, 0.98],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
