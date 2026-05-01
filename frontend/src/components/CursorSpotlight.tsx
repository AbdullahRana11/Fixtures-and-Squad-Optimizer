import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CursorSpotlight: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <>
      {/* Primary bright spot */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[100] mix-blend-screen"
        animate={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.15), transparent 40%)`
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.1 }}
      />
      {/* Secondary ambient glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-[100] mix-blend-overlay opacity-50"
        animate={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.05), transparent 60%)`
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
      />
    </>
  );
};
