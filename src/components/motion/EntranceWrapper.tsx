import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface EntranceWrapperProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  staggerIndex?: number;
}

export const EntranceWrapper: React.FC<EntranceWrapperProps> = ({
  children,
  delay = 0,
  className = '',
  staggerIndex = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const calculatedDelay = delay + staggerIndex * 0.06;

  // Signature bottom-right entrance trajectory
  const variants = {
    hidden: {
      opacity: 0,
      x: shouldReduceMotion ? 0 : 28, // +28px horizontal offset
      y: shouldReduceMotion ? 0 : 20, // +20px vertical offset
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.6,
        delay: calculatedDelay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number], // power3.out polished easing
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};
