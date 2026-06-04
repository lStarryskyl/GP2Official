import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactElement;
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.25, ease: EASE } }}
        style={{ minHeight: '100vh' }}
      >
        {React.cloneElement(children, { location })}
      </m.div>
    </AnimatePresence>
  );
};
