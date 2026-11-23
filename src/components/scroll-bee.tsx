import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { text, useI18n } from '@/i18n';

const hiddenKey = 'naqaa-scroll-bee-hidden';

function readHidden() {
  try {
    return window.localStorage.getItem(hiddenKey) === '1';
  } catch {
    return false;
  }
}

/**
 * Fixed, click-through canvas with a 3D bee that follows the shopper down and back up the page.
 * three.js and the 3 MB model only load after the page has finished loading, so the shop itself
 * stays fast. Skipped for visitors who ask for reduced motion or whose browser has no WebGL.
 * A small X button flies beside the bee; pressing it removes the bee and remembers that choice.
 */
export function ScrollBee() {
  const { t } = useI18n();
  const ref = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(readHidden);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || hidden) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      const probe = document.createElement('canvas');
      if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return;
    } catch {
      return;
    }

    let stop: (() => void) | undefined;
    let cancelled = false;
    const onMove = (x: number, y: number, size: number) => {
      const btn = closeRef.current;
      if (!btn) return;
      // Sit just above the bee's top corner; 16 = half the button.
      btn.style.transform = `translate3d(${Math.round(x + size * 0.32 - 16)}px, ${Math.round(y - size * 0.5 - 16)}px, 0)`;
    };
    const begin = () => {
      import('./scroll-bee-scene').then(({ startScrollBee }) => {
        if (cancelled) return;
        stop = startScrollBee(canvas, { modelUrl: '/models/bee.glb', wingUrl: '/models/bee-wing.jpg', onReady: () => setReady(true), onMove });
      }).catch(err => console.warn('Scroll bee unavailable', err));
    };
    const idle = (cb: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 600));
    const onLoad = () => idle(begin);
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', onLoad);
      stop?.();
    };
  }, [hidden]);

  if (hidden) return null;

  const hide = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(hiddenKey, '1');
    } catch {
      // Still hidden for this visit when storage is unavailable.
    }
  };

  return (
    <>
      <canvas ref={ref} aria-hidden="true" className={`scroll-bee${ready ? ' is-ready' : ''}`} />
      {ready && (
        <button ref={closeRef} type="button" onClick={hide} aria-label={t(text('إخفاء النحلة', 'Hide the bee'))} title={t(text('إخفاء النحلة', 'Hide the bee'))} className="scroll-bee-close focus-ring">
          <X size={16} strokeWidth={2.6} aria-hidden="true" />
        </button>
      )}
    </>
  );
}
