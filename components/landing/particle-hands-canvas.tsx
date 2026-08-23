"use client";

import React, { useEffect, useRef } from "react";

export function ParticleHandsCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    interface Particle3D {
      // Base normalized 3D position (-0.5 to 0.5)
      bx: number;
      by: number;
      bz: number;
      // Normal vector for lighting/halftone calculation
      nx: number;
      ny: number;
      nz: number;
      // Halftone properties
      baseSize: number;
      baseOpacity: number;
      phase: number;
      isHighlight: boolean;
    }

    let particles: Particle3D[] = [];

    // Generate detailed 3D Open Reaching Hand Point Cloud
    const generateHandPointCloud = (): Particle3D[] => {
      const pts: Particle3D[] = [];

      // Helper to add 3D cylindrical segment (fingers / wrist)
      const addSegment = (
        x1: number, y1: number, z1: number,
        x2: number, y2: number, z2: number,
        r1: number, r2: number,
        rings: number, ptsPerRing: number,
        isFingerPad = false
      ) => {
        for (let ring = 0; ring <= rings; ring++) {
          const t = ring / rings;
          const cx = x1 + (x2 - x1) * t;
          const cy = y1 + (y2 - y1) * t;
          const cz = z1 + (z2 - z1) * t;
          const r = r1 + (r2 - r1) * t;

          for (let p = 0; p < ptsPerRing; p++) {
            const angle = (p / ptsPerRing) * Math.PI * 2 + (ring % 2 ? 0.1 : 0);
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            // Elliptical cross section for realistic finger/arm cross section
            const radiusX = r * 1.0;
            const radiusZ = r * 0.75;

            // Surface coordinates
            const px = cx + cosA * radiusX + (Math.random() - 0.5) * 0.006;
            const py = cy + (Math.random() - 0.5) * 0.006;
            const pz = cz + sinA * radiusZ + (Math.random() - 0.5) * 0.006;

            // Surface normal
            const nx = cosA;
            const ny = 0.2;
            const nz = sinA;

            const isFront = sinA > -0.1;
            const isHighlight = isFront && (cosA > -0.3 && cosA < 0.8) && Math.random() > 0.4;
            
            // Halftone density sizing: front-facing highlights get larger dots
            const baseSize = isHighlight
              ? 1.8 + Math.random() * 0.9
              : 0.9 + Math.random() * 0.6;
            const baseOpacity = isFront
              ? 0.45 + (sinA + 0.1) * 0.45 + Math.random() * 0.1
              : 0.15 + Math.random() * 0.25;

            pts.push({
              bx: px,
              by: py,
              bz: pz,
              nx,
              ny,
              nz,
              baseSize,
              baseOpacity,
              phase: Math.random() * Math.PI * 2,
              isHighlight,
            });
          }
        }
      };

      // 1. Forearm & Wrist (Bottom base)
      // Base at y = 0.46 extending up to wrist at y = 0.24
      addSegment(0.0, 0.46, -0.06, 0.0, 0.24, -0.02, 0.13, 0.10, 16, 22);

      // 2. Palm Volume & Surface Mesh
      // Palm extends from y = 0.24 (wrist) to y = -0.08 (knuckles)
      const palmRows = 32;
      const palmCols = 32;
      for (let r = 0; r <= palmRows; r++) {
        const py = 0.24 - (r / palmRows) * 0.32; // y from +0.24 to -0.08
        const v = r / palmRows; // 0 to 1

        // Palm width widens towards knuckles
        const width = 0.18 + v * 0.12;

        for (let c = 0; c <= palmCols; c++) {
          const u = c / palmCols; // 0 (left edge) to 1 (right edge)
          const px = -width / 2 + u * width;

          // Anatomical palm contour z(x,y):
          // Thenar eminence (thumb mound): left side bulge (u < 0.4, v > 0.3)
          const thenarBulge = (u < 0.45 && v > 0.25)
            ? Math.sin((u / 0.45) * Math.PI) * Math.sin(((v - 0.25) / 0.75) * Math.PI) * 0.065
            : 0;

          // Hypothenar eminence: right side bulge (u > 0.6, v > 0.3)
          const hypothenarBulge = (u > 0.55 && v > 0.25)
            ? Math.sin(((u - 0.55) / 0.45) * Math.PI) * Math.sin(((v - 0.25) / 0.75) * Math.PI) * 0.04
            : 0;

          // Center palm depression
          const centerDepression = (u > 0.35 && u < 0.65 && v > 0.2 && v < 0.8)
            ? -0.02
            : 0;

          // Base palm z-surface + anatomical bulges
          const pz = 0.03 + thenarBulge + hypothenarBulge + centerDepression;

          // Add surface points + internal depth points for solid halftone density
          const layers = (thenarBulge > 0.02) ? 2 : 1;
          for (let l = 0; l < layers; l++) {
            const zOffset = l === 0 ? 0 : -0.02;
            const isHighlight = (u > 0.15 && u < 0.85 && pz > 0.03) && Math.random() > 0.35;
            const baseSize = isHighlight ? 1.7 + Math.random() * 0.9 : 0.9 + Math.random() * 0.5;
            const baseOpacity = 0.35 + (pz / 0.095) * 0.55 + Math.random() * 0.1;

            pts.push({
              bx: px + (Math.random() - 0.5) * 0.005,
              by: py + (Math.random() - 0.5) * 0.005,
              bz: pz + zOffset + (Math.random() - 0.5) * 0.005,
              nx: (u - 0.5) * 2,
              ny: -0.2,
              nz: 1.0,
              baseSize,
              baseOpacity: Math.min(1.0, baseOpacity),
              phase: Math.random() * Math.PI * 2,
              isHighlight,
            });
          }
        }
      }

      // 3. Five Extended Fingers in Reaching Gesture
      // THUMB: Starts at left palm (thenar), angles left-up-forward
      addSegment(-0.11, 0.12, 0.06, -0.21, -0.12, 0.12, 0.042, 0.028, 14, 14, true);

      // INDEX FINGER: Starts at left knuckle, extends up and slightly left
      addSegment(-0.10, -0.08, 0.04, -0.14, -0.42, 0.02, 0.034, 0.022, 18, 14, true);

      // MIDDLE FINGER: Longest finger, extends straight up
      addSegment(-0.03, -0.09, 0.05, -0.03, -0.48, 0.03, 0.036, 0.023, 20, 14, true);

      // RING FINGER: Extends up and slightly right
      addSegment(0.04, -0.08, 0.04, 0.06, -0.43, 0.01, 0.033, 0.021, 18, 14, true);

      // PINKY FINGER: Shortest finger on right edge, angles right-up
      addSegment(0.11, -0.07, 0.02, 0.15, -0.34, -0.01, 0.029, 0.018, 15, 12, true);

      return pts;
    };

    particles = generateHandPointCloud();

    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse interactive tilt state
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = mouseX * 0.25; // Gentle Y rotation tilt
      targetRotX = -mouseY * 0.20; // Gentle X pitch tilt
    };

    container.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Smooth rotation interpolation
      currentRotY += (targetRotY - currentRotY) * 0.05;
      currentRotX += (targetRotX - currentRotX) * 0.05;

      const rotY = currentRotY + Math.sin(time * 0.5) * 0.04; // Gentle breathing motion
      const rotX = currentRotX - 0.12 + Math.cos(time * 0.6) * 0.03; // Base 3D pitch view angle

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Responsive center positioning & scale box
      const centerX = width / 2;
      const centerY = height * 0.52;
      const scale = Math.min(width, height) * 0.85;

      // 1. Draw Soft Radial Glow Light Source behind palm center
      const glowRadius = scale * 0.38;
      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY - scale * 0.05,
        0,
        centerX,
        centerY - scale * 0.05,
        glowRadius
      );
      radialGlow.addColorStop(0, "rgba(255, 255, 255, 0.14)");
      radialGlow.addColorStop(0.3, "rgba(220, 230, 255, 0.08)");
      radialGlow.addColorStop(0.65, "rgba(140, 180, 255, 0.03)");
      radialGlow.addColorStop(1, "rgba(5, 5, 7, 0)");

      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY - scale * 0.05, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sort particles by depth Z for proper depth rendering
      const projectedParticles: {
        px: number;
        py: number;
        pz: number;
        size: number;
        alpha: number;
        isHighlight: boolean;
      }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Subtle micro-float animation
        const floatZ = Math.sin(time * 1.5 + p.phase) * 0.004;
        const floatY = Math.cos(time * 1.2 + p.phase) * 0.003;

        const bx = p.bx;
        const by = p.by + floatY;
        const bz = p.bz + floatZ;

        // 3D Y-axis rotation
        const x1 = bx * cosY + bz * sinY;
        const z1 = -bx * sinY + bz * cosY;

        // 3D X-axis rotation
        const y2 = by * cosX - z1 * sinX;
        const z2 = by * sinX + z1 * cosX;

        // Perspective camera projection
        const fov = 1.8;
        const perspective = fov / (fov + z2);

        const projX = centerX + x1 * scale * perspective;
        const projY = centerY + y2 * scale * perspective;

        // Halftone depth shading factor
        const depthAlpha = Math.max(0.15, Math.min(1.0, (z2 + 0.35) / 0.7));
        const finalAlpha = p.baseOpacity * depthAlpha;
        const finalSize = p.baseSize * perspective;

        projectedParticles.push({
          px: projX,
          py: projY,
          pz: z2,
          size: finalSize,
          alpha: finalAlpha,
          isHighlight: p.isHighlight,
        });
      }

      // Sort back to front
      projectedParticles.sort((a, b) => a.pz - b.pz);

      // Render Halftone Circular White/Light-Gray Points
      for (let i = 0; i < projectedParticles.length; i++) {
        const p = projectedParticles[i];

        // Halftone dot color palette: crisp pure white and light-gray
        if (p.isHighlight) {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        } else {
          ctx.fillStyle = `rgba(225, 230, 240, ${p.alpha * 0.85})`;
        }

        ctx.beginPath();
        ctx.arc(p.px, p.py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[620px] mx-auto overflow-hidden flex flex-col items-center justify-center select-none py-2 my-2 bg-[#050507]"
    >
      <div className="relative w-full aspect-[4/3] max-h-[440px] flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block opacity-95 transition-opacity duration-300"
        />

        {/* Top/Bottom smooth vignette transitions */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#050507] via-transparent to-[#050507]" />
      </div>

      {/* Bottom Text Overlay with clear spacing below hand art */}
      <div className="w-full flex flex-col items-center justify-center pt-2 pb-1 pointer-events-none z-10">
        <span className="text-xs sm:text-sm font-medium text-zinc-400 opacity-70 tracking-wider">
          Powering experience...
        </span>
      </div>
    </div>
  );
}



