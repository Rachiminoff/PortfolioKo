import React, { useEffect, useState } from "react";
import "../assets/styles/Vault.scss";
import { supabase } from "../lib/supabase";
import PDFViewer from "./PDFViewer";

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

    const [activeCard, setActiveCard] =
        useState<number | null>(null);

    const [expandedDescriptions, setExpandedDescriptions] =
        useState<number[]>([]);

    // Grid | List
    const [viewMode, setViewMode] =
        useState<"grid" | "list">("grid");

    // Category Filter
    const [selectedCategory, setSelectedCategory] =
        useState("All");

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

    const openViewer = (url?: string) => {

        if (!url) return;

        let finalUrl = url;

        const match =
            url.match(/\/d\/([a-zA-Z0-9_-]+)/);

        if (match) {

            finalUrl =
                `https://drive.google.com/file/d/${match[1]}/preview`;

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

    // Categories

    const categories = [

        "All",

        ...Array.from(
            new Set(
                vaultItems.map(
                    item => item.category ?? "General"
                )
            )
        )

    ];

    const filteredItems =

        selectedCategory === "All"

            ? vaultItems

            : vaultItems.filter(item =>
                (item.category ?? "General")
                === selectedCategory
            );

    return (

        <div
            className={`vault-container ${
                activeCard ? "vault-active" : ""
            }`}
        >

            {/* HEADER */}

            <div className="vault-header">

                <h1>

                    Vault Library

                </h1>

                <div className="vault-intro">

                    <p>

                        Personal archive of preserved works and completed creations.

                    </p>

                </div>

                {/* Toolbar */}

                <div className="vault-toolbar">

                    <select
                        value={selectedCategory}
                        onChange={e =>
                            setSelectedCategory(e.target.value)
                        }
                    >

                        {categories.map(category => (

                            <option
                                key={category}
                                value={category}
                            >

                                {category}

                            </option>

                        ))}

                    </select>

                    <div className="vault-view-toggle">

                        <button
                            className={
                                viewMode === "grid"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setViewMode("grid")
                            }
                        >

                            ⬛ Grid

                        </button>

                        <button
                            className={
                                viewMode === "list"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setViewMode("list")
                            }
                        >

                            ☰ List

                        </button>

                    </div>

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

            ) : (

                <div
                    className={
                        viewMode === "grid"
                            ? "vault-grid"
                            : "vault-list"
                    }
                >

                    {filteredItems.map((item, index) => {

                        const isExpanded =
                            expandedDescriptions.includes(item.id || 0);

                        return viewMode === "grid" ? (

                            // ==========================
                            // GRID VIEW
                            // ==========================

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

                                            ARCHIVE

                                        </div>

                                    )}

                                </div>


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

                                        <span>

                                            •

                                        </span>

                                        <span>

                                            {item.category ?? "General"}

                                        </span>

                                    </div>


                                    <p className="vault-description-preview">

                                        {isExpanded

                                            ? item.description

                                            : item.description.length > 120

                                                ? item.description.substring(0, 120) + "..."

                                                : item.description

                                        }

                                    </p>


                                    {item.description.length > 120 && (

                                        <button
                                            className="vault-more-btn"
                                            onClick={() =>
                                                toggleDescription(item.id)
                                            }
                                        >

                                            {isExpanded
                                                ? "Show Less"
                                                : "Read More"
                                            }

                                        </button>

                                    )}


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


                        ) : (

                            // ==========================
                            // LIST VIEW
                            // ==========================

                            <div
                                key={item.id}
                                className="vault-list-item"
                            >

                                <div className="vault-list-image">

                                    {item.image ? (

                                        <img
                                            src={item.image}
                                            alt={item.name}
                                        />

                                    ) : (

                                        <div className="vault-image-placeholder">

                                            ARCHIVE

                                        </div>

                                    )}

                                </div>


                                <div className="vault-list-content">

                                    <div className="vault-list-header">

                                        <h2>

                                            {item.name}

                                        </h2>

                                        <span>

                                            {item.type}

                                        </span>

                                    </div>


                                    <p>

                                        {isExpanded

                                            ? item.description

                                            : item.description.length > 180

                                                ? item.description.substring(0, 180) + "..."

                                                : item.description

                                        }

                                    </p>


                                    {item.description.length > 180 && (

                                        <button
                                            className="vault-more-btn"
                                            onClick={() =>
                                                toggleDescription(item.id)
                                            }
                                        >

                                            {isExpanded
                                                ? "Show Less"
                                                : "Read More"
                                            }

                                        </button>

                                    )}


                                    <div className="vault-list-footer">

                                        <span>

                                            {item.category ?? "General"}

                                        </span>


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

                            </div>

                        );

                    })}

                </div>

            )}


            <PDFViewer
                url={viewerUrl}
                onClose={closeViewer}
            />

        </div>

    );

}

export default Vault;