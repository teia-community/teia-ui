/**
 *
 *
 */
export const fadeIn = () => {
  return {
    initial: { opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } },
  }
}

/**
 * Transition used by @atom/dropdown
 */
export const containerMenu = {
  hidden: {
    border: 0,
    y: -25,
    opacity: 0,
    transition: {
      ease: 'easeOut',
      duration: 0.2,
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
  show: {
    border: '1px',
    y: 0,
    opacity: 1,
    transition: {
      ease: 'easeOut',

      staggerChildren: 0.04,
    },
  },
}

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.333 } },
  exit: { opacity: 0, transition: { ease: 'easeInOut' } },
}
