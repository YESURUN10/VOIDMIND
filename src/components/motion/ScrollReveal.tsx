import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'bottom-right';
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  className = '',
  direction = 'bottom-right',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getInitialOffsets = () => {
    if (shouldReduceMotion) return { x: 0, y: 0 };
    switch (direction) {
      case 'bottom-right':
        return { x: 24, y: 20 };
      case 'up':
        return { x: 0, y: 24 };
      case 'down':
        return { x: 0, y: -24 };
      case 'left':
        return { x: 28, y: 0 };
      case 'right':
        return { x: -28, y: 0 };
      default:
        return { x: 24, y: 20 };
    }
  };

  const initial = getInitialOffsets();

  return (
    <motion.div
      initial={{ opacity: 0, ...initial }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: shouldReduceMotion ? 0.15 : 0.55,
          delay,
          ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        },
      }}
      viewport={{ once: true, amount: 0.1, margin: '0px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
