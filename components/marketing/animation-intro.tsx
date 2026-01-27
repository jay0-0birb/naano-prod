'use client';

import { useEffect, useRef, useState } from 'react';
import { TextType } from '@/components/ui/text-type';

interface AnimationIntroProps {
  onComplete: () => void;
  isTransitioning: boolean;
}

export function AnimationIntro({ onComplete, isTransitioning }: AnimationIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AnimationIntro mounted');
    
    // Skip Spline loading - not used
    // Just set loading to false after a short delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-colors duration-[1500ms] ease-in-out"
      style={{
        backgroundColor: isTransitioning ? '#ffffff' : '#000000'
      }}
    >
      {/* Naano text - top left */}
      {!loading && !isTransitioning && (
        <div className="absolute top-8 left-8 z-10">
          <TextType
            text="naano"
            typingSpeed={50}
            initialDelay={500}
            showCursor={true}
            cursorBlinkDuration={0.5}
            className="text-white text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          />
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        id="canvas3d"
        className={`transition-opacity duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
      />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xl">Loading animation...</div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
      )}
    </div>
  );
}
