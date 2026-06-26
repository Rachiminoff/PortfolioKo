import React, { useEffect, useMemo, useState } from "react";
import "../assets/styles/Vault.scss";
import { supabase } from "../lib/supabase";
import PDFViewer from "./PDFViewer";

interface VaultItem {
    id?: number;
    name: string;
    type: string;
    category?: string; // NEW
    description: string;
    link?: string;
    image?: string;
    status?: string;
    created_at?: string;
}

function Vault() {

    const [vaultItems, setVaultItems] =
        useState<VaultItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [viewerUrl, setViewerUrl] =
        useState<string | null>(null);

    const [activeCard, setActiveCard] =
        useState<number | null>(null);

    const [expandedDescriptions, setExpandedDescriptions] =
        useState<number[]>([]);

    // NEW
    const [selectedCategory, setSelectedCategory] =
        useState<string | null>(null);

    useEffect(() => {

        fetchVaultItems();

    }, []);

    const fetchVaultItems = async () => {

        setLoading(true);

        const { data, error } = await supabase
            .from("vault_items")
            .select("*")
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

    const openViewer = (url?: string) => {

        if (!url) return;

        let finalUrl = url;

        const match =
            url.match(/\/d\/([a-zA-Z0-9_-]+)/);

        if (match) {

            const fileId = match[1];

            finalUrl =
                `https://drive.google.com/file/d/${fileId}/preview`;

        }

        setViewerUrl(finalUrl);

    };

    const closeViewer = () => {

        setViewerUrl(null);

    };

    const toggleDescription = (id?: number) => {

        if (!id) return;

        setExpandedDescriptions(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );

    };

    // ===========================
    // Categories
    // ===========================

    const categories = useMemo(() => {

        return [...new Set(

            vaultItems.map(item =>
                item.category || "Uncategorized"
            )

        )];

    }, [vaultItems]);

    const displayedItems = selectedCategory

        ? vaultItems.filter(item =>
            (item.category || "Uncategorized")
                === selectedCategory
        )

        : [];

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

) : (

    <>
        {!selectedCategory ? (

            <div className="vault-folder-grid">

                {categories.map(category => {

                    const count = vaultItems.filter(
                        item =>
                            (item.category || "Uncategorized")
                            === category
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

                                    {count} entr{count === 1 ? "y" : "ies"}

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

                </div>

                <div className="vault-grid">

                    {displayedItems.map((item, index) => {

                        const isExpanded =
                            expandedDescriptions.includes(item.id || 0);

                        return (

                            <div
                                key={item.id}
                                className={`
                                    vault-book-card
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

                                {/* GLOW */}

                                <div className="vault-card-glow"></div>

                                {/* NEW */}

                                {index === 0 && (

                                    <div className="vault-new-badge">

                                        NEW ENTRY

                                    </div>

                                )}

                                {/* IMAGE */}

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

                                            <span>

                                                ARCHIVE

                                            </span>

                                        </div>

                                    )}

                                </div>

                                {/* CONTENT */}

                                <div className="vault-book-content">

                                    <span className="vault-id">

                                        ARCHIVE ENTRY #

                                        {String(item.id || 0)
                                            .padStart(3, "0")}

                                    </span>

                                    <h2>

                                        {item.link ? (

                                            <button
                                                className="vault-book-title"
                                                onClick={() =>
                                                    openViewer(item.link)
                                                }
                                            >

                                                {item.name}

                                            </button>

                                        ) : (

                                            item.name

                                        )}

                                    </h2>

                                    <div className="vault-meta-row">

                                        <span>

                                            {item.type}

                                        </span>

                                        <span>•</span>

                                        <span>

                                            Private Archive

                                        </span>

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

                                    <div className="vault-book-tags">

                                        <span>

                                            {item.type}

                                        </span>

                                    </div>

                                    {item.link && (

                                        <button
                                            className="vault-read-btn"
                                            onClick={() =>
                                                openViewer(item.link)
                                            }
                                        >

                                            Open Entry

                                        </button>

                                    )}

                                </div>

                            </div>

                        );

                    })}

                </div>

            </>

        )}
    </>

)}