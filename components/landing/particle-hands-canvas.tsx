"use client";

import React, { useEffect, useRef } from "react";

export function ParticleHandsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 460);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 460;
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    // Optimized particle definition
    interface Particle {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      phase: number;
      isBright: boolean;
    }

    let particles: Particle[] = [];

    // Helper to add points along line segments with optimized count
    const addBonePoints = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      r1: number,
      r2: number,
      stepCount: number,
      pts: { x: number; y: number; edgeFactor: number }[]
    ) => {
      for (let i = 0; i <= stepCount; i++) {
        const t = i / stepCount;
        const bx = x1 + (x2 - x1) * t;
        const by = y1 + (y2 - y1) * t;
        const currentR = r1 + (r2 - r1) * t;

        const pointsPerStep = Math.max(1, Math.round(currentR * 0.4));
        for (let j = 0; j < pointsPerStep; j++) {
          const offsetR = Math.sqrt(Math.random()) * currentR;
          const offsetAngle = Math.random() * Math.PI * 2;
          const px = bx + Math.cos(offsetAngle) * offsetR;
          const py = by + Math.sin(offsetAngle) * offsetR;
          
          pts.push({ x: px, y: py, edgeFactor: 1 - offsetR / Math.max(1, currentR) });
        }
      }
    };

    const initParticles = () => {
      particles = [];
      const pts: { x: number; y: number; edgeFactor: number }[] = [];

      const centerX = width / 2;
      const centerY = height * 0.46;
      const scale = Math.min(width / 1000, 1.1);
      const isMobile = width < 768;
      const densityMultiplier = isMobile ? 6 : 14;

      // LEFT HAND
      const lWrist = { x: width * 0.08, y: height * 0.95 };
      const lPalmBase = { x: width * 0.22, y: height * 0.72 };
      const lKnuckleIdx = { x: width * 0.36, y: height * 0.52 };
      const lKnuckleMid = { x: width * 0.35, y: height * 0.60 };
      const lKnuckleRing = { x: width * 0.32, y: height * 0.68 };
      const lKnucklePinky = { x: width * 0.28, y: height * 0.75 };
      
      const lTipIdx = { x: centerX - 16 * scale, y: centerY - 4 * scale };
      const lTipMid = { x: width * 0.43, y: height * 0.54 };
      const lTipRing = { x: width * 0.39, y: height * 0.64 };
      const lTipPinky = { x: width * 0.33, y: height * 0.74 };
      const lThumbTip = { x: width * 0.30, y: height * 0.46 };

      // Forearm & Palm
      addBonePoints(lWrist.x, lWrist.y, lPalmBase.x, lPalmBase.y, 40 * scale, 30 * scale, densityMultiplier, pts);
      addBonePoints(lPalmBase.x, lPalmBase.y, lKnuckleIdx.x, lKnuckleIdx.y, 30 * scale, 24 * scale, densityMultiplier, pts);

      // Left Fingers
      addBonePoints(lKnuckleIdx.x, lKnuckleIdx.y, lTipIdx.x, lTipIdx.y, 14 * scale, 6 * scale, densityMultiplier * 1.2, pts);
      addBonePoints(lKnuckleMid.x, lKnuckleMid.y, lTipMid.x, lTipMid.y, 13 * scale, 7 * scale, densityMultiplier, pts);
      addBonePoints(lKnuckleRing.x, lKnuckleRing.y, lTipRing.x, lTipRing.y, 12 * scale, 7 * scale, densityMultiplier, pts);
      addBonePoints(lKnucklePinky.x, lKnucklePinky.y, lTipPinky.x, lTipPinky.y, 10 * scale, 6 * scale, densityMultiplier, pts);
      addBonePoints(lPalmBase.x, lPalmBase.y, lThumbTip.x, lThumbTip.y, 16 * scale, 8 * scale, densityMultiplier, pts);

      // RIGHT HAND
      const rWrist = { x: width * 0.92, y: height * 0.95 };
      const rPalmBase = { x: width * 0.78, y: height * 0.72 };
      const rKnuckleIdx = { x: width * 0.64, y: height * 0.52 };
      const rKnuckleMid = { x: width * 0.65, y: height * 0.60 };
      const rKnuckleRing = { x: width * 0.68, y: height * 0.68 };
      const rKnucklePinky = { x: width * 0.72, y: height * 0.75 };

      const rTipIdx = { x: centerX + 16 * scale, y: centerY - 4 * scale };
      const rTipMid = { x: width * 0.57, y: height * 0.54 };
      const rTipRing = { x: width * 0.61, y: height * 0.64 };
      const rTipPinky = { x: width * 0.67, y: height * 0.74 };
      const rThumbTip = { x: width * 0.70, y: height * 0.46 };

      // Right Forearm & Palm
      addBonePoints(rWrist.x, rWrist.y, rPalmBase.x, rPalmBase.y, 40 * scale, 30 * scale, densityMultiplier, pts);
      addBonePoints(rPalmBase.x, rPalmBase.y, rKnuckleIdx.x, rKnuckleIdx.y, 30 * scale, 24 * scale, densityMultiplier, pts);

      // Right Fingers
      addBonePoints(rKnuckleIdx.x, rKnuckleIdx.y, rTipIdx.x, rTipIdx.y, 14 * scale, 6 * scale, densityMultiplier * 1.2, pts);
      addBonePoints(rKnuckleMid.x, rKnuckleMid.y, rTipMid.x, rTipMid.y, 13 * scale, 7 * scale, densityMultiplier, pts);
      addBonePoints(rKnuckleRing.x, rKnuckleRing.y, rTipRing.x, rTipRing.y, 12 * scale, 7 * scale, densityMultiplier, pts);
      addBonePoints(rKnucklePinky.x, rKnucklePinky.y, rTipPinky.x, rTipPinky.y, 10 * scale, 6 * scale, densityMultiplier, pts);
      addBonePoints(rPalmBase.x, rPalmBase.y, rThumbTip.x, rThumbTip.y, 16 * scale, 8 * scale, densityMultiplier, pts);

      // Convert generated points into lightweight particles
      pts.forEach((pt) => {
        const isBright = Math.random() > 0.82;
        const baseAlpha = 0.2 + pt.edgeFactor * 0.7;

        particles.push({
          x: pt.x,
          y: pt.y,
          targetX: pt.x,
          targetY: pt.y,
          size: isBright ? 1.8 : 1.1,
          alpha: baseAlpha,
          baseAlpha,
          phase: Math.random() * Math.PI * 2,
          isBright,
        });
      });
    };

    initParticles();

    // Mouse reaction
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    // High performance render loop
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height * 0.46;

      // Glow between fingertips
      const sparkGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        140
      );
      sparkGlow.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      sparkGlow.addColorStop(0.25, "rgba(91, 156, 255, 0.18)");
      sparkGlow.addColorStop(0.6, "rgba(59, 130, 246, 0.04)");
      sparkGlow.addColorStop(1, "rgba(5, 5, 7, 0)");
      ctx.fillStyle = sparkGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
      ctx.fill();

      // Render dots in single batch
      ctx.fillStyle = "rgba(240, 245, 255, 0.85)";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const floatX = Math.cos(time + p.phase) * 1.5;
        const floatY = Math.sin(time * 0.8 + p.phase) * 1.8;

        const dx = mouseX - p.targetX;
        const dy = mouseY - p.targetY;
        const distSq = dx * dx + dy * dy;
        let pullX = 0;
        let pullY = 0;

        if (distSq < 22500) { // 150px squared
          const dist = Math.sqrt(distSq);
          const force = (150 - dist) / 150;
          pullX = (dx / dist) * force * 4;
          pullY = (dy / dist) * force * 4;
        }

        const currentX = p.targetX + floatX + pullX;
        const currentY = p.targetY + floatY + pullY;

        ctx.beginPath();
        ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-[440px] sm:h-[500px] overflow-hidden flex flex-col items-center justify-center select-none bg-[#050507]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-95 transition-opacity duration-500"
      />
      
      {/* Bottom Text Overlay */}
      <div className="absolute bottom-4 inset-x-0 flex flex-col items-center pointer-events-none z-10">
        <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] opacity-60 tracking-wider">
          Powering experience...
        </span>
      </div>

      {/* Top/Bottom gradient vignetting */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#050507] via-transparent to-[#050507]" />
    </div>
  );
}


