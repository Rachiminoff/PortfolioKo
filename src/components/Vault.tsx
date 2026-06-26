// Vault.tsx
import React, { useEffect, useState } from "react";
import "../assets/styles/Vault.scss";
import { supabase } from "../lib/supabase";
import PDFViewer from "./PDFViewer";
import EPUBViewer from "./EPUBViewer";

interface VaultItem {
    id?: number;
    name: string;
    type: string;
    category?: string;
    description: string;
    link?: string;
    image?: string;
    status?: string;
    created_at?: string;
    display_order?: number;
}

type ViewMode = "grid" | "list";

function Vault() {
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerType, setViewerType] = useState<"pdf" | "epub" | null>(null);
    const [activeCard, setActiveCard] = useState<number | null>(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    useEffect(() => {
        fetchVaultItems();
    }, []);

    const fetchVaultItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("vault_items")
            .select("*")
            .order("display_order", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setVaultItems(data || []);
        }
        setLoading(false);
    };

    const openViewer = (url?: string, type?: string) => {
        if (!url) return;
        let finalUrl = url;
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            finalUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        const itemType = type?.toLowerCase() || "";
        if (itemType.includes("epub")) {
            setViewerType("epub");
        } else {
            setViewerType("pdf");
        }
        setViewerUrl(finalUrl);
    };

    const closeViewer = () => {
        setViewerUrl(null);
        setViewerType(null);
    };

    const handleDownload = (url?: string, name?: string) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        let filename = name || 'document';
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
            filename = lastPart;
        } else if (!filename.includes('.')) {
            filename = `${filename}.epub`;
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const categories = Array.from(
        new Set(vaultItems.map(item => item.category ?? "General"))
    );

    const displayedItems = selectedCategory
        ? vaultItems.filter(item => (item.category ?? "General") === selectedCategory)
        : [];

    return (
        <div className={`vault-container ${activeCard ? "vault-active" : ""}`}>
            {/* HEADER */}
            <div className="vault-header">
                <div className="vault-header-top">
                    <h1>Vault Library</h1>
                    {selectedCategory && (
                        <div className="vault-view-controls">
                            <button
                                className={`vault-view-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                aria-label="Grid view"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                </svg>
                            </button>
                            <button
                                className={`vault-view-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewMode("list")}
                                aria-label="List view"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                <div className="vault-intro">
                    <p>Personal archive of preserved works and completed creations.</p>
                </div>
            </div>

            {loading ? (
                <div className="vault-loading">
                    <div className="vault-loading-grid">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="vault-skeleton-card">
                                <div className="vault-skeleton-image"></div>
                                <div className="vault-skeleton-line short"></div>
                                <div className="vault-skeleton-line"></div>
                                <div className="vault-skeleton-line"></div>
                            </div>
                        ))}
                    </div>
                    <p className="vault-loading-text">Accessing archive...</p>
                </div>
            ) : !selectedCategory ? (
                <div className="vault-folder-grid">
                    {categories.map(category => {
                        const count = vaultItems.filter(
                            item => (item.category ?? "General") === category
                        ).length;
                        return (
                            <button
                                key={category}
                                className="vault-folder-card"
                                onClick={() => setSelectedCategory(category)}
                            >
                                <div className="vault-folder-icon">📁</div>
                                <div className="vault-folder-content">
                                    <h2>{category}</h2>
                                    <span>{count} {count === 1 ? "Entry" : "Entries"}</span>
                                </div>
                                <div className="vault-folder-arrow">→</div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <>
                    <div className="vault-folder-header">
                        <button
                            className="vault-back-btn"
                            onClick={() => setSelectedCategory(null)}
                        >
                            ← Back
                        </button>
                        <h2>📁 {selectedCategory}</h2>
                        <span className="vault-item-count">{displayedItems.length} items</span>
                    </div>

                    <div className={`vault-grid vault-grid-${viewMode}`}>
                        {displayedItems.map((item, index) => {
                            const isNew = index === 0;

                            return (
                                <div
                                    key={item.id}
                                    className={`
                                        vault-book-card 
                                        vault-book-card-${viewMode}
                                        ${isNew ? "new-entry" : ""}
                                        ${item.status || ""}
                                    `}
                                    onMouseEnter={() => setActiveCard(item.id || null)}
                                    onMouseLeave={() => setActiveCard(null)}
                                >
                                    <div className="vault-card-glow"></div>

                                    {isNew && (
                                        <div className="vault-new-badge">NEW</div>
                                    )}

                                    <div className="vault-book-image-wrapper">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="vault-book-image"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="vault-image-placeholder">
                                                <span>📄</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="vault-book-content">
                                        <h2>
                                            {item.link ? (
                                                <button
                                                    className="vault-book-title"
                                                    onClick={() => openViewer(item.link, item.type)}
                                                >
                                                    {item.name}
                                                </button>
                                            ) : (
                                                item.name
                                            )}
                                        </h2>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {viewerType === "pdf" && (
                <PDFViewer url={viewerUrl} onClose={closeViewer} />
            )}
            {viewerType === "epub" && (
                <EPUBViewer url={viewerUrl} onClose={closeViewer} />
            )}
        </div>
    );
}

export default Vault;