import { Variants } from 'framer-motion';

// Fade animations - optimized durations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  },
};

// Scale animations
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  },
};

export const scaleOnHover: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
};

// Stagger containers - faster
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0,
    },
  },
};

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Float animation - longer duration for smoother feel
export const float: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const floatSlow: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-12, 12, -12],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Pulse glow - optimized
export const pulseGlow: Variants = {
  initial: { opacity: 0.6, scale: 1 },
  animate: {
    opacity: [0.6, 0.8, 0.6],
    scale: [1, 1.02, 1],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Slide animations for navigation
export const slideDown: Variants = {
  initial: { y: -50, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  },
};

// Card hover effect
export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 0 0 rgba(168, 85, 247, 0)',
  },
  hover: {
    y: -6,
    boxShadow: '0 15px 30px rgba(168, 85, 247, 0.12)',
    transition: { duration: 0.2, ease: 'easeOut' }
  },
};

// Button press effect
export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.08 },
};

// Text reveal - optimized (removed heavy filter blur)
export const textReveal: Variants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
};

// Viewport animation settings
export const viewportOnce = {
  once: true,
  margin: '-100px',
};

export const viewportRepeat = {
  once: false,
  margin: '-50px',
};
