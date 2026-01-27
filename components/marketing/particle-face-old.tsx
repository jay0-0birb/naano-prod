"use client";

import { useRef, useEffect, useState } from "react";

interface Particle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
}

interface ParticleFaceProps {
  onComplete: () => void;
  className?: string;
}

export function ParticleFace({
  onComplete,
  className = "",
}: ParticleFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef<"scattered" | "assembling" | "assembled">(
    "scattered",
  );
  const startTimeRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);
  const [facePoints, setFacePoints] = useState<Array<[number, number]>>([]);
  const [pointsLoaded, setPointsLoaded] = useState(false);

  // Load SVG and extract EXACT coordinates by rendering to canvas and sampling pixels
  useEffect(() => {
    console.log("[ParticleFace] Starting SVG load...");
    
    // Create an image from the SVG
    const img = new Image();
    img.onload = () => {
      console.log("SVG image loaded, rendering to canvas...");
      
      // Create offscreen canvas to render SVG
      const tempCanvas = document.createElement('canvas');
      const size = 500; // Match SVG viewBox
      tempCanvas.width = size;
      tempCanvas.height = size;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        console.error("Could not get canvas context");
        return;
      }
      
      // Draw the SVG
      tempCtx.drawImage(img, 0, 0, size, size);
      
      // Get pixel data
      const imageData = tempCtx.getImageData(0, 0, size, size);
      const pixels = imageData.data;
      
      // Sample edge pixels (where logo is drawn)
      const allPoints: Array<[number, number]> = [];
      const sampleRate = 3; // Sample every 3rd pixel for performance
      
      for (let y = 0; y < size; y += sampleRate) {
        for (let x = 0; x < size; x += sampleRate) {
          const index = (y * size + x) * 4;
          const alpha = pixels[index + 3];
          
          // If pixel is not transparent, it's part of the logo
          if (alpha > 128) {
            allPoints.push([x / size, y / size]);
          }
        }
      }
      
      console.log(`Sampled ${allPoints.length} pixels from rendered SVG`);

        if (allPoints.length === 0) {
          console.error("No points extracted from SVG!");
          return;
        }

        // Find min/max to normalize first
        let minX = Infinity,
          maxX = -Infinity;
        let minY = Infinity,
          maxY = -Infinity;

        allPoints.forEach(([x, y]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });

        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;

        // DEBUG: Render WITHOUT rotation first to verify shape matches logo.svg
        const extractedPoints: Array<[number, number]> = [];

        console.log("=== DEBUG: RAW SVG DATA ===");
        console.log("Total points extracted:", allPoints.length);
        console.log("First 5 points:", allPoints.slice(0, 5));
        console.log("Coordinate ranges:", {
          minX,
          maxX,
          minY,
          maxY,
          rangeX,
          rangeY,
        });

        // Map directly without rotation to see if base shape is correct
        allPoints.forEach(([x, y]) => {
          // Normalize to 0-1 range
          const normalizedX = (x - minX) / rangeX;
          const normalizedY = (y - minY) / rangeY;

          // Map to canvas (right side) - NO ROTATION
          const canvasX = 0.5 + normalizedX * 0.45; // Right side
          const canvasY = 0.1 + normalizedY * 0.8; // Vertical

          if (canvasX >= 0 && canvasX <= 1 && canvasY >= 0 && canvasY <= 1) {
            extractedPoints.push([canvasX, canvasY]);
          }
        });

        // No rotation applied in this mapping step, so log that info for clarity
        console.log("No rotation applied in this mapping step.");
        console.log(
          `Mapped ${extractedPoints.length} points after normalization`,
        );

        if (extractedPoints.length > 0) {
          setFacePoints(extractedPoints);
          setPointsLoaded(true);
        } else {
          console.error("No valid points extracted after normalization");
        }
    };

    img.onerror = (error) => {
      console.error("Error loading SVG:", error);
    };

    img.src = '/logo.svg';
  }, []);

  useEffect(() => {
    if (!pointsLoaded || facePoints.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles from SVG logo points
    const initialParticles: Particle[] = [];

    facePoints.forEach(([targetX, targetY]) => {
      // Create 1 particle per point (we're sampling more densely now)
      const particlesPerPoint = 1;
      for (let i = 0; i < particlesPerPoint; i++) {
        // Random starting position (scattered on right side)
        const startX = 0.65 + Math.random() * 0.3; // Right side of screen
        const startY = 0.2 + Math.random() * 0.6; // Middle area

        // Target position from SVG - minimal random offset to preserve shape
        const targetXFinal = targetX + (Math.random() - 0.5) * 0.005;
        const targetYFinal = targetY + (Math.random() - 0.5) * 0.005;

        initialParticles.push({
          x: startX,
          y: startY,
          startX,
          startY,
          targetX: targetXFinal,
          targetY: targetYFinal,
          progress: 0,
        });
      }
    });

    particlesRef.current = initialParticles;
    phaseRef.current = "scattered";

    // Start assembly animation after a brief delay
    const assemblyTimer = setTimeout(() => {
      phaseRef.current = "assembling";
      startTimeRef.current = Date.now();
    }, 500);

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const phase = phaseRef.current;

      // Update and draw particles
      particles.forEach((particle) => {
        if (phase === "assembling") {
          const elapsed = Date.now() - startTimeRef.current;
          const duration = 2000; // 2 seconds
          const newProgress = Math.min(1, elapsed / duration);

          // Easing function (ease-out)
          const eased = 1 - Math.pow(1 - newProgress, 3);

          // Interpolate position
          particle.x =
            particle.startX + (particle.targetX - particle.startX) * eased;
          particle.y =
            particle.startY + (particle.targetY - particle.startY) * eased;
          particle.progress = newProgress;

          // Check if assembly is complete
          if (newProgress >= 1 && !hasCompletedRef.current) {
            phaseRef.current = "assembled";
            hasCompletedRef.current = true;
            setTimeout(() => {
              onComplete();
            }, 300);
          }
        }

        // Draw particle
        const size = 2.5 + Math.sin(particle.progress * Math.PI) * 0.5;
        ctx.fillStyle = "#3B82F6";
        ctx.globalAlpha = 0.8 + particle.progress * 0.2;
        ctx.beginPath();
        ctx.arc(particle.x * width, particle.y * height, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(assemblyTimer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onComplete, pointsLoaded, facePoints]);

  if (!pointsLoaded) {
    console.log("[ParticleFace] Not loaded yet, showing placeholder");
    return (
      <div
        className={className}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    );
  }

  console.log(
    "[ParticleFace] Points loaded, rendering canvas with",
    facePoints.length,
    "points",
  );

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "50%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
