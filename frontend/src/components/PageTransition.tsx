import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactElement;
}

type Phase = 'idle' | 'exiting' | 'entering';

const EXIT_MS = 200;
const ENTER_MS = 260;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const realLocation = useLocation();

  const [displayedLocation, setDisplayedLocation] = useState(realLocation);
  const [phase, setPhase] = useState<Phase>('idle');

  const pendingLocation = useRef(realLocation);
  pendingLocation.current = realLocation;

  const prevKey = useRef(realLocation.key);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterTimerRef.current !== null) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (realLocation.key === prevKey.current) return;
    prevKey.current = realLocation.key;

    if (prefersReducedMotion()) {
      setDisplayedLocation(pendingLocation.current);
      setPhase('idle');
      return;
    }

    clearTimers();
    setPhase('exiting');

    exitTimerRef.current = setTimeout(() => {
      setDisplayedLocation(pendingLocation.current);
      setPhase('entering');

      enterTimerRef.current = setTimeout(() => {
        setPhase('idle');
        enterTimerRef.current = null;
      }, ENTER_MS);

      exitTimerRef.current = null;
    }, EXIT_MS);

    return clearTimers;
  }, [realLocation.key]);

  const cls =
    phase === 'exiting' ? 'page-exit' :
    phase === 'entering' ? 'page-enter' :
    'page-idle';

  return (
    <div className={cls}>
      {React.cloneElement(children, { location: displayedLocation })}
    </div>
  );
};
