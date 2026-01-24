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
    let app: any = null;

    const loadSpline = async () => {
      if (!canvasRef.current) {
        console.error('Canvas ref not available');
        return;
      }

      try {
        console.log('Loading Spline runtime...');
        // Dynamically import the Spline runtime
        const { Application } = await import('@splinetool/runtime');
        
        console.log('Creating Spline application...');
        app = new Application(canvasRef.current);
        
        console.log('Loading scene from /scene.splinecode...');
        await app.load('/scene.splinecode');
        
        console.log('Spline scene loaded successfully!');
        setLoading(false);

        // Listen for mouse down events on the Spline scene (button clicks)
        app.addEventListener('mouseDown', (e: any) => {
          console.log('Spline scene clicked:', e);
          // Check if a button was clicked (you can customize this based on your scene)
          if (e.target && e.target.name) {
            console.log('Clicked object:', e.target.name);
            // Transition to landing page when any interactive element is clicked
            onComplete();
          }
        });
      } catch (error) {
        console.error('Error loading Spline scene:', error);
        setError(error instanceof Error ? error.message : 'Failed to load animation');
        setLoading(false);
      }
    };

    loadSpline();

    return () => {
      if (app) {
        app.dispose();
      }
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
