import { useEffect, useState } from 'react';
import type { ViewportBounds } from '../services/chatViewport';

function readViewport(): ViewportBounds {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 800, left: 0, top: 0, layoutWidth: 1200 };
  }
  const viewport = window.visualViewport;
  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    layoutWidth: window.innerWidth,
  };
}

export function useVisualViewport(): ViewportBounds {
  const [bounds, setBounds] = useState(readViewport);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => setBounds(readViewport());
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, []);
  return bounds;
}
