'use client';

import { useEffect, useState } from 'react';

interface TextTypeProps {
  text: string;
  typingSpeed?: number; // milliseconds per character
  initialDelay?: number; // milliseconds before typing starts
  className?: string;
  style?: React.CSSProperties;
  showCursor?: boolean;
  cursorBlinkDuration?: number;
}

export function TextType({
  text,
  typingSpeed = 50,
  initialDelay = 0,
  className = '',
  style,
  showCursor = true,
  cursorBlinkDuration = 0.5,
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Initial delay before typing starts
    const startTimer = setTimeout(() => {
      setIsTyping(true);
    }, initialDelay);

    return () => clearTimeout(startTimer);
  }, [initialDelay]);

  useEffect(() => {
    if (!isTyping || currentIndex >= text.length) {
      if (currentIndex >= text.length) {
        setIsTyping(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(currentIndex + 1);
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, typingSpeed, isTyping]);

  return (
    <span className={className} style={style}>
      {displayedText}
      {showCursor && (
        <span
          className="inline-block ml-0.5"
          style={{
            animation: `blink ${cursorBlinkDuration}s ease-in-out infinite`,
          }}
        >
          |
        </span>
      )}
    </span>
  );
}
