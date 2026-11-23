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

function saveHidden(hidden: boolean) {
  try {
    if (hidden) window.localStorage.setItem(hiddenKey, '1');
    else window.localStorage.removeItem(hiddenKey);
  } catch {
    // The choice still applies for this visit when storage is unavailable.
  }
}

/* Small bee drawn for the "bring the bee back" button. */
function BeeIcon() {
  return (
    <svg viewBox="0 0 40 32" width="30" height="24" aria-hidden="true">
      <g fill="#fffaf0" fillOpacity=".85" stroke="#c99a3e" strokeWidth=".9">
        <ellipse cx="17" cy="8" rx="6.5" ry="8" transform="rotate(-18 17 8)" />
        <ellipse cx="24" cy="8.5" rx="5.5" ry="7" transform="rotate(16 24 8.5)" />
      </g>
      <ellipse cx="20" cy="19" rx="11" ry="7.5" fill="#f2b632" />
      <path d="M15 12.4v13.2M20.5 11.6v14.8M26 12.6v12.8" stroke="#2d1b12" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="31" cy="18" r="4.6" fill="#2d1b12" />
      <circle cx="32.6" cy="16.8" r="1.1" fill="#fff" />
      <path d="M8.6 19.4 5 20.6l3.4 1.4" fill="#2d1b12" />
    </svg>
  );
}

/**
 * Fixed, click-through canvas with a 3D bee that follows the shopper down and back up the page.
 * three.js and the 3 MB model only load after the page has finished loading, so the shop itself
 * stays fast. Skipped only when the browser has no WebGL.
 * A small X button flies beside the bee; pressing it hides the bee and remembers that choice.
 * While hidden, a round bee button sits above the cart so the shopper can bring the bee back.
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

  const hide = () => {
    setReady(false);
    setHidden(true);
    saveHidden(true);
  };
  const show = () => {
    setHidden(false);
    saveHidden(false);
  };

  if (hidden) {
    const label = t(text('إظهار النحلة', 'Show the bee'));
    return (
      <button type="button" onClick={show} aria-label={label} title={label} data-testid="button-show-bee" className="scroll-bee-show focus-ring">
        <BeeIcon />
      </button>
    );
  }

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
