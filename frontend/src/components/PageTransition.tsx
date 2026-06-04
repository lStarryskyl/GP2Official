import React from 'react';
import { useLocation } from 'react-router-dom';

// Plain CSS transition — no framer-motion wrapper so Layout's fixed
// positioning and flex children are never disrupted.
interface PageTransitionProps {
  children: React.ReactElement;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  return React.cloneElement(children, { location });
};
