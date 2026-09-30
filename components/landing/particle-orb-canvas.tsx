"use client";

import React, { useEffect, useRef } from "react";
import { Mic } from "lucide-react";

interface ParticleOrbCanvasProps {
  size?: number;
  isListening?: boolean;
  onMicClick?: () => void;
}

export function ParticleOrbCanvas({
  size = 380,
  isListening = true,
  onMicClick,
}: ParticleOrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.38;

    interface Particle {
      theta: number; // azimuth angle
      phi: number;   // polar angle
      baseRadius: number;
      size: number;
      opacity: number;
      phaseShift: number;
    }

    const particles: Particle[] = [];
    const count = 900; // Balanced density for 60fps performance

    for (let i = 0; i < count; i++) {
      // Fibonacci sphere distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      particles.push({
        theta,
        phi,
        baseRadius: radius,
        size: Math.random() > 0.85 ? 1.8 : 1.1,
        opacity: 0.35 + Math.random() * 0.65,
        phaseShift: Math.random() * Math.PI * 2,
      });
    }

    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    let time = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible || document.hidden) return;

      time += isListening ? 0.025 : 0.012;
      ctx.clearRect(0, 0, size, size);

      // Deep ambient blue glow halo behind sphere
      const ambientGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.2,
        centerX,
        centerY,
        radius * 1.35
      );
      ambientGlow.addColorStop(0, "rgba(56, 189, 248, 0.22)");
      ambientGlow.addColorStop(0.5, "rgba(37, 99, 235, 0.1)");
      ambientGlow.addColorStop(1, "rgba(3, 6, 17, 0)");
      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 3D rotation angles
      const rotY = time * 0.35;
      const rotX = Math.sin(time * 0.18) * 0.25;

      interface Dot {
        x: number;
        y: number;
        r: number;
      }
      const front: Dot[] = [];
      const mid: Dot[] = [];
      const rear: Dot[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const wave =
          Math.sin(p.phi * 6 + time * 2.8 + p.phaseShift * 0.2) * 7 +
          Math.cos(p.theta * 5 + time * 2.2) * 5 +
          Math.sin((p.phi + p.theta) * 3 + time * 3.5) * 4;

        const currentRadius = p.baseRadius + wave;

        let x = currentRadius * Math.sin(p.phi) * Math.cos(p.theta);
        let y = currentRadius * Math.cos(p.phi);
        let z = currentRadius * Math.sin(p.phi) * Math.sin(p.theta);

        const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        const fov = 380;
        const scale = fov / (fov + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;
        const r = p.size * scale;

        if (z2 > radius * 0.3) {
          front.push({ x: projX, y: projY, r });
        } else if (z2 > -radius * 0.2) {
          mid.push({ x: projX, y: projY, r });
        } else {
          rear.push({ x: projX, y: projY, r });
        }
      }

      // Draw rear dots in batched path
      ctx.fillStyle = "rgba(29, 78, 216, 0.45)";
      ctx.beginPath();
      for (let i = 0; i < rear.length; i++) {
        ctx.moveTo(rear[i].x + rear[i].r, rear[i].y);
        ctx.arc(rear[i].x, rear[i].y, rear[i].r, 0, Math.PI * 2);
      }
      ctx.fill();

      // Draw mid-range dots in batched path
      ctx.fillStyle = "rgba(37, 99, 235, 0.85)";
      ctx.beginPath();
      for (let i = 0; i < mid.length; i++) {
        ctx.moveTo(mid[i].x + mid[i].r, mid[i].y);
        ctx.arc(mid[i].x, mid[i].y, mid[i].r, 0, Math.PI * 2);
      }
      ctx.fill();

      // Draw front highlight dots in batched path
      ctx.fillStyle = "rgba(56, 189, 248, 0.95)";
      ctx.beginPath();
      for (let i = 0; i < front.length; i++) {
        ctx.moveTo(front[i].x + front[i].r, front[i].y);
        ctx.arc(front[i].x, front[i].y, front[i].r, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    render();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, isListening]);

  return (
    <div
      onClick={onMicClick}
      className="relative flex items-center justify-center select-none cursor-pointer group"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />

      {/* Exact Center Microphone Core matching reference image */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)] group-hover:scale-110 transition-transform duration-300">
          <Mic className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

