import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActionButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className,
  ...props 
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-mint-sentinel to-neon-aqua shadow-[0_0_20px_rgba(0,242,96,0.3)] hover:shadow-[0_0_30px_rgba(0,242,96,0.4)] text-void font-bold",
    secondary: "bg-gradient-to-r from-neon-aqua to-[#0088aa] shadow-[0_0_20px_rgba(5,213,255,0.3)] hover:shadow-[0_0_30px_rgba(5,213,255,0.4)]",
    ghost: "bg-white/5 border border-white/5 hover:bg-white/10",
  };

  return (
    <motion.button
      className={cn(
        "px-8 py-3 rounded-full font-clash uppercase tracking-wider text-sm transition-all duration-300",
        variants[variant],
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default ActionButton;
