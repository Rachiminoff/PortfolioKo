// EPUBViewer.tsx

import React, { useEffect, useRef, useState } from 'react';

import '../assets/styles/EPUBViewer.scss';

interface EPUBViewerProps {
  url: string | null;
  onClose: () => void;
}

function EPUBViewer({ url, onClose }: EPUBViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const bookRef = useRef<any>(null);

  const renditionRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [loadingTime, setLoadingTime] = useState(0);

  const [loadingStage, setLoadingStage] = useState('Preparing EPUB...');

  useEffect(() => {
    if (!url) return;

    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);

      document.body.style.overflow = oldOverflow || 'auto';
    };
  }, [url, onClose]);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    const cleanup = () => {
      try {
        renditionRef.current?.destroy();
      } catch {}

      try {
        bookRef.current?.destroy();
      } catch {}

      renditionRef.current = null;

      bookRef.current = null;
    };

    const loadEPUB = async () => {
      const start = Date.now();

      const timer = setInterval(() => {
        setLoadingTime(Math.floor((Date.now() - start) / 1000));
      }, 500);

      const timeout = setTimeout(() => {
        if (!cancelled) {
          setError('EPUB loading timed out.');

          setLoading(false);
        }
      }, 30000);

      try {
        setLoading(true);

        setError(null);

        setLoadingStage('Loading reader...');

        // Lazy load epubjs
        const epubModule = await import('epubjs');

        const ePub = epubModule.default ?? epubModule;

        if (cancelled) return;

        setLoadingStage('Opening EPUB...');

        const book = ePub(url);

        bookRef.current = book;

        if (cancelled) return;

        setLoadingStage('Rendering page...');

        const rendition = book.renderTo(viewerRef.current!, {
          width: '100%',
          height: '100%',
          spread: 'none',
          flow: 'paginated',
        });

        renditionRef.current = rendition;

        await rendition.display();

        if (cancelled) return;

        setLoading(false);
      } catch (err) {
        console.error('EPUB loading error:', err);

        if (!cancelled) {
          setError('Failed to load EPUB. The file may be corrupted or unsupported.');

          setLoading(false);
        }
      } finally {
        clearInterval(timer);

        clearTimeout(timeout);
      }
    };

    loadEPUB();

    return () => {
      cancelled = true;

      cleanup();
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="epub-viewer" onClick={onClose}>
      <div className="epub-window" onClick={(e) => e.stopPropagation()}>
        <div className="epub-window-topbar">
          <div className="window-left">
            <div className="window-controls">
              <span className="red" />
              <span className="yellow" />
              <span className="green" />
            </div>

            <div className="window-title">📖 EPUB Viewer</div>
          </div>

          <div className="window-actions">
            <button className="window-btn" onClick={() => window.open(url, '_blank')}>
              Download EPUB
            </button>

            <button className="window-close" aria-label="Close EPUB viewer" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="epub-frame-wrapper">
          <div ref={viewerRef} className="epub-rendition" />

          {loading && (
            <div className="viewer-loading">
              <div className="loading-spinner" />

              <span>
                {loadingStage}

                <br />

                <small>{loadingTime}s elapsed</small>
              </span>
            </div>
          )}

          {error && (
            <div className="viewer-error">
              <span className="error-icon">⚠️</span>

              <p>{error}</p>

              <button className="window-btn" onClick={() => window.open(url, '_blank')}>
                Download EPUB
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EPUBViewer;
