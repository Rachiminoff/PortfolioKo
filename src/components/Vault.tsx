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

return (

    <div
        className={`vault-container ${
            activeCard ? "vault-active" : ""
        }`}
    >

        {/* HEADER */}

        <div className="vault-header">

            <h1>Vault Library</h1>

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

                                        <h2>{category}</h2>

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

                                        {/* Keep your ENTIRE existing card content here unchanged */}

                                    </div>

                                );

                            })}

                        </div>

                    </>

                )}
            </>

        )}

        <PDFViewer
            url={viewerUrl}
            onClose={closeViewer}
        />

    </div>

);

}

export default Vault;