import { useEffect, useRef } from 'react';

/**
 * Custom hook to trigger viewport-based entrance animations via IntersectionObserver.
 * - Triggers only once when entering viewport
 * - Respects prefers-reduced-motion
 * - Does not cause layout shift or performance degradation
 */
export function useScrollReveal(options = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      node.classList.add('reveal-visible');
      const items = node.querySelectorAll('.reveal-init');
      items.forEach((item) => item.classList.add('reveal-visible'));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      node.classList.add('reveal-visible');
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          // Also reveal nested reveal-init items if container is triggered
          const childReveals = entry.target.querySelectorAll('.reveal-init');
          childReveals.forEach((child) => child.classList.add('reveal-visible'));
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return ref;
}

export default useScrollReveal;
