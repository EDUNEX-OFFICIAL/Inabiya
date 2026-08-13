'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type MotionHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

/** Play a lucide-animated icon once (hover/tap). Never loops. Skips if reduced-motion. */
export function useOnceIcon<T extends MotionHandle>() {
  const ref = useRef<T>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const play = useCallback(() => {
    if (!reduce) ref.current?.startAnimation();
  }, [reduce]);

  return { ref, play, reduce };
}
