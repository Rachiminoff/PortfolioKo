import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../assets/styles/Insights.scss";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  cover_image: string;
  category: string;
  tags: string[];
  reading_time: string;
  published: boolean;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

type SortOption = "newest" | "oldest" | "az" | "za" | "custom";
type CategoryFilter = "all" | "development" | "tutorials" | "case-studies" | "thoughts" | "movies" | "programming" | "games" | "books";

interface InsightsProps {
  onClose?: () => void;
}

function Insights({ onClose }: InsightsProps) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [continueReading, setContinueReading] = useState<BlogPost | null>(null);

  // Load continue reading from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("blogContinueReading");
    if (saved) {
      try {
        const item = JSON.parse(saved);
        const exists = posts.some(p => p.id === item.id);
        if (exists) {
          setContinueReading(item);
        } else {
          localStorage.removeItem("blogContinueReading");
        }
      } catch {
        localStorage.removeItem("blogContinueReading");
      }
    }
  }, [posts]);

  // Fetch posts when component mounts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const filteredAndSortedPosts = useMemo(() => {
    let items = [...posts];

    // Category filter
    if (selectedCategory !== "all") {
      items = items.filter(item => 
        item.category.toLowerCase().replace(/ /g, "-") === selectedCategory ||
        item.tags.some(tag => tag.toLowerCase().replace(/ /g, "-") === selectedCategory)
      );
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.excerpt.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortOption) {
      case "newest":
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "az":
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        items.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "custom":
        items.sort((a, b) => (b.display_order || 0) - (a.display_order || 0));
        break;
    }

    return items;
  }, [posts, selectedCategory, searchQuery, sortOption]);

  const featuredPost = useMemo(() => {
    return posts.find(post => post.featured) || null;
  }, [posts]);

  const regularPosts = useMemo(() => {
    return filteredAndSortedPosts.filter(post => !post.featured);
  }, [filteredAndSortedPosts]);

  const categories = [
    { id: "all", label: "All" },
    { id: "development", label: "Development" },
    { id: "tutorials", label: "Tutorials" },
    { id: "case-studies", label: "Case Studies" },
    { id: "thoughts", label: "Thoughts" },
    { id: "career", label: "Career" },
    { id: "react", label: "React" },
    { id: "supabase", label: "Supabase" },
    { id: "typescript", label: "TypeScript" }
  ];

  const stats = useMemo(() => {
    return {
      total: posts.length,
      categories: new Set(posts.map(p => p.category)).size
    };
  }, [posts]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCardClick = (post: BlogPost) => {
    // Save to continue reading
    localStorage.setItem("blogContinueReading", JSON.stringify(post));
    // Navigate to article page
    navigate(`/insights/${post.slug}`);
  };

  const handleContinueReading = (post: BlogPost) => {
    navigate(`/insights/${post.slug}`);
  };

  // Main Content
  return (
    <div className="insights-container">
      {/* Header */}
      <div className="insights-header">
        <div className="insights-header-content">
          <h1>Insights</h1>
          <p className="insights-subtitle">
            Technical articles, development logs, tutorials, experiments, and lessons learned.
          </p>
        </div>

        {/* Stats */}
        <div className="insights-stats">
          <div className="insights-stat-item">
            <span className="insights-stat-icon">📝</span>
            <span className="insights-stat-value">{stats.total}</span>
            <span className="insights-stat-label">Articles</span>
          </div>
          <div className="insights-stat-item">
            <span className="insights-stat-icon">📁</span>
            <span className="insights-stat-value">{stats.categories}</span>
            <span className="insights-stat-label">Categories</span>
          </div>
        </div>

        {/* Controls */}
        <div className="insights-controls-bar">
          <div className="insights-search-wrapper">
            <svg className="insights-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="insights-search-input"
              placeholder="Search articles, categories, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="insights-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="insights-controls-right">
            <select
              className="insights-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="insights-filter-chips">
          {categories.map(category => (
            <button
              key={category.id}
              className={`insights-filter-chip ${selectedCategory === category.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(category.id as CategoryFilter)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="insights-main">
        {loading ? (
          <div className="insights-loading">
            <div className="insights-loading-grid">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="insights-skeleton-card">
                  <div className="insights-skeleton-image"></div>
                  <div className="insights-skeleton-line short"></div>
                  <div className="insights-skeleton-line"></div>
                  <div className="insights-skeleton-line"></div>
                </div>
              ))}
            </div>
            <p className="insights-loading-text">Loading articles...</p>
          </div>
        ) : (
          <>
            {/* Continue Reading */}
            {continueReading && (
              <div className="insights-continue-reading">
                <h3>Continue Reading</h3>
                <div className="insights-continue-card">
                  {continueReading.thumbnail && (
                    <img
                      src={continueReading.thumbnail}
                      alt={continueReading.title}
                      className="insights-continue-cover"
                    />
                  )}
                  <div className="insights-continue-info">
                    <h4>{continueReading.title}</h4>
                    <span className="insights-continue-type">{continueReading.category}</span>
                    <button
                      className="insights-continue-btn"
                      onClick={() => handleContinueReading(continueReading)}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Featured Article */}
            {featuredPost && !searchQuery && selectedCategory === "all" && (
              <div className="insights-featured">
                <div 
                  className="insights-featured-card"
                  onClick={() => handleCardClick(featuredPost)}
                >
                  <div className="insights-featured-image-wrapper">
                    <img 
                      src={featuredPost.cover_image || featuredPost.thumbnail} 
                      alt={featuredPost.title}
                      className="insights-featured-image"
                    />
                    <div className="insights-featured-overlay"></div>
                    <div className="insights-featured-content">
                      <div className="insights-featured-badges">
                        <span className="insights-featured-badge">Featured</span>
                        <span className="insights-category-badge">{featuredPost.category}</span>
                      </div>
                      <h2>{featuredPost.title}</h2>
                      <p>{featuredPost.excerpt}</p>
                      <div className="insights-featured-meta">
                        <span>{formatDate(featuredPost.created_at)}</span>
                        <span>·</span>
                        <span>{featuredPost.reading_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article Grid */}
            <div className="insights-article-grid">
              {regularPosts.map((post) => (
                <div 
                  key={post.id}
                  className="insights-article-card"
                  onClick={() => handleCardClick(post)}
                >
                  <div className="insights-article-image-wrapper">
                    <img 
                      src={post.thumbnail || post.cover_image} 
                      alt={post.title}
                      className="insights-article-image"
                      loading="lazy"
                    />
                    <div className="insights-article-overlay"></div>
                    <div className="insights-article-badges">
                      <span className="insights-article-category">{post.category}</span>
                      {post.tags && post.tags.length > 0 && (
                        <span className="insights-article-tags">
                          {post.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="insights-tag-badge">{tag}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    <div className="insights-article-content">
                      <h3>{post.title}</h3>
                      <p className="insights-article-excerpt">{post.excerpt}</p>
                      <div className="insights-article-meta">
                        <span>{formatDate(post.created_at)}</span>
                        <span>·</span>
                        <span>{post.reading_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {regularPosts.length === 0 && !loading && (
              <div className="insights-empty-state">
                <div className="insights-empty-icon">🔍</div>
                <p>No articles found matching your criteria.</p>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    className="insights-empty-clear-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Insights;