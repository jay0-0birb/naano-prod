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
  driftX: number; // Current drift offset
  driftY: number; // Current drift offset
  driftVelX: number; // Drift velocity
  driftVelY: number; // Drift velocity
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
  const hasAssembledRef = useRef(false); // Track if assembly has started in this session
  const assemblyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const [facePoints, setFacePoints] = useState<Array<[number, number]>>([]);
  const [pointsLoaded, setPointsLoaded] = useState(false);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Load SVG and extract EXACT coordinates by rendering to canvas and sampling pixels
  useEffect(() => {
    console.log("[ParticleFace] Starting SVG load with pixel sampling...");

    const img = new Image();
    img.onload = () => {
      console.log("SVG loaded, rendering to canvas for pixel sampling...");

      // Create offscreen canvas
      const tempCanvas = document.createElement("canvas");
      const size = 1000;
      tempCanvas.width = size;
      tempCanvas.height = size;
      const tempCtx = tempCanvas.getContext("2d");

      if (!tempCtx) {
        console.error("Could not get canvas context");
        return;
      }

      // Draw SVG
      tempCtx.drawImage(img, 0, 0, size, size);

      // Get pixel data
      const imageData = tempCtx.getImageData(0, 0, size, size);
      const pixels = imageData.data;

      // Sample ONLY edge pixels (outline) where logo exists
      const allPoints: Array<[number, number]> = [];
      const sampleRate = 1.5; // Sample every 1.5 pixels for more spaced out particles

      for (let y = 0; y < size; y += sampleRate) {
        for (let x = 0; x < size; x += sampleRate) {
          const px = Math.floor(x);
          const py = Math.floor(y);
          const index = (py * size + px) * 4;
          const alpha = pixels[index + 3];

          // If pixel is visible
          if (alpha > 128) {
            // Check if it's an edge pixel (has transparent neighbor)
            let isEdge = false;

            // Check neighbors (top, bottom, left, right)
            const neighbors = [
              [x, y - sampleRate], // top
              [x, y + sampleRate], // bottom
              [x - sampleRate, y], // left
              [x + sampleRate, y], // right
            ];

            for (const [nx, ny] of neighbors) {
              const npx = Math.floor(nx);
              const npy = Math.floor(ny);
              if (npx >= 0 && npx < size && npy >= 0 && npy < size) {
                const nIndex = (npy * size + npx) * 4;
                const nAlpha = pixels[nIndex + 3];
                if (nAlpha <= 128) {
                  isEdge = true;
                  break;
                }
              } else {
                isEdge = true; // Edge of image
                break;
              }
            }

            if (isEdge) {
              allPoints.push([x / size, y / size]);
            }
          }
        }
      }

      console.log(`Sampled ${allPoints.length} edge pixels (outline only)`);

      // Map to canvas coordinates (right side) - BIGGER size
      const extractedPoints: Array<[number, number]> = [];

      allPoints.forEach(([x, y]) => {
        // Center the coordinates first
        const centeredX = x - 0.5;
        const centeredY = y - 0.5;

        // Scale - make a tiny bit smaller
        const scale = 1.2; // 1.2x bigger (reduced from 1.4)
        const scaledX = centeredX * scale + 0.5;
        const scaledY = centeredY * scale + 0.5;

        // Map to canvas (right side)
        const canvasX = 0.5 + (scaledX - 0.5) * 0.9; // Use more of right side (0.9 instead of 0.45)
        const canvasY = 0.05 + scaledY * 0.9; // Use more vertical space

        if (
          canvasX >= 0 &&
          canvasX <= 1.5 &&
          canvasY >= -0.2 &&
          canvasY <= 1.2
        ) {
          extractedPoints.push([canvasX, canvasY]);
        }
      });

      console.log(`Mapped ${extractedPoints.length} points to canvas`);

      if (extractedPoints.length > 0) {
        setFacePoints(extractedPoints);
        setPointsLoaded(true);
      }
    };

    img.onerror = () => console.error("Error loading SVG");
    img.src = "/logo.svg";
  }, []);

  // Store facePoints in ref to avoid dependency issues
  const facePointsRef = useRef<Array<[number, number]>>([]);

  useEffect(() => {
    if (facePoints.length > 0) {
      facePointsRef.current = facePoints;
    }
  }, [facePoints]);

  useEffect(() => {
    if (!pointsLoaded || facePointsRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const initialParticles: Particle[] = [];

    facePointsRef.current.forEach(([targetX, targetY]) => {
      // Randomly choose an edge (0=top, 1=right, 2=bottom, 3=left)
      const edge = Math.floor(Math.random() * 4);
      let startX: number;
      let startY: number;

      switch (edge) {
        case 0: // Top edge - off screen above
          startX = Math.random(); // Random X across screen
          startY = -0.1 - Math.random() * 0.1; // Off screen above
          break;
        case 1: // Right edge - off screen to the right
          startX = 1.1 + Math.random() * 0.1; // Off screen to the right
          startY = Math.random(); // Random Y across screen
          break;
        case 2: // Bottom edge - off screen below
          startX = Math.random(); // Random X across screen
          startY = 1.1 + Math.random() * 0.1; // Off screen below
          break;
        case 3: // Left edge - off screen to the left
          startX = -0.1 - Math.random() * 0.1; // Off screen to the left
          startY = Math.random(); // Random Y across screen
          break;
        default:
          startX = Math.random();
          startY = Math.random();
      }

      // Add random offset for clustering effect
      const clusterOffsetX = (Math.random() - 0.5) * 0.008;
      const clusterOffsetY = (Math.random() - 0.5) * 0.008;

      // Initialize drift with random velocities for organic movement
      const driftVelX = (Math.random() - 0.5) * 0.0002; // Slow drift velocity
      const driftVelY = (Math.random() - 0.5) * 0.0002;

      initialParticles.push({
        x: startX,
        y: startY,
        startX,
        startY,
        targetX: targetX + clusterOffsetX,
        targetY: targetY + clusterOffsetY,
        progress: 0,
        driftX: 0,
        driftY: 0,
        driftVelX,
        driftVelY,
      });
    });

    particlesRef.current = initialParticles;

    // Always start with assembly animation ONCE per page load
    if (!hasAssembledRef.current) {
      phaseRef.current = "scattered";
      hasAssembledRef.current = true;

      assemblyTimerRef.current = setTimeout(() => {
        phaseRef.current = "assembling";
        startTimeRef.current = Date.now();
      }, 500);
    }

    const animate = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const phase = phaseRef.current;

      // Debug: log if no particles
      if (particles.length === 0) {
        console.warn("[ParticleFace] No particles to render");
      }

      particles.forEach((particle, index) => {
        if (phase === "assembling") {
          const elapsed = Date.now() - startTimeRef.current;
          const duration = 2000;
          const newProgress = Math.min(1, elapsed / duration);

          const eased = 1 - Math.pow(1 - newProgress, 3);

          particle.x =
            particle.startX + (particle.targetX - particle.startX) * eased;
          particle.y =
            particle.startY + (particle.targetY - particle.startY) * eased;
          particle.progress = newProgress;

          if (newProgress >= 1 && !hasCompletedRef.current) {
            phaseRef.current = "assembled";
            hasCompletedRef.current = true;
            // Assembly complete - now drift will start automatically
            setTimeout(() => onCompleteRef.current(), 300);
          }
        }

        // Constrained drift effect when assembled - particles gently float around their positions
        if (phase === "assembled") {
          // Update drift position
          particle.driftX += particle.driftVelX;
          particle.driftY += particle.driftVelY;

          // Constrain drift to a small radius (max distance from target)
          const maxDrift = 0.015; // Maximum drift distance (increased for more spacing)
          const currentDrift = Math.sqrt(
            particle.driftX * particle.driftX +
              particle.driftY * particle.driftY,
          );

          if (currentDrift > maxDrift) {
            // Normalize and constrain
            const scale = maxDrift / currentDrift;
            particle.driftX *= scale;
            particle.driftY *= scale;

            // Reverse velocity when hitting boundary for smooth bounce-back
            particle.driftVelX *= -0.8;
            particle.driftVelY *= -0.8;
          }

          // Add slight random velocity changes for organic movement
          if (Math.random() < 0.01) {
            particle.driftVelX += (Math.random() - 0.5) * 0.00005;
            particle.driftVelY += (Math.random() - 0.5) * 0.00005;
          }

          // Apply drift to particle position
          particle.x = particle.targetX + particle.driftX;
          particle.y = particle.targetY + particle.driftY;
        }

        // Draw particle
        const baseX = particle.x;
        const baseY = particle.y;

        const baseSize = 2.5 + Math.sin(particle.progress * Math.PI) * 0.5;

        ctx.fillStyle = "#3B82F6";
        ctx.globalAlpha = 0.8 + particle.progress * 0.2;
        ctx.beginPath();
        ctx.arc(baseX * width, baseY * height, baseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (assemblyTimerRef.current) {
        clearTimeout(assemblyTimerRef.current);
      }
    };
  }, [pointsLoaded]); // Removed onComplete and facePoints from dependencies to prevent constant reloads

  if (!pointsLoaded) {
    return (
      <div
        className={`${className} hidden md:block`}
        style={{
          position: "absolute",
          top: "-8%",
          right: 0,
          width: "50%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`${className} hidden md:block`}
      style={{
        position: "absolute",
        top: "-8%",
        right: 0,
        width: "50%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
