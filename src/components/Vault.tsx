import React, { useEffect, useState, useMemo, useRef } from "react";
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
    favorite?: boolean;
    series?: string;
}

type SortOption = "newest" | "oldest" | "az" | "za" | "custom";
type FilterChip = "all" | "pdf" | "epub";
type DensityOption = "compact" | "comfortable" | "large";

function Vault() {
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerType, setViewerType] = useState<"pdf" | "epub" | null>(null);
    const [activeCard, setActiveCard] = useState<number | null>(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("newest");
    const [filterChip, setFilterChip] = useState<FilterChip>("all");
    const [showFavorites, setShowFavorites] = useState(false);
    const [density, setDensity] = useState<DensityOption>("comfortable");
    const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
    const [continueReading, setContinueReading] = useState<VaultItem | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchVaultItems();
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("continueReading");
        if (saved) {
            try {
                const item = JSON.parse(saved);
                const exists = vaultItems.some(i => i.id === item.id);
                if (exists) {
                    setContinueReading(item);
                } else {
                    localStorage.removeItem("continueReading");
                }
            } catch {
                localStorage.removeItem("continueReading");
            }
        }
    }, [vaultItems]);

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

    const openViewer = (url?: string, type?: string, item?: VaultItem) => {
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

        if (item) {
            const savedItem = { ...item };
            localStorage.setItem("continueReading", JSON.stringify(savedItem));
            setContinueReading(savedItem);
        }
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

    const toggleFavorite = async (item: VaultItem) => {
        if (!item.id) return;
        const newFavorite = !item.favorite;
        
        setVaultItems(prev =>
            prev.map(i =>
                i.id === item.id ? { ...i, favorite: newFavorite } : i
            )
        );

        const { error } = await supabase
            .from("vault_items")
            .update({ favorite: newFavorite })
            .eq("id", item.id);

        if (error) {
            console.error("Failed to update favorite:", error);
            setVaultItems(prev =>
                prev.map(i =>
                    i.id === item.id ? { ...i, favorite: !newFavorite } : i
                )
            );
        }
    };

    const toggleSeries = (seriesName: string) => {
        setExpandedSeries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(seriesName)) {
                newSet.delete(seriesName);
            } else {
                newSet.add(seriesName);
            }
            return newSet;
        });
    };

    const handleImageClick = (imageUrl: string) => {
        setExpandedImage(imageUrl);
    };

    const closeExpandedImage = () => {
        setExpandedImage(null);
    };

    // Highlight search terms
    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) => 
            regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
        );
    };

    const filteredAndSortedItems = useMemo(() => {
        let items = [...vaultItems];

        if (showFavorites) {
            items = items.filter(item => item.favorite);
        } else if (selectedCategory) {
            items = items.filter(item =>
                (item.category ?? "General") === selectedCategory
            );
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                (item.category?.toLowerCase() || "").includes(query) ||
                item.type.toLowerCase().includes(query)
            );
        }

        if (filterChip === "pdf") {
            items = items.filter(item =>
                !item.type.toLowerCase().includes("epub")
            );
        } else if (filterChip === "epub") {
            items = items.filter(item =>
                item.type.toLowerCase().includes("epub")
            );
        }

        switch (sortOption) {
            case "newest":
                items.sort((a, b) => {
                    if (!a.created_at) return 1;
                    if (!b.created_at) return -1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                break;
            case "oldest":
                items.sort((a, b) => {
                    if (!a.created_at) return 1;
                    if (!b.created_at) return -1;
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });
                break;
            case "az":
                items.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "za":
                items.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "custom":
                items.sort((a, b) => (b.display_order || 0) - (a.display_order || 0));
                break;
        }

        return items;
    }, [vaultItems, selectedCategory, showFavorites, searchQuery, filterChip, sortOption]);

    const groupedItems = useMemo(() => {
        const grouped: { [key: string]: VaultItem[] } = {};
        const standalone: VaultItem[] = [];

        filteredAndSortedItems.forEach(item => {
            if (item.series) {
                if (!grouped[item.series]) {
                    grouped[item.series] = [];
                }
                grouped[item.series].push(item);
            } else {
                standalone.push(item);
            }
        });

        return { grouped, standalone };
    }, [filteredAndSortedItems]);

    const categories = Array.from(
        new Set(vaultItems.map(item => item.category ?? "General"))
    );

    const stats = useMemo(() => {
        const total = vaultItems.length;
        const categoryCount = new Set(vaultItems.map(item => item.category ?? "General")).size;
        const pdfs = vaultItems.filter(item => !item.type.toLowerCase().includes("epub")).length;
        const epubs = vaultItems.filter(item => item.type.toLowerCase().includes("epub")).length;
        const seriesCount = new Set(vaultItems.filter(item => item.series).map(item => item.series)).size;
        return { total, categoryCount, pdfs, epubs, seriesCount };
    }, [vaultItems]);

    const getFolderCovers = (category: string): string[] => {
        const items = vaultItems.filter(item =>
            (item.category ?? "General") === category
        );
        return items.filter(item => item.image).map(item => item.image as string).slice(0, 3);
    };

    const getSeriesCount = (category: string): number => {
        const items = vaultItems.filter(item =>
            (item.category ?? "General") === category
        );
        return new Set(items.filter(item => item.series).map(item => item.series)).size;
    };

    const renderCard = (item: VaultItem, isNew: boolean = false) => {
        const isExpanded = expandedDescriptions.includes(item.id || 0);
        const isEpub = item.type?.toLowerCase().includes("epub");

        return (
            <div
                key={item.id}
                className={`
                    vault-book-card
                    vault-book-card-${viewMode}
                    ${isNew ? "new-entry" : ""}
                    ${item.status || ""}
                    vault-density-${density}
                `}
                onMouseEnter={() => setActiveCard(item.id || null)}
                onMouseLeave={() => setActiveCard(null)}
            >
                <div className="vault-card-glow"></div>

                {isNew && (
                    <div className="vault-new-badge">NEW</div>
                )}

                <button
                    className="vault-favorite-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                    }}
                    aria-label="Toggle favorite"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill={item.favorite ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </button>

                <div className="vault-book-image-wrapper">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="vault-book-image"
                            loading="lazy"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(item.image!);
                            }}
                        />
                    ) : (
                        <div className="vault-image-placeholder">
                            <span>📖</span>
                        </div>
                    )}
                </div>

                <div className="vault-book-content">
                    <h2>
                        {item.link ? (
                            <button
                                className="vault-book-title"
                                onClick={() => openViewer(item.link, item.type, item)}
                            >
                                {searchQuery.trim() ? highlightText(item.name, searchQuery) : item.name}
                            </button>
                        ) : (
                            searchQuery.trim() ? highlightText(item.name, searchQuery) : item.name
                        )}
                    </h2>

                    <div className="vault-meta-row">
                        <span className="vault-type-badge">{item.type}</span>
                        {item.created_at && (
                            <>
                                <span>•</span>
                                <span>{new Date(item.created_at).getFullYear()}</span>
                            </>
                        )}
                        {item.series && (
                            <>
                                <span>•</span>
                                <span className="vault-series-badge">{item.series}</span>
                            </>
                        )}
                    </div>

                    <div className="vault-description-dropdown">
                        <button
                            className="vault-description-toggle"
                            onClick={() => toggleDescription(item.id)}
                        >
                            Description
                            <span className={`vault-arrow ${isExpanded ? "expanded" : ""}`}>
                                ▼
                            </span>
                        </button>

                        <div className={`vault-description-content ${isExpanded ? "expanded" : ""}`}>
                            <p className="vault-book-description">
                                {searchQuery.trim() ? highlightText(item.description, searchQuery) : item.description}
                            </p>
                        </div>
                    </div>

                    <div className="vault-actions-container">
                        {item.link && (
                            <>
                                <button
                                    className="vault-read-btn"
                                    onClick={() => openViewer(item.link, item.type, item)}
                                >
                                    {isEpub ? "📖 Read" : "📄 Open"}
                                </button>

                                {isEpub && (
                                    <>
                                        <button
                                            className="vault-download-btn"
                                            onClick={() => handleDownload(item.link, item.name)}
                                        >
                                            ⬇ Download
                                        </button>
                                        <div className="vault-download-note">
                                            Download recommended for faster reading
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSeriesGroup = (seriesName: string, items: VaultItem[]) => {
        const isExpanded = expandedSeries.has(seriesName);
        const coverImage = items.find(item => item.image)?.image || null;

        return (
            <div key={seriesName} className="vault-series-group">
                <button
                    className="vault-series-header"
                    onClick={() => toggleSeries(seriesName)}
                >
                    <div className="vault-series-header-left">
                        {coverImage && (
                            <img
                                src={coverImage}
                                alt={seriesName}
                                className="vault-series-cover"
                            />
                        )}
                        <span className="vault-series-icon">📚</span>
                        <h3>{seriesName}</h3>
                        <span className="vault-series-count">
                            {items.length} {items.length === 1 ? "item" : "items"}
                        </span>
                    </div>
                    <span className={`vault-series-arrow ${isExpanded ? "expanded" : ""}`}>
                        ▼
                    </span>
                </button>
                {isExpanded && (
                    <div className={`vault-grid vault-grid-${viewMode}`}>
                        {items.map(item => renderCard(item, false))}
                    </div>
                )}
            </div>
        );
    };

    const renderCategoryCard = (category: string) => {
        const count = vaultItems.filter(
            item => (item.category ?? "General") === category
        ).length;
        const covers = getFolderCovers(category);
        const seriesCount = getSeriesCount(category);

        return (
            <button
                key={category}
                className="vault-folder-card"
                onClick={() => {
                    setSelectedCategory(category);
                    setShowFavorites(false);
                }}
            >
                <div className={`vault-folder-collage ${covers.length === 1 ? 'single' : ''}`}>
                    {covers.length > 0 ? (
                        <>
                            {covers[0] && (
                                <img
                                    src={covers[0]}
                                    alt=""
                                    className="vault-folder-cover cover-1"
                                    loading="lazy"
                                />
                            )}
                            {covers[1] && (
                                <img
                                    src={covers[1]}
                                    alt=""
                                    className="vault-folder-cover cover-2"
                                    loading="lazy"
                                />
                            )}
                            {covers[2] && (
                                <img
                                    src={covers[2]}
                                    alt=""
                                    className="vault-folder-cover cover-3"
                                    loading="lazy"
                                />
                            )}
                        </>
                    ) : (
                        <div className="cover-placeholder">📁</div>
                    )}
                </div>
                <div className="vault-folder-content">
                    <h2>{category}</h2>
                    <div className="vault-folder-meta">
                        <span>{count} entries</span>
                        {seriesCount > 0 && (
                            <>
                                <span className="dot">•</span>
                                <span>{seriesCount} series</span>
                            </>
                        )}
                    </div>
                    <div className="vault-folder-arrow">→</div>
                </div>
            </button>
        );
    };

    return (
        <div className={`vault-container ${activeCard ? "vault-active" : ""}`}>
            <div className="vault-header">
                <div className="vault-header-top">
                    <h1>Vault</h1>
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
                    <p>Personal archive of preserved works and completed creations.</p>
                </div>

                <div className="vault-stats">
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">📚</span>
                        <span className="vault-stat-value">{stats.total}</span>
                        <span className="vault-stat-label">Total</span>
                    </div>
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">📁</span>
                        <span className="vault-stat-value">{stats.categoryCount}</span>
                        <span className="vault-stat-label">Categories</span>
                    </div>
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">📄</span>
                        <span className="vault-stat-value">{stats.pdfs}</span>
                        <span className="vault-stat-label">PDFs</span>
                    </div>
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">📖</span>
                        <span className="vault-stat-value">{stats.epubs}</span>
                        <span className="vault-stat-label">EPUBs</span>
                    </div>
                    {stats.seriesCount > 0 && (
                        <div className="vault-stat-item">
                            <span className="vault-stat-icon">🔗</span>
                            <span className="vault-stat-value">{stats.seriesCount}</span>
                            <span className="vault-stat-label">Series</span>
                        </div>
                    )}
                </div>

                <div className="vault-controls-bar">
                    <div className="vault-search-wrapper">
                        <svg className="vault-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="vault-search-input"
                            placeholder="Search titles, authors, series..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="vault-search-clear"
                                onClick={() => setSearchQuery("")}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="vault-controls-right">
                        <select
                            className="vault-sort-select"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                        >
                            <option value="newest">Latest</option>
                            <option value="oldest">Oldest</option>
                            <option value="az">A → Z</option>
                            <option value="za">Z → A</option>
                            <option value="custom">Custom</option>
                        </select>

                        <select
                            className="vault-density-select"
                            value={density}
                            onChange={(e) => setDensity(e.target.value as DensityOption)}
                        >
                            <option value="compact">Compact</option>
                            <option value="comfortable">Comfortable</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                </div>

                <div className="vault-filter-chips">
                    <button
                        className={`vault-filter-chip ${filterChip === "all" ? "active" : ""}`}
                        onClick={() => setFilterChip("all")}
                    >
                        All
                    </button>
                    <button
                        className={`vault-filter-chip ${filterChip === "pdf" ? "active" : ""}`}
                        onClick={() => setFilterChip("pdf")}
                    >
                        📄 PDF
                    </button>
                    <button
                        className={`vault-filter-chip ${filterChip === "epub" ? "active" : ""}`}
                        onClick={() => setFilterChip("epub")}
                    >
                        📖 EPUB
                    </button>
                    <button
                        className={`vault-filter-chip vault-favorites-chip ${showFavorites ? "active" : ""}`}
                        onClick={() => {
                            setShowFavorites(!showFavorites);
                            setSelectedCategory(null);
                        }}
                    >
                        ⭐ Favorites
                    </button>
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
                    <p className="vault-loading-text">Loading archive...</p>
                </div>
            ) : (
                <>
                    {continueReading && !selectedCategory && !showFavorites && (
                        <div className="vault-continue-reading">
                            <h3>Continue Reading</h3>
                            <div className="vault-continue-card">
                                {continueReading.image && (
                                    <img
                                        src={continueReading.image}
                                        alt={continueReading.name}
                                        className="vault-continue-cover"
                                    />
                                )}
                                <div className="vault-continue-info">
                                    <h4>{continueReading.name}</h4>
                                    <span className="vault-continue-type">{continueReading.type}</span>
                                    <button
                                        className="vault-continue-btn"
                                        onClick={() => openViewer(continueReading.link, continueReading.type, continueReading)}
                                    >
                                        Resume Reading
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!selectedCategory && !showFavorites ? (
                        <div className="vault-folder-grid">
                            {categories.map(category => renderCategoryCard(category))}
                        </div>
                    ) : (
                        <>
                            <div className="vault-folder-header">
                                <button
                                    className="vault-back-btn"
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        setShowFavorites(false);
                                    }}
                                >
                                    ← Back
                                </button>
                                <div className="vault-category-banner">
                                    <span className="vault-category-banner-icon">
                                        {showFavorites ? "⭐" : "📁"}
                                    </span>
                                    <h2>
                                        {showFavorites ? "Favorites" : selectedCategory}
                                    </h2>
                                </div>
                                <span className="vault-item-count">
                                    {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? "item" : "items"}
                                </span>
                            </div>

                            {Object.entries(groupedItems.grouped).map(([seriesName, items]) =>
                                renderSeriesGroup(seriesName, items)
                            )}

                            {groupedItems.standalone.length > 0 && (
                                <div className={`vault-grid vault-grid-${viewMode}`}>
                                    {groupedItems.standalone.map((item, index) =>
                                        renderCard(item, index === 0 && !selectedCategory && !showFavorites)
                                    )}
                                </div>
                            )}

                            {filteredAndSortedItems.length === 0 && (
                                <div className="vault-empty-state">
                                    <div className="empty-icon">📭</div>
                                    <p>No items found matching your criteria.</p>
                                    {(searchQuery || filterChip !== "all" || showFavorites) && (
                                        <button
                                            className="empty-action"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setFilterChip("all");
                                                setShowFavorites(false);
                                            }}
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {viewerType === "pdf" && (
                <PDFViewer url={viewerUrl} onClose={closeViewer} />
            )}

            {viewerType === "epub" && (
                <EPUBViewer url={viewerUrl} onClose={closeViewer} />
            )}

            {expandedImage && (
                <div className="image-expand-overlay" onClick={closeExpandedImage}>
                    <div className="image-expand-content" onClick={(e) => e.stopPropagation()}>
                        <img src={expandedImage} alt="Expanded cover" />
                        <button className="image-expand-close" onClick={closeExpandedImage}>✕</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Vault;