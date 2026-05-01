import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import useSound from 'use-sound';
import { SOUND_TRANSITION } from '../utils/sounds';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [playTransition] = useSound(SOUND_TRANSITION, { volume: 0.2 });

  useEffect(() => {
    playTransition();
    
    if (containerRef.current) {
      const el = containerRef.current;
      
      // Flash effect and glitch intro
      gsap.fromTo(el, 
        { opacity: 0, filter: 'blur(10px) brightness(2)', scale: 0.98 },
        { 
          opacity: 1, 
          filter: 'blur(0px) brightness(1)', 
          scale: 1, 
          duration: 0.8, 
          ease: 'power3.out',
          clearProps: 'all'
        }
      );

      // Add a slight mechanical shake
      gsap.fromTo(el,
        { x: -5 },
        { x: 0, duration: 0.1, ease: 'rough({ template: power0.none, strength: 1, points: 20, taper: "none", randomize: true, clamp: false })', clearProps: 'all' }
      );
    }
  }, [location.pathname, playTransition]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {children}
    </div>
  );
};
