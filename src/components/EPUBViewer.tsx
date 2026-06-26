// EPUBViewer.tsx
import React, { useEffect, useState } from "react";
import "./EPUBViewer.scss";

interface EPUBViewerProps {
  url: string | null;
  onClose: () => void;
}

function EPUBViewer({ url, onClose }: EPUBViewerProps) {
  const [viewerLoading, setViewerLoading] = useState(true);

  useEffect(() => {
    if (!url) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = originalOverflow || "auto";
    };
  }, [url, onClose]);

  useEffect(() => {
    setViewerLoading(true);
  }, [url]);

  if (!url) return null;

  return (
    <div className="epub-viewer" onClick={onClose}>
      <div className="epub-window" onClick={(e) => e.stopPropagation()}>
        {/* TOP BAR */}
        <div className="epub-window-topbar">
          <div className="window-left">
            <div className="window-controls">
              <span className="red"></span>
              <span className="yellow"></span>
              <span className="green"></span>
            </div>
            <div className="window-title">EPUB Viewer</div>
          </div>

          <div className="window-actions">
            <button
              className="window-btn"
              onClick={() => window.open(url, "_blank")}
            >
              Open New Tab
            </button>
            <button className="window-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* EPUB FRAME */}
        <div className="epub-frame-wrapper">
          {viewerLoading && (
            <div className="viewer-loading">Loading document...</div>
          )}
          <iframe
            src={url}
            title="EPUB Viewer"
            onLoad={() => setViewerLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default EPUBViewer;