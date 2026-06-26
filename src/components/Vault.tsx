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

function Vault() {

    const [vaultItems, setVaultItems] =
        useState<VaultItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [viewerUrl, setViewerUrl] =
        useState<string | null>(null);

    const [viewerType, setViewerType] =
        useState<"pdf" | "epub" | null>(null);

    const [activeCard, setActiveCard] =
        useState<number | null>(null);

    const [expandedDescriptions, setExpandedDescriptions] =
        useState<number[]>([]);

    const [selectedCategory, setSelectedCategory] =
        useState<string | null>(null);

    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    useEffect(() => {

        fetchVaultItems();

    }, []);

    const fetchVaultItems = async () => {

        setLoading(true);

        const { data, error } = await supabase
            .from("vault_items")
            .select("*")
            .order("display_order", {
                ascending: false
            })
            .order("created_at", {
                ascending: false
            });

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

        // Handle Google Drive links
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

        if (match) {

            finalUrl = `https://drive.google.com/file/d/${match[1]}/preview`;

        }

        // Determine viewer type based on the item type
        const itemType = type?.toLowerCase() || "";
        
        if (itemType.includes("epub")) {
            setViewerType("epub");
        } else {
            // Default to PDF for PDF, DOC, or any other type
            setViewerType("pdf");
        }

        setViewerUrl(finalUrl);

    };

    const closeViewer = () => {

        setViewerUrl(null);
        setViewerType(null);

    };

    const toggleDescription = (id?: number) => {

        if (!id) return;

        setExpandedDescriptions(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );

    };

    const handleDownload = (url?: string, name?: string) => {

        if (!url) return;

        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from URL or use the item name
        let filename = name || 'document';
        
        // Try to get filename from URL
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
            filename = lastPart;
        } else if (!filename.includes('.')) {
            // Add .epub extension if not present
            filename = `${filename}.epub`;
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    };

    // ==========================
    // Folder Categories
    // ==========================

    const categories = Array.from(
        new Set(
            vaultItems.map(
                item => item.category ?? "General"
            )
        )
    );

    const displayedItems = selectedCategory
        ? vaultItems.filter(
            item =>
                (item.category ?? "General") === selectedCategory
        )
        : [];

    return (

        <div
            className={`vault-container ${
                activeCard ? "vault-active" : ""
            }`}
        >

            {/* HEADER */}

            <div className="vault-header">

                <div className="vault-header-top">
                    <h1>Vault Library</h1>

                    <div className="vault-view-controls">
                        <button
                            className={`vault-view-btn ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid view"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                            </svg>
                        </button>
                        <button
                            className={`vault-view-btn ${viewMode === "list" ? "active" : ""}`}
                            onClick={() => setViewMode("list")}
                            aria-label="List view"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="vault-intro">

                    <p>
                        Personal archive of preserved works and completed
                        creations.
                    </p>

                </div>

            </div>
                        {loading ? (

                <div className="vault-loading">

                    <div className="vault-loading-grid">

                        {[...Array(6)].map((_, index) => (

                            <div
                                key={index}
                                className="vault-skeleton-card"
                            >

                                <div className="vault-skeleton-image"></div>

                                <div className="vault-skeleton-line short"></div>

                                <div className="vault-skeleton-line"></div>

                                <div className="vault-skeleton-line"></div>

                            </div>

                        ))}

                    </div>

                    <p className="vault-loading-text">

                        Accessing archive...

                    </p>

                </div>

            ) : !selectedCategory ? (

                <div className="vault-folder-grid">

                    {categories.map(category => {

                        const count = vaultItems.filter(
                            item =>
                                (item.category ?? "General") === category
                        ).length;

                        return (

                            <button
                                key={category}
                                className="vault-folder-card"
                                onClick={() =>
                                    setSelectedCategory(category)
                                }
                            >

                                <div className="vault-folder-icon">

                                    📁

                                </div>

                                <div className="vault-folder-content">

                                    <h2>

                                        {category}

                                    </h2>

                                    <span>

                                        {count} {count === 1 ? "Entry" : "Entries"}

                                    </span>

                                </div>

                            </button>

                        );

                    })}

                </div>

            ) : (

                <>

                    <div className="vault-folder-header">

                        <button
                            className="vault-back-btn"
                            onClick={() =>
                                setSelectedCategory(null)
                            }
                        >

                            ← Back

                        </button>

                        <h2>

                            📁 {selectedCategory}

                        </h2>

                        <span className="vault-item-count">
                            {displayedItems.length} {displayedItems.length === 1 ? "Entry" : "Entries"}
                        </span>

                    </div>

                    <div className={`vault-grid vault-grid-${viewMode}`}>

                        {displayedItems.map((item, index) => {

                            const isExpanded =
                                expandedDescriptions.includes(item.id || 0);
                            
                            const isEpub = item.type?.toLowerCase().includes("epub");

                            return (

                                <div
                                    key={item.id}
                                    className={`
                                        vault-book-card
                                        vault-book-card-${viewMode}
                                        ${index === 0 ? "new-entry" : ""}
                                        ${item.status || ""}
                                    `}
                                    onMouseEnter={() =>
                                        setActiveCard(item.id || null)
                                    }
                                    onMouseLeave={() =>
                                        setActiveCard(null)
                                    }
                                >

                                    <div className="vault-card-glow"></div>

                                    {index === 0 && (

                                        <div className="vault-new-badge">

                                            NEW ENTRY

                                        </div>

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
                                                <span>ARCHIVE</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="vault-book-content">

                                        <span className="vault-id">

                                            ARCHIVE ENTRY #

                                            {String(item.id || 0).padStart(3, "0")}

                                        </span>

                                        <h2>

                                            {item.link ? (

                                                <button
                                                    className="vault-book-title"
                                                    onClick={() =>
                                                        openViewer(item.link, item.type)
                                                    }
                                                >

                                                    {item.name}

                                                </button>

                                            ) : (

                                                item.name

                                            )}

                                        </h2>

                                        <div className="vault-meta-row">

                                            <span className="vault-type-badge">{item.type}</span>

                                            <span>•</span>

                                            <span>Private Archive</span>

                                            {item.created_at && (

                                                <>
                                                    <span>•</span>

                                                    <span>

                                                        {new Date(
                                                            item.created_at
                                                        ).getFullYear()}

                                                    </span>

                                                </>

                                            )}

                                        </div>

                                        <div className="vault-description-dropdown">

                                            <button
                                                className="vault-description-toggle"
                                                onClick={() =>
                                                    toggleDescription(item.id)
                                                }
                                            >

                                                Description

                                                <span
                                                    className={`vault-arrow ${
                                                        isExpanded
                                                            ? "expanded"
                                                            : ""
                                                    }`}
                                                >

                                                    ▼

                                                </span>

                                            </button>

                                            <div
                                                className={`vault-description-content ${
                                                    isExpanded
                                                        ? "expanded"
                                                        : ""
                                                }`}
                                            >

                                                <p className="vault-book-description">

                                                    {item.description}

                                                </p>

                                            </div>

                                        </div>

                                        {/* Buttons Container */}
                                        <div className="vault-actions-container">
                                            {item.link && (
                                                <>
                                                    <button
                                                        className="vault-read-btn"
                                                        onClick={() =>
                                                            openViewer(item.link, item.type)
                                                        }
                                                    >
                                                        {isEpub ? "Open EPUB" : "Open Entry"}
                                                    </button>

                                                    {isEpub && (
                                                        <>
                                                            <button
                                                                className="vault-download-btn"
                                                                onClick={() =>
                                                                    handleDownload(item.link, item.name)
                                                                }
                                                            >
                                                                 Download EPUB
                                                            </button>
                                                            <div className="vault-download-note">
                                                                 Downloading is preferable as the reader is slow to load
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                    </div>

                                </div>

                            );

                        })}

                    </div>

                </>

            )}

            {/* Conditional Viewer Rendering */}
            {viewerType === "pdf" && (
                <PDFViewer
                    url={viewerUrl}
                    onClose={closeViewer}
                />
            )}

            {viewerType === "epub" && (
                <EPUBViewer
                    url={viewerUrl}
                    onClose={closeViewer}
                />
            )}

        </div>

    );

}

export default Vault;