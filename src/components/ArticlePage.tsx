import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import "./ArticlePage.scss";

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

function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [prevPost, setPrevPost] = useState<BlogPost | null>(null);
  const [nextPost, setNextPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 100);
      // Scroll to top on mount
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug]);

  const fetchPost = async (slug: string) => {
    setLoading(true);
    
    // Fetch the main post
    const { data: postData, error: postError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (postError || !postData) {
      console.error("Error fetching post:", postError);
      setLoading(false);
      return;
    }

    setPost(postData);

    // Generate TOC from content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = [...postData.content.matchAll(headingRegex)];
    const tocItems = matches.map((match: RegExpMatchArray) => ({
      id: match[2].toLowerCase().replace(/[^a-z0-9]/g, "-"),
      text: match[2],
      level: match[1].length
    }));
    setToc(tocItems);

    // Fetch all published posts for navigation
    const { data: allPosts, error: allError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (!allError && allPosts) {
      const currentIndex = allPosts.findIndex((p: BlogPost) => p.id === postData.id);
      
      if (currentIndex > 0) {
        setPrevPost(allPosts[currentIndex - 1]);
      }
      
      if (currentIndex < allPosts.length - 1) {
        setNextPost(allPosts[currentIndex + 1]);
      }

      // Fetch related posts (same category, different id)
      const related = allPosts
        .filter((p: BlogPost) => p.id !== postData.id && p.category === postData.category)
        .slice(0, 3);
      setRelatedPosts(related);
    }

    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show a subtle notification
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

  if (loading) {
    return (
      <div className="article-page">
        <div className="article-loading">
          <div className="article-skeleton-hero"></div>
          <div className="article-skeleton-content">
            <div className="article-skeleton-line"></div>
            <div className="article-skeleton-line short"></div>
            <div className="article-skeleton-line"></div>
            <div className="article-skeleton-line"></div>
            <div className="article-skeleton-line"></div>
            <div className="article-skeleton-line short"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="article-page">
        <div className="article-not-found">
          <div className="article-not-found-icon">📖</div>
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/insights")} className="article-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`article-page ${isVisible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <div className="article-hero">
        <div className="article-hero-image-wrapper">
          <img 
            src={post.cover_image || post.thumbnail} 
            alt={post.title}
            className="article-hero-image"
          />
          <div className="article-hero-overlay"></div>
          <div className="article-hero-content">
            <div className="article-hero-badges">
              <span className="article-category-badge">{post.category}</span>
              {post.tags && post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="article-tag-badge">{tag}</span>
              ))}
            </div>
            <h1 className="article-hero-title">{post.title}</h1>
            <div className="article-hero-meta">
              <div className="article-hero-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{post.reading_time}</span>
              </div>
              <div className="article-hero-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{formatDate(post.created_at)}</span>
              </div>
              {post.updated_at && post.updated_at !== post.created_at && (
                <div className="article-hero-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Updated {formatDate(post.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="article-container">
        {/* TOC Sidebar */}
        {toc.length > 0 && (
          <aside className="article-toc">
            <div className="article-toc-inner">
              <h3>Table of Contents</h3>
              <nav>
                {toc.map((item, index) => (
                  <a
                    key={index}
                    href={`#${item.id}`}
                    className={`article-toc-item level-${item.level}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(item.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    <span className="article-toc-dot"></span>
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <article className="article-content-wrapper">
          <div className="article-content-inner">
            {post.excerpt && (
              <div className="article-excerpt">
                {post.excerpt}
              </div>
            )}
            
            <div className="article-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeSlug]}
                components={{
                  h1: ({ children, ...props }: any) => (
                    <h1 className="article-heading-1" {...props}>{children}</h1>
                  ),
                  h2: ({ children, ...props }: any) => (
                    <h2 className="article-heading-2" {...props}>{children}</h2>
                  ),
                  h3: ({ children, ...props }: any) => (
                    <h3 className="article-heading-3" {...props}>{children}</h3>
                  ),
                  h4: ({ children, ...props }: any) => (
                    <h4 className="article-heading-4" {...props}>{children}</h4>
                  ),
                  h5: ({ children, ...props }: any) => (
                    <h5 className="article-heading-5" {...props}>{children}</h5>
                  ),
                  h6: ({ children, ...props }: any) => (
                    <h6 className="article-heading-6" {...props}>{children}</h6>
                  ),
                  p: ({ children, ...props }: any) => (
                    <p className="article-paragraph" {...props}>{children}</p>
                  ),
                  ul: ({ children, ...props }: any) => (
                    <ul className="article-list article-list-ul" {...props}>{children}</ul>
                  ),
                  ol: ({ children, ...props }: any) => (
                    <ol className="article-list article-list-ol" {...props}>{children}</ol>
                  ),
                  li: ({ children, ...props }: any) => (
                    <li className="article-list-item" {...props}>{children}</li>
                  ),
                  blockquote: ({ children, ...props }: any) => (
                    <blockquote className="article-blockquote" {...props}>{children}</blockquote>
                  ),
                  code: ({ inline, className, children, ...props }: CodeComponentProps) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline ? (
                      <div className="article-code-block-wrapper">
                        <div className="article-code-header">
                          <span className="article-code-language">{match ? match[1] : 'code'}</span>
                          <button 
                            className="article-code-copy"
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
                      <code className="article-inline-code" {...props}>
                        {children}
                      </code>
                    );
                  },
                  img: ({ src, alt, ...props }: any) => (
                    <div className="article-image-wrapper">
                      <img src={src} alt={alt} className="article-image" {...props} />
                      {alt && <span className="article-image-caption">{alt}</span>}
                    </div>
                  ),
                  table: ({ children, ...props }: any) => (
                    <div className="article-table-wrapper">
                      <table className="article-table" {...props}>{children}</table>
                    </div>
                  ),
                  thead: ({ children, ...props }: any) => (
                    <thead {...props}>{children}</thead>
                  ),
                  tbody: ({ children, ...props }: any) => (
                    <tbody {...props}>{children}</tbody>
                  ),
                  tr: ({ children, ...props }: any) => (
                    <tr {...props}>{children}</tr>
                  ),
                  th: ({ children, ...props }: any) => (
                    <th {...props}>{children}</th>
                  ),
                  td: ({ children, ...props }: any) => (
                    <td {...props}>{children}</td>
                  ),
                  a: ({ href, children, ...props }: any) => (
                    <a href={href} className="article-link" target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  ),
                  hr: (props: any) => (
                    <hr className="article-hr" {...props} />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Tags Footer */}
            {post.tags && post.tags.length > 0 && (
              <div className="article-tags-footer">
                <span className="article-tags-label">Tags</span>
                <div className="article-tags-list">
                  {post.tags.map(tag => (
                    <span key={tag} className="article-tag-pill">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="article-navigation">
              <button 
                className="article-back-btn"
                onClick={() => navigate("/insights")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Insights
              </button>
              
              <div className="article-actions">
                <button 
                  className="article-share-btn"
                  onClick={handleShare}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>
            </div>

            {/* Prev/Next */}
            {(prevPost || nextPost) && (
              <div className="article-prev-next">
                {prevPost && (
                  <div 
                    className="article-prev"
                    onClick={() => navigate(`/insights/${prevPost.slug}`)}
                  >
                    <span className="article-nav-label">Previous Article</span>
                    <h4>{prevPost.title}</h4>
                    <span className="article-nav-arrow">←</span>
                  </div>
                )}
                {nextPost && (
                  <div 
                    className="article-next"
                    onClick={() => navigate(`/insights/${nextPost.slug}`)}
                  >
                    <span className="article-nav-label">Next Article</span>
                    <h4>{nextPost.title}</h4>
                    <span className="article-nav-arrow">→</span>
                  </div>
                )}
              </div>
            )}

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <div className="article-related">
                <h3 className="article-related-title">Related Articles</h3>
                <div className="article-related-grid">
                  {relatedPosts.map(related => (
                    <div 
                      key={related.id}
                      className="article-related-card"
                      onClick={() => navigate(`/insights/${related.slug}`)}
                    >
                      <img 
                        src={related.thumbnail} 
                        alt={related.title}
                        className="article-related-image"
                      />
                      <div className="article-related-content">
                        <h4>{related.title}</h4>
                        <div className="article-related-meta">
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

export default ArticlePage;