import React, { useEffect, useState } from "react";
import "../assets/styles/PDFViewer.scss";

interface PDFViewerProps {
    url: string | null;
    onClose: () => void;
}

function PDFViewer({ url, onClose }: PDFViewerProps) {
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
        <div className="pdf-viewer" onClick={onClose}>
            <div
                className="pdf-window"
                onClick={(e) => e.stopPropagation()}
            >
                {/* TOP BAR */}
                <div className="pdf-window-topbar">
                    <div className="window-left">
                        <div className="window-controls">
                            <span className="red"></span>
                            <span className="yellow"></span>
                            <span className="green"></span>
                        </div>

                        <div className="window-title">
                             Document Viewer
                        </div>
                    </div>

                    <div className="window-actions">
                        <button
                            className="window-btn"
                            onClick={() => window.open(url, "_blank")}
                        >
                            Open New Tab
                        </button>

                        <button
                            className="window-close"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* PDF FRAME */}
                <div className="pdf-frame-wrapper">
                    {viewerLoading && (
                        <div className="viewer-loading">
                            Loading document...
                        </div>
                    )}

                    <iframe
                        src={url}
                        title="Vault Viewer"
                        onLoad={() => setViewerLoading(false)}
                    />
                </div>
            </div>
        </div>
    );
}

export default PDFViewer;