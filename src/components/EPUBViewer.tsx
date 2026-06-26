// EPUBViewer.tsx
import React, { useEffect, useState, useRef } from "react";
import "../assets/styles/EPUBViewer.scss";

interface EPUBViewerProps {
    url: string | null;
    onClose: () => void;
}

function EPUBViewer({ url, onClose }: EPUBViewerProps) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const bookRef = useRef<any>(null);
    const renditionRef = useRef<any>(null);

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
            // Clean up EPUB viewer
            if (renditionRef.current) {
                renditionRef.current.destroy();
                renditionRef.current = null;
            }
            if (bookRef.current) {
                bookRef.current.destroy();
                bookRef.current = null;
            }
        };
    }, [url, onClose]);

    useEffect(() => {
        if (!url || !viewerRef.current) return;

        const loadEPUB = async () => {
            try {
                setLoading(true);
                setError(null);

                // Use require instead of dynamic import
                const Epub = require("epubjs");
                const Book = Epub.default || Epub;

                // Create a new book instance
                const book = new Book(url);
                bookRef.current = book;

                // Create rendition (viewer)
                const rendition = book.renderTo(viewerRef.current, {
                    width: "100%",
                    height: "100%",
                    spread: "none",
                    flow: "paginated",
                    managed: true,
                });
                renditionRef.current = rendition;

                // Load and display the book
                await rendition.display();

                // Get title from metadata
                try {
                    const metadata = await book.loaded.metadata;
                    const titleEl = document.querySelector(".window-title");
                    if (titleEl && metadata.title) {
                        titleEl.textContent = `📖 ${metadata.title}`;
                    }
                } catch (e) {
                    console.log("Could not load metadata");
                }

                setLoading(false);

            } catch (err) {
                console.error("Error loading EPUB:", err);
                setError("Failed to load EPUB. The file may be unsupported or inaccessible.");
                setLoading(false);
            }
        };

        loadEPUB();

        // Cleanup function
        return () => {
            if (renditionRef.current) {
                renditionRef.current.destroy();
                renditionRef.current = null;
            }
            if (bookRef.current) {
                bookRef.current.destroy();
                bookRef.current = null;
            }
        };

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
                        <div className="window-title">📖 EPUB Viewer</div>
                    </div>

                    <div className="window-actions">
                        <button
                            className="window-btn"
                            onClick={() => window.open(url, "_blank")}
                        >
                            Download EPUB
                        </button>
                        <button className="window-close" onClick={onClose}>
                            ×
                        </button>
                    </div>
                </div>

                {/* EPUB RENDERING AREA */}
                <div className="epub-frame-wrapper">
                    {loading && (
                        <div className="viewer-loading">
                            <div className="loading-spinner"></div>
                            <span>Loading EPUB...</span>
                        </div>
                    )}
                    {error && (
                        <div className="viewer-error">
                            <span className="error-icon">⚠️</span>
                            <p>{error}</p>
                            <button
                                className="window-btn"
                                onClick={() => window.open(url, "_blank")}
                            >
                                Download EPUB
                            </button>
                        </div>
                    )}
                    <div 
                        ref={viewerRef} 
                        className="epub-rendition"
                        style={{ 
                            display: loading || error ? "none" : "block",
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default EPUBViewer;