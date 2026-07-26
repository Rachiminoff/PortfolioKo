import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Icon } from "@iconify/react";
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

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface CodeComponentProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

type SortOption = "newest" | "oldest" | "az" | "za" | "custom";

// Get password from environment
const BLOG_PASSWORD = process.env.REACT_APP_BLOG_PASSWORD || "blog123";

// Number of articles to load per batch
const ARTICLES_PER_BATCH = 5;

interface InsightsProps {
  onClose?: () => void;
}

function Insights({ onClose }: InsightsProps) {
  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [continueReading, setContinueReading] = useState<BlogPost | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  
  // Article reader state
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [prevPost, setPrevPost] = useState<BlogPost | null>(null);
  const [nextPost, setNextPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Password state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Progressive loading state
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Check if already unlocked
  useEffect(() => {
    const unlocked = localStorage.getItem("blogUnlocked") === "true";
    setIsUnlocked(unlocked);
  }, []);

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

  // Fetch posts when unlocked
  useEffect(() => {
    if (isUnlocked) {
      fetchPosts();
    }
  }, [isUnlocked]);

  // Reset visible count when filters/search change
  useEffect(() => {
    setVisibleCount(ARTICLES_PER_BATCH);
  }, [searchQuery, selectedCategory, selectedYear, sortOption]);

  // Scroll to top when article opens
  useEffect(() => {
    if (selectedPost) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [selectedPost]);

  // Extract unique categories and years from posts
  useEffect(() => {
    if (posts.length > 0) {
      const categorySet = new Set(posts.map(post => post.category).filter(Boolean));
      const categories = Array.from(categorySet);
      setAvailableCategories(categories.sort());
      
      const yearSet = new Set(posts.map(post => {
        if (post.created_at) {
          return new Date(post.created_at).getFullYear().toString();
        }
        return null;
      }).filter(Boolean));
      const years = Array.from(yearSet) as string[];
      setAvailableYears(years.sort().reverse());
    }
  }, [posts]);

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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(false);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (password === BLOG_PASSWORD) {
      localStorage.setItem("blogUnlocked", "true");
      setIsUnlocked(true);
      setPassword("");
      setIsLoading(false);
    } else {
      setPasswordError(true);
      setIsLoading(false);
      setPassword("");
    }
  };

  const filteredAndSortedPosts = useMemo(() => {
    let items = [...posts];

    if (selectedCategory !== "all") {
      items = items.filter(item => 
        item.category === selectedCategory ||
        item.tags.some(tag => tag === selectedCategory)
      );
    }

    if (selectedYear !== "all") {
      items = items.filter(item => {
        if (item.created_at) {
          return new Date(item.created_at).getFullYear().toString() === selectedYear;
        }
        return false;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.excerpt.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

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
  }, [posts, selectedCategory, selectedYear, searchQuery, sortOption]);

  const featuredPost = useMemo(() => {
    return posts.find(post => post.featured) || null;
  }, [posts]);

  const allRegularPosts = useMemo(() => {
    return filteredAndSortedPosts.filter(post => !post.featured);
  }, [filteredAndSortedPosts]);

  const visiblePosts = useMemo(() => {
    return allRegularPosts.slice(0, visibleCount);
  }, [allRegularPosts, visibleCount]);

  const hasMorePosts = useMemo(() => {
    return visibleCount < allRegularPosts.length;
  }, [visibleCount, allRegularPosts.length]);

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    const newCount = Math.min(visibleCount + ARTICLES_PER_BATCH, allRegularPosts.length);
    setVisibleCount(newCount);
    
    setTimeout(() => {
      if (gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const scrollTarget = gridRect.top + window.scrollY - 100;
        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth'
        });
      }
      setIsLoadingMore(false);
    }, 300);
  };

  const categoryChips = [
    { id: "all", label: "All" },
    ...availableCategories.map(cat => ({ id: cat, label: cat }))
  ];

  const stats = useMemo(() => {
    return {
      total: posts.length,
      categories: availableCategories.length
    };
  }, [posts, availableCategories]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCardClick = (post: BlogPost) => {
    localStorage.setItem("blogContinueReading", JSON.stringify(post));
    setSelectedPost(post);
    setToc([]);
    setPrevPost(null);
    setNextPost(null);
    setRelatedPosts([]);
    setIsVisible(false);
    
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(post.content.matchAll(headingRegex));
    const tocItems = matches.map((match: RegExpMatchArray) => ({
      id: match[2].toLowerCase().replace(/[^a-z0-9]/g, "-"),
      text: match[2],
      level: match[1].length
    }));
    setToc(tocItems);

    const currentIndex = filteredAndSortedPosts.findIndex(p => p.id === post.id);
    if (currentIndex > 0) {
      setPrevPost(filteredAndSortedPosts[currentIndex - 1]);
    }
    if (currentIndex < filteredAndSortedPosts.length - 1) {
      setNextPost(filteredAndSortedPosts[currentIndex + 1]);
    }

    const related = filteredAndSortedPosts
      .filter(p => p.id !== post.id && p.category === post.category)
      .slice(0, 3);
    setRelatedPosts(related);
  };

  const handleBack = () => {
    setSelectedPost(null);
    setIsVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedPost?.title,
        text: selectedPost?.excerpt,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      const notification = document.createElement('div');
      notification.className = 'article-copy-notification';
      notification.textContent = 'Link copied to clipboard!';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('visible');
        setTimeout(() => {
          notification.classList.remove('visible');
          setTimeout(() => notification.remove(), 300);
        }, 2000);
      }, 10);
    }
  };

  // Password Screen
  if (!isUnlocked) {
    return (
      <div className="insights-container insights-locked">
        <div className="insights-lock-screen">
          <div className="insights-lock-icon">
            <Icon icon="mdi:lock-outline" width={40} height={40} />
          </div>
          <h1>Insights</h1>
          <p className="insights-lock-subtitle">Enter your password to access articles</p>
          <form onSubmit={handleUnlock} className="insights-lock-form">
            <div className="insights-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Enter password"
                className={`insights-password-input ${passwordError ? "error" : ""}`}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                className="insights-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width={20} height={20} />
              </button>
            </div>
            {passwordError && (
              <div className="insights-password-error">
                <span className="error-icon">✕</span>
                Invalid password. Please try again.
              </div>
            )}
            <button
              type="submit"
              className="insights-unlock-btn"
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <span className="insights-loader">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                "Unlock"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Article Reader View
  if (selectedPost) {
    return (
      <div className={`insights-container insights-reader ${isVisible ? 'visible' : ''}`}>
        {/* Hero Section */}
        <div className="insights-reader-hero">
          <div className="insights-reader-hero-image-wrapper">
            <img 
              src={selectedPost.cover_image || selectedPost.thumbnail} 
              alt={selectedPost.title}
              className="insights-reader-hero-image"
            />
            <div className="insights-reader-hero-overlay"></div>
            <div className="insights-reader-hero-content">
              <div className="insights-reader-hero-badges">
                <span className="insights-reader-category-badge">{selectedPost.category}</span>
                {selectedPost.tags && selectedPost.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="insights-reader-tag-badge">{tag}</span>
                ))}
              </div>
              <h1 className="insights-reader-hero-title">{selectedPost.title}</h1>
              <div className="insights-reader-hero-meta">
                <div className="insights-reader-hero-meta-item">
                  <Icon icon="mdi:clock-outline" width={16} height={16} />
                  <span>{selectedPost.reading_time}</span>
                </div>
                <div className="insights-reader-hero-meta-item">
                  <Icon icon="mdi:calendar-outline" width={16} height={16} />
                  <span>{formatDate(selectedPost.created_at)}</span>
                </div>
                {selectedPost.updated_at && selectedPost.updated_at !== selectedPost.created_at && (
                  <div className="insights-reader-hero-meta-item">
                    <Icon icon="mdi:update" width={16} height={16} />
                    <span>Updated {formatDate(selectedPost.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="insights-reader-container">
          {/* TOC Sidebar */}
          {toc.length > 0 && (
            <aside className="insights-reader-toc">
              <div className="insights-reader-toc-inner">
                <h3>Contents</h3>
                <nav>
                  {toc.map((item, index) => (
                    <a
                      key={index}
                      href={`#${item.id}`}
                      className={`insights-reader-toc-item level-${item.level}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(item.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                    >
                      <span className="insights-reader-toc-dot"></span>
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <article className="insights-reader-content-wrapper">
            <div className="insights-reader-content-inner">
              <button className="insights-reader-back-btn" onClick={handleBack}>
                <Icon icon="mdi:arrow-left" width={18} height={18} />
                Back to Insights
              </button>

              {selectedPost.excerpt && (
                <div className="insights-reader-excerpt">
                  {selectedPost.excerpt}
                </div>
              )}
              
              <div className="insights-reader-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeSlug]}
                  components={{
                    h1: ({ children, ...props }: any) => (
                      <h1 className="insights-reader-heading-1" {...props}>{children}</h1>
                    ),
                    h2: ({ children, ...props }: any) => (
                      <h2 className="insights-reader-heading-2" {...props}>{children}</h2>
                    ),
                    h3: ({ children, ...props }: any) => (
                      <h3 className="insights-reader-heading-3" {...props}>{children}</h3>
                    ),
                    h4: ({ children, ...props }: any) => (
                      <h4 className="insights-reader-heading-4" {...props}>{children}</h4>
                    ),
                    h5: ({ children, ...props }: any) => (
                      <h5 className="insights-reader-heading-5" {...props}>{children}</h5>
                    ),
                    h6: ({ children, ...props }: any) => (
                      <h6 className="insights-reader-heading-6" {...props}>{children}</h6>
                    ),
                    p: ({ children, ...props }: any) => (
                      <p className="insights-reader-paragraph" {...props}>{children}</p>
                    ),
                    ul: ({ children, ...props }: any) => (
                      <ul className="insights-reader-list insights-reader-list-ul" {...props}>{children}</ul>
                    ),
                    ol: ({ children, ...props }: any) => (
                      <ol className="insights-reader-list insights-reader-list-ol" {...props}>{children}</ol>
                    ),
                    li: ({ children, ...props }: any) => (
                      <li className="insights-reader-list-item" {...props}>{children}</li>
                    ),
                    blockquote: ({ children, ...props }: any) => (
                      <blockquote className="insights-reader-blockquote" {...props}>{children}</blockquote>
                    ),
                    code: ({ inline, className, children, ...props }: CodeComponentProps) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline ? (
                        <div className="insights-reader-code-block-wrapper">
                          <div className="insights-reader-code-header">
                            <span className="insights-reader-code-language">{match ? match[1] : 'code'}</span>
                            <button 
                              className="insights-reader-code-copy"
                              onClick={() => {
                                const code = String(children).replace(/\n$/, '');
                                navigator.clipboard.writeText(code);
                              }}
                            >
                              Copy
                            </button>
                          </div>
                          <pre className={className}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className="insights-reader-inline-code" {...props}>
                          {children}
                        </code>
                      );
                    },
                    img: ({ src, alt, ...props }: any) => (
                      <div className="insights-reader-image-wrapper">
                        <img src={src} alt={alt} className="insights-reader-image" {...props} />
                        {alt && <span className="insights-reader-image-caption">{alt}</span>}
                      </div>
                    ),
                    table: ({ children, ...props }: any) => (
                      <div className="insights-reader-table-wrapper">
                        <table className="insights-reader-table" {...props}>{children}</table>
                      </div>
                    ),
                    a: ({ href, children, ...props }: any) => (
                      <a href={href} className="insights-reader-link" target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    ),
                    hr: (props: any) => (
                      <hr className="insights-reader-hr" {...props} />
                    ),
                  }}
                >
                  {selectedPost.content}
                </ReactMarkdown>
              </div>

              {/* Tags Footer */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="insights-reader-tags-footer">
                  <span className="insights-reader-tags-label">Tags</span>
                  <div className="insights-reader-tags-list">
                    {selectedPost.tags.map(tag => (
                      <span key={tag} className="insights-reader-tag-pill">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="insights-reader-navigation">
                <button className="insights-reader-back-btn" onClick={handleBack}>
                  <Icon icon="mdi:arrow-left" width={18} height={18} />
                  Back to Insights
                </button>
                
                <div className="insights-reader-actions">
                  <button className="insights-reader-share-btn" onClick={handleShare}>
                    <Icon icon="mdi:share-outline" width={18} height={18} />
                    Share
                  </button>
                </div>
              </div>

              {/* Prev/Next */}
              {(prevPost || nextPost) && (
                <div className="insights-reader-prev-next">
                  {prevPost && (
                    <div className="insights-reader-prev" onClick={() => handleCardClick(prevPost)}>
                      <span className="insights-reader-nav-label">Previous Article</span>
                      <h4>{prevPost.title}</h4>
                      <span className="insights-reader-nav-arrow">←</span>
                    </div>
                  )}
                  {nextPost && (
                    <div className="insights-reader-next" onClick={() => handleCardClick(nextPost)}>
                      <span className="insights-reader-nav-label">Next Article</span>
                      <h4>{nextPost.title}</h4>
                      <span className="insights-reader-nav-arrow">→</span>
                    </div>
                  )}
                </div>
              )}

              {/* Related Articles */}
              {relatedPosts.length > 0 && (
                <div className="insights-reader-related">
                  <h3 className="insights-reader-related-title">Related Articles</h3>
                  <div className="insights-reader-related-grid">
                    {relatedPosts.map(related => (
                      <div 
                        key={related.id}
                        className="insights-reader-related-card"
                        onClick={() => handleCardClick(related)}
                      >
                        <img 
                          src={related.thumbnail} 
                          alt={related.title}
                          className="insights-reader-related-image"
                        />
                        <div className="insights-reader-related-content">
                          <h4>{related.title}</h4>
                          <div className="insights-reader-related-meta">
                            <span>{formatDate(related.created_at)}</span>
                            <span>·</span>
                            <span>{related.reading_time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Main Blog Index View
  return (
    <div className="insights-container">
      {/* EDITORIAL HERO SECTION */}
      <section className="insights-hero">
        <div className="insights-hero-content">
          <div className="insights-hero-header">
            <p className="insights-hero-eyebrow">— Journal</p>
            <h1 className="insights-hero-title">
              My little corner of the internet.
            </h1>
            <p className="insights-hero-subtitle">
              A collection of thoughts on software, projects, books, 
              and the things I'm learning along the way.
            </p>
          </div>
          <div className="insights-hero-metadata">
            <span className="insights-hero-metadata-item">
              {stats.total} {stats.total === 1 ? 'writing' : 'writings'}
            </span>
            <span className="insights-hero-metadata-divider">·</span>
            <span className="insights-hero-metadata-item">
              {stats.categories} {stats.categories === 1 ? 'topic' : 'topics'}
            </span>
          </div>
        </div>
      </section>

      {/* CONTROLS SECTION */}
      <div className="insights-controls-section">
        <div className="insights-controls-bar">
          <div className="insights-search-wrapper">
            <Icon icon="mdi:search" className="insights-search-icon" width={16} height={16} />
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
          {categoryChips.map(category => (
            <button
              key={category.id}
              className={`insights-filter-chip ${selectedCategory === category.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Year Filters */}
        {availableYears.length > 0 && (
          <div className="insights-filter-chips insights-year-chips">
            <button
              className={`insights-filter-chip insights-year-chip ${selectedYear === "all" ? "active" : ""}`}
              onClick={() => setSelectedYear("all")}
            >
              All Years
            </button>
            {availableYears.map(year => (
              <button
                key={year}
                className={`insights-filter-chip insights-year-chip ${selectedYear === year ? "active" : ""}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
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
                      onClick={() => handleCardClick(continueReading)}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Featured Article */}
            {featuredPost && !searchQuery && selectedCategory === "all" && selectedYear === "all" && (
              <div className="insights-featured">
                <div className="insights-featured-label">
                  <span className="insights-featured-label-line"></span>
                  <span className="insights-featured-label-text">Editor's Pick</span>
                  <span className="insights-featured-label-line"></span>
                </div>
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
            <div ref={gridRef} className="insights-article-grid">
              {visiblePosts.map((post, index) => (
                <div 
                  key={post.id}
                  className={`insights-article-card insights-article-card-${index}`}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    opacity: 0,
                    animation: `fadeSlideUp 0.4s ease ${index * 0.05}s forwards`
                  }}
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

            {/* Load More Button */}
            {allRegularPosts.length > 0 && (
              <div className="insights-load-more-wrapper">
                {hasMorePosts ? (
                  <button
                    className="insights-load-more-btn"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <span className="insights-load-more-spinner"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        View More Articles
                        <Icon icon="mdi:chevron-down" className="insights-load-more-arrow" width={18} height={18} />
                      </>
                    )}
                  </button>
                ) : (
                  visibleCount >= ARTICLES_PER_BATCH && (
                    <div className="insights-load-more-end">
                      <span className="insights-load-more-end-line"></span>
                      <span className="insights-load-more-end-text">You've reached the end</span>
                      <span className="insights-load-more-end-line"></span>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Empty State */}
            {allRegularPosts.length === 0 && !loading && (
              <div className="insights-empty-state">
                <Icon icon="mdi:search" className="insights-empty-icon" width={48} height={48} />
                <p>No articles found matching your criteria.</p>
                {(searchQuery || selectedCategory !== "all" || selectedYear !== "all") && (
                  <button
                    className="insights-empty-clear-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedYear("all");
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