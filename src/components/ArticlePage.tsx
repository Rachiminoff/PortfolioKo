import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import "../assets/styles/ArticlePage.scss";

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

// Define proper types for ReactMarkdown components
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

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
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
      alert("Link copied to clipboard!");
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
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="article-page">
        <div className="article-not-found">
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/insights")} className="article-back-btn">
            ← Back to Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-page">
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
              {post.tags && post.tags.map(tag => (
                <span key={tag} className="article-tag-badge">{tag}</span>
              ))}
            </div>
            <h1>{post.title}</h1>
            <div className="article-hero-meta">
              <span>{formatDate(post.created_at)}</span>
              <span>·</span>
              <span>{post.reading_time}</span>
              {post.updated_at && post.updated_at !== post.created_at && (
                <>
                  <span>·</span>
                  <span>Updated {formatDate(post.updated_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="article-container">
        {/* TOC Sidebar */}
        {toc.length > 0 && (
          <aside className="article-toc">
            <h3>Table of Contents</h3>
            <nav>
              {toc.map((item, index) => (
                <a
                  key={index}
                  href={`#${item.id}`}
                  className={`article-toc-item level-${item.level}`}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <article className="article-content-wrapper">
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
                  <h1 {...props}>{children}</h1>
                ),
                h2: ({ children, ...props }: any) => (
                  <h2 {...props}>{children}</h2>
                ),
                h3: ({ children, ...props }: any) => (
                  <h3 {...props}>{children}</h3>
                ),
                h4: ({ children, ...props }: any) => (
                  <h4 {...props}>{children}</h4>
                ),
                p: ({ children, ...props }: any) => (
                  <p {...props}>{children}</p>
                ),
                ul: ({ children, ...props }: any) => (
                  <ul {...props}>{children}</ul>
                ),
                ol: ({ children, ...props }: any) => (
                  <ol {...props}>{children}</ol>
                ),
                li: ({ children, ...props }: any) => (
                  <li {...props}>{children}</li>
                ),
                blockquote: ({ children, ...props }: any) => (
                  <blockquote {...props}>{children}</blockquote>
                ),
                code: ({ inline, className, children, ...props }: CodeComponentProps) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <pre className={className}>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                img: ({ src, alt, ...props }: any) => (
                  <img src={src} alt={alt} className="article-image" {...props} />
                ),
                table: ({ children, ...props }: any) => (
                  <div className="article-table-wrapper">
                    <table {...props}>{children}</table>
                  </div>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Navigation */}
          <div className="article-navigation">
            <button 
              className="article-back-btn"
              onClick={() => navigate("/insights")}
            >
              ← Back to Insights
            </button>
            
            <button 
              className="article-share-btn"
              onClick={handleShare}
            >
              Share ↗
            </button>
          </div>

          {/* Prev/Next */}
          {(prevPost || nextPost) && (
            <div className="article-prev-next">
              {prevPost && (
                <div 
                  className="article-prev"
                  onClick={() => navigate(`/insights/${prevPost.slug}`)}
                >
                  <span className="article-nav-label">Previous</span>
                  <h4>{prevPost.title}</h4>
                </div>
              )}
              {nextPost && (
                <div 
                  className="article-next"
                  onClick={() => navigate(`/insights/${nextPost.slug}`)}
                >
                  <span className="article-nav-label">Next</span>
                  <h4>{nextPost.title}</h4>
                </div>
              )}
            </div>
          )}

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="article-related">
              <h3>Related Articles</h3>
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
                      <span className="article-related-meta">
                        {formatDate(related.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

export default ArticlePage;