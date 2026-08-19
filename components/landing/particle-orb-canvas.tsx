"use client";

import React, { useEffect, useRef } from "react";
import { Mic } from "lucide-react";

interface ParticleOrbCanvasProps {
  size?: number;
  isListening?: boolean;
}

export function ParticleOrbCanvas({
  size = 320,
  isListening = false,
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

    // Create 3D spherical point cloud
    interface SphericalParticle {
      theta: number; // azimuth angle
      phi: number;   // polar angle
      baseRadius: number;
      size: number;
      opacity: number;
    }

    const particles: SphericalParticle[] = [];
    const count = 900;

    for (let i = 0; i < count; i++) {
      // Fibonacci sphere distribution for uniform distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      particles.push({
        theta,
        phi,
        baseRadius: radius,
        size: Math.random() > 0.85 ? 2.0 : 1.2,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }

    let time = 0;

    const render = () => {
      time += isListening ? 0.035 : 0.018;
      ctx.clearRect(0, 0, size, size);

      // Outer radial glow
      const glow = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.4,
        centerX,
        centerY,
        radius * 1.35
      );
      glow.addColorStop(0, "rgba(91, 156, 255, 0.25)");
      glow.addColorStop(0.6, "rgba(59, 130, 246, 0.08)");
      glow.addColorStop(1, "rgba(10, 14, 26, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Project 3D sphere points onto 2D canvas with rotation and wave deformation
      const rotY = time * 0.4;
      const rotX = Math.sin(time * 0.2) * 0.3;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Harmonic wave deformation
        const wave =
          Math.sin(p.phi * 5 + time * 3) * 6 +
          Math.cos(p.theta * 4 + time * 2) * 4;

        const currentRadius = p.baseRadius + wave;

        // 3D coordinates
        let x = currentRadius * Math.sin(p.phi) * Math.cos(p.theta);
        let y = currentRadius * Math.cos(p.phi);
        let z = currentRadius * Math.sin(p.phi) * Math.sin(p.theta);

        // Rotate around Y axis
        const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

        // Rotate around X axis
        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        // Perspective scale
        const fov = 350;
        const scale = fov / (fov + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y2 * scale;

        // Depth cueing
        const depthAlpha = Math.max(0.1, Math.min(1, (z2 + radius) / (radius * 2)));
        const finalAlpha = p.opacity * depthAlpha;

        ctx.fillStyle =
          z2 > 0
            ? `rgba(91, 156, 255, ${finalAlpha})`
            : `rgba(59, 130, 246, ${finalAlpha * 0.6})`;

        ctx.beginPath();
        ctx.arc(projX, projY, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, isListening]);

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
      {/* Center microphone core badge matching Image 2 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-white text-[#050507] flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.7)] transition-transform duration-300 hover:scale-110">
          <Mic className="w-5 h-5 text-[#0A0E1A]" />
        </div>
      </div>
    </div>
  );
}
