import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Icon } from "@iconify/react";
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
    const [loadError, setLoadError] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [viewerType, setViewerType] = useState<"pdf" | "epub" | null>(null);
    const [activeCard, setActiveCard] = useState<number | null>(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("newest");
    const [filterChip, setFilterChip] = useState<FilterChip>("all");
    const [showFavorites, setShowFavorites] = useState(false);
    const [density, setDensity] = useState<DensityOption>("comfortable");
    const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
    const [continueReading, setContinueReading] = useState<VaultItem | null>(null);
    const [isPageVisible, setIsPageVisible] = useState(false);

    // Page entrance animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPageVisible(true);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // Fetch vault items
    useEffect(() => {
        fetchVaultItems();
    }, []);

    // Load continue reading from localStorage
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

    // Lock body scroll when viewer is open
    useEffect(() => {
        if (viewerUrl) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [viewerUrl]);

    const fetchVaultItems = async () => {
        setLoading(true);
        setLoadError(false);
        const { data, error } = await supabase
            .from("vault_items")
            .select("*")
            .order("display_order", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            setLoadError(true);
        } else {
            setVaultItems(data || []);
        }
        setLoading(false);
    };

    const openViewer = useCallback((url?: string, type?: string, item?: VaultItem) => {
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
    }, []);

    const closeViewer = useCallback(() => {
        setViewerUrl(null);
        setViewerType(null);
    }, []);

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
        const catCount = new Set(vaultItems.map(item => item.category ?? "General")).size;
        const pdfs = vaultItems.filter(item => !item.type.toLowerCase().includes("epub")).length;
        const epubs = vaultItems.filter(item => item.type.toLowerCase().includes("epub")).length;
        return { total, categories: catCount, pdfs, epubs };
    }, [vaultItems]);

    const getFolderCovers = (category: string) => {
        const items = vaultItems.filter(item =>
            (item.category ?? "General") === category
        );
        return items.filter(item => item.image).slice(0, 6).map(item => item.image);
    };

    const renderCard = (item: VaultItem, isNew: boolean = false) => {
        const isExpanded = expandedDescriptions.includes(item.id || 0);
        const isEpub = item.type?.toLowerCase().includes("epub");

        if (viewMode === "list") {
            return (
                <div
                    key={item.id}
                    className="vault-book-card vault-book-card-list"
                    onMouseEnter={() => setActiveCard(item.id || null)}
                    onMouseLeave={() => setActiveCard(null)}
                >
                    <div className="vault-card-glow"></div>

                    <div className="vault-book-image-wrapper">
                        {item.image ? (
                            <img
                                src={item.image}
                                alt={item.name}
                                className="vault-book-image"
                                loading="lazy"
                                onClick={() => openViewer(item.link, item.type, item)}
                            />
                        ) : (
                            <div 
                                className="vault-image-placeholder"
                                onClick={() => openViewer(item.link, item.type, item)}
                            >
                                <Icon icon="mdi:book-open-variant" />
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
                                    {item.name}
                                </button>
                            ) : (
                                item.name
                            )}
                        </h2>

                        <div className="vault-meta-row">
                            <span className="vault-type-badge">{item.type}</span>
                            {item.created_at && (
                                <span>{new Date(item.created_at).getFullYear()}</span>
                            )}
                            {item.series && (
                                <span className="vault-series-badge">{item.series}</span>
                            )}
                        </div>

                        {item.description && (
                            <div className="vault-description-preview">
                                {item.description}
                            </div>
                        )}

                        <div className="vault-list-actions">
                            {item.link && (
                                <>
                                    <button
                                        className="vault-list-read-btn"
                                        onClick={() => openViewer(item.link, item.type, item)}
                                    >
                                        {isEpub ? "Open EPUB" : "Open"}
                                    </button>
                                    {isEpub && (
                                        <button
                                            className="vault-list-download-btn"
                                            onClick={() => handleDownload(item.link, item.name)}
                                        >
                                            <Icon icon="mdi:download" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        className="vault-favorite-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item);
                        }}
                        aria-label="Toggle favorite"
                    >
                        <Icon icon={item.favorite ? "mdi:star" : "mdi:star-outline"} />
                    </button>
                </div>
            );
        }

        // Grid view
        return (
            <div
                key={item.id}
                className={`
                    vault-book-card
                    vault-book-card-grid
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
                    <Icon icon={item.favorite ? "mdi:star" : "mdi:star-outline"} />
                </button>

                <div className="vault-book-image-wrapper">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="vault-book-image"
                            loading="lazy"
                            onClick={() => openViewer(item.link, item.type, item)}
                        />
                    ) : (
                        <div 
                            className="vault-image-placeholder"
                            onClick={() => openViewer(item.link, item.type, item)}
                        >
                            <Icon icon="mdi:book-open-variant" />
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
                                {item.name}
                            </button>
                        ) : (
                            item.name
                        )}
                    </h2>

                    <div className="vault-meta-row">
                        <span className="vault-type-badge">{item.type}</span>
                        {item.created_at && (
                            <span>{new Date(item.created_at).getFullYear()}</span>
                        )}
                        {item.series && (
                            <span className="vault-series-badge">{item.series}</span>
                        )}
                    </div>

                    <div className="vault-description-dropdown">
                        <button
                            className="vault-description-toggle"
                            onClick={() => toggleDescription(item.id)}
                        >
                            Description
                            <span className={`vault-arrow ${isExpanded ? "expanded" : ""}`}>
                                <Icon icon="mdi:chevron-down" />
                            </span>
                        </button>

                        <div className={`vault-description-content ${isExpanded ? "expanded" : ""}`}>
                            <p className="vault-book-description">
                                {item.description}
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
                                    {isEpub ? "Open EPUB" : "Open"}
                                </button>
                                {isEpub && (
                                    <button
                                        className="vault-download-btn"
                                        onClick={() => handleDownload(item.link, item.name)}
                                    >
                                        <Icon icon="mdi:download" />
                                        <span>Download</span>
                                    </button>
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
                        <span className="vault-series-icon">
                            <Icon icon="mdi:bookshelf" />
                        </span>
                        <h3>{seriesName}</h3>
                        <span className="vault-series-count">
                            ({items.length})
                        </span>
                    </div>
                    <span className={`vault-series-arrow ${isExpanded ? "expanded" : ""}`}>
                        <Icon icon="mdi:chevron-down" />
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

    return (
        <div className={`vault-container ${activeCard ? "vault-active" : ""} ${isPageVisible ? "vault-visible" : ""}`}>
            {/* HEADER */}
            <div className="vault-header">
                <div className="vault-header-top">
                    <div className="vault-header-left">
                        <h1>
                            <Icon icon="mdi:bookshelf" />
                            <span>Vault Library</span>
                        </h1>
                    </div>

                    <div className="vault-view-controls">
                        <button
                            className={`vault-view-btn ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid view"
                        >
                            <Icon icon="mdi:view-grid" />
                        </button>
                        <button
                            className={`vault-view-btn ${viewMode === "list" ? "active" : ""}`}
                            onClick={() => setViewMode("list")}
                            aria-label="List view"
                        >
                            <Icon icon="mdi:view-list" />
                        </button>
                    </div>
                </div>

                <div className="vault-stats">
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">
                            <Icon icon="mdi:bookshelf" />
                        </span>
                        <span className="vault-stat-value">{stats.total}</span>
                        <span className="vault-stat-label">Items</span>
                    </div>
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">
                            <Icon icon="mdi:folder-outline" />
                        </span>
                        <span className="vault-stat-value">{stats.categories}</span>
                        <span className="vault-stat-label">Collections</span>
                    </div>
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">
                            <Icon icon="mdi:file-pdf-box" />
                        </span>
                        <span className="vault-stat-value">{stats.pdfs}</span>
                        <span className="vault-stat-label">PDFs</span>
                    </div>
                    <div className="vault-stat-item">
                        <span className="vault-stat-icon">
                            <Icon icon="mdi:book-open-page-variant" />
                        </span>
                        <span className="vault-stat-value">{stats.epubs}</span>
                        <span className="vault-stat-label">EPUBs</span>
                    </div>
                </div>

                <div className="vault-controls-bar">
                    <div className="vault-search-wrapper">
                        <span className="vault-search-icon">
                            <Icon icon="mdi:search" />
                        </span>
                        <input
                            type="text"
                            className="vault-search-input"
                            placeholder="Search titles, descriptions, series..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="vault-search-clear"
                                onClick={() => setSearchQuery("")}
                            >
                                <Icon icon="mdi:close" />
                            </button>
                        )}
                    </div>

                    <div className="vault-controls-right">
                        <select
                            className="vault-sort-select"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
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
                        PDF
                    </button>
                    <button
                        className={`vault-filter-chip ${filterChip === "epub" ? "active" : ""}`}
                        onClick={() => setFilterChip("epub")}
                    >
                        EPUB
                    </button>
                    <button
                        className={`vault-filter-chip vault-favorites-chip ${showFavorites ? "active" : ""}`}
                        onClick={() => {
                            setShowFavorites(!showFavorites);
                            setSelectedCategory(null);
                        }}
                    >
                        <Icon icon="mdi:star" />
                        <span>Favorites</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="vault-main">
                {loadError ? (
                    <div className="vault-error-state">
                        <div className="vault-error-icon">
                            <Icon icon="mdi:alert-octagon-outline" />
                        </div>
                        <p>The vault couldn't be reached.</p>
                        <button
                            className="vault-empty-clear-btn"
                            onClick={() => fetchVaultItems()}
                        >
                            Try again
                        </button>
                    </div>
                ) : loading ? (
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
                                            Open
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!selectedCategory && !showFavorites ? (
                            <div className="vault-folder-grid">
                                {categories.map(category => {
                                    const count = vaultItems.filter(
                                        item => (item.category ?? "General") === category
                                    ).length;
                                    const covers = getFolderCovers(category);

                                    return (
                                        <button
                                            key={category}
                                            className="vault-folder-card"
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                setShowFavorites(false);
                                            }}
                                        >
                                            <div className="vault-folder-cover-area">
                                                {covers.length > 0 ? (
                                                    <div className="vault-folder-cover-collage">
                                                        {covers.slice(0, 6).map((cover, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={cover}
                                                                alt=""
                                                                loading="lazy"
                                                            />
                                                        ))}
                                                        {covers.length < 6 && Array.from({ length: 6 - covers.length }).map((_, idx) => (
                                                            <div key={`empty-${idx}`} className="vault-folder-cover-empty" />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="vault-folder-cover-icon">
                                                        <Icon icon="mdi:folder-outline" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="vault-folder-content">
                                                <h2>{category}</h2>
                                                <span>{count} {count === 1 ? "Entry" : "Entries"}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                <div className="vault-category-header">
                                    <div className="vault-category-header-left">
                                        {selectedCategory && (() => {
                                            const firstItem = vaultItems.find(
                                                item => (item.category ?? "General") === selectedCategory && item.image
                                            );
                                            return firstItem?.image ? (
                                                <img
                                                    src={firstItem.image}
                                                    alt={selectedCategory}
                                                    className="vault-category-cover"
                                                />
                                            ) : null;
                                        })()}
                                        <h2>
                                            {showFavorites ? (
                                                <><Icon icon="mdi:star" /> Favorites</>
                                            ) : (
                                                selectedCategory
                                            )}
                                        </h2>
                                        <span className="vault-item-count">
                                            {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? "Entry" : "Entries"}
                                        </span>
                                    </div>
                                    <button
                                        className="vault-back-btn"
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setShowFavorites(false);
                                        }}
                                    >
                                        <Icon icon="mdi:arrow-left" />
                                        Back
                                    </button>
                                </div>

                                {Object.entries(groupedItems.grouped).map(([seriesName, items]) =>
                                    renderSeriesGroup(seriesName, items)
                                )}

                                {groupedItems.standalone.length > 0 && (
                                    <div className={`vault-grid vault-grid-${viewMode}`}>
                                        {groupedItems.standalone.map((item, index) =>
                                            renderCard(item, index === 0 && !selectedCategory)
                                        )}
                                    </div>
                                )}

                                {filteredAndSortedItems.length === 0 && (
                                    <div className="vault-empty-state">
                                        <div className="vault-empty-icon">
                                            <Icon icon="mdi:search-off" />
                                        </div>
                                        <p>No entries found matching your criteria.</p>
                                        {(searchQuery || filterChip !== "all" || showFavorites) && (
                                            <button
                                                className="vault-empty-clear-btn"
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
            </div>

            {/* VIEWER OVERLAY */}
            {viewerUrl && viewerType === "pdf" && (
                <PDFViewer url={viewerUrl} onClose={closeViewer} />
            )}

            {viewerUrl && viewerType === "epub" && (
                <EPUBViewer url={viewerUrl} onClose={closeViewer} />
            )}
        </div>
    );
}

export default Vault;