import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import { Icon } from '@iconify/react';
import PersonaSectionHeader from './PersonaSectionHeader';
import { supabase } from '../../lib/supabase';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  reading_time: string;
  published: boolean;
  featured: boolean;
  created_at: string;
  thumbnail?: string;
  cover_image?: string;
  updated_at?: string;
}

type SortOption = 'newest' | 'oldest' | 'az' | 'za';

const POSTS_PER_PAGE = 5;

const WritingsSection: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeTocId, setActiveTocId] = useState('');
  const headingIdsRef = useRef<string[]>([]);
  const headingRenderIndexRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          'id,title,slug,excerpt,content,category,tags,reading_time,published,featured,created_at,thumbnail,cover_image,updated_at',
        )
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error && active) setPosts(data || []);
      if (error) console.error('Error fetching Persona writings:', error);
      if (active) setLoading(false);
    };
    fetchPosts();
    return () => {
      active = false;
    };
  }, []);

  const getPostHref = (slug: string) => {
    const url = new URL('/persona', window.location.origin);
    url.searchParams.set('post', slug);
    url.hash = 'writings';
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const openPost = (post: BlogPost) => {
    window.history.pushState({ personaPost: post.slug }, '', getPostHref(post.slug));
    setSelectedPost(post);
  };

  const closePost = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('post')) {
      url.searchParams.delete('post');
      url.hash = 'writings';
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
    setSelectedPost(null);
  }, []);

  // Direct links such as /persona?post=some-slug open the article on arrival.
  // Keep the reader synchronized with browser Back/Forward navigation as well.
  useEffect(() => {
    const syncPostFromUrl = () => {
      const slug = new URLSearchParams(window.location.search).get('post');
      setSelectedPost(slug ? posts.find((post) => post.slug === slug) || null : null);
    };

    syncPostFromUrl();
    window.addEventListener('popstate', syncPostFromUrl);
    return () => window.removeEventListener('popstate', syncPostFromUrl);
  }, [posts]);

  const toc = useMemo<TocItem[]>(() => {
    if (!selectedPost) {
      headingIdsRef.current = [];
      return [];
    }

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const usedIds = new Map<string, number>();
    const items = Array.from(selectedPost.content.matchAll(headingRegex)).map((match) => {
      const text = match[2].trim().replace(/[#*`_]/g, '');
      const baseId =
        text
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'section';
      const count = usedIds.get(baseId) || 0;
      usedIds.set(baseId, count + 1);
      return {
        id: count ? `${baseId}-${count + 1}` : baseId,
        text,
        level: match[1].length,
      };
    });

    headingIdsRef.current = items.map((item) => item.id);
    return items;
  }, [selectedPost]);

  useEffect(() => {
    setActiveTocId(toc[0]?.id || '');
    if (!selectedPost || toc.length === 0) return;

    const headings = toc
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveTocId(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -72% 0px', threshold: [0, 0.1, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [selectedPost, toc]);

  useEffect(() => {
    if (!selectedPost) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePost();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPost, closePost]);

  const categories = useMemo(
    () => Array.from(new Set(posts.map((post) => post.category).filter(Boolean))).sort(),
    [posts],
  );

  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const items = posts.filter((post) => {
      const matchesCategory =
        category === 'all' || post.category === category || post.tags?.includes(category);
      const matchesQuery =
        !normalized ||
        post.title.toLowerCase().includes(normalized) ||
        post.excerpt?.toLowerCase().includes(normalized) ||
        post.category?.toLowerCase().includes(normalized) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(normalized));
      return matchesCategory && matchesQuery;
    });

    return items.sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'za') return b.title.localeCompare(a.title);
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === 'oldest' ? diff : -diff;
    });
  }, [posts, query, category, sort]);

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / POSTS_PER_PAGE));
  const paginatedPosts = useMemo(
    () => visiblePosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
    [visiblePosts, currentPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, category, sort]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const renderReaderHeading = (
    level: 1 | 2 | 3 | 4 | 5 | 6,
    children: React.ReactNode,
    props: Record<string, any>,
  ) => {
    const id = headingIdsRef.current[headingRenderIndexRef.current] || props.id;
    headingRenderIndexRef.current += 1;
    const className = `persona-md-h${level}`;

    if (level === 1)
      return (
        <h1 {...props} id={id} className={className}>
          {children}
        </h1>
      );
    if (level === 2)
      return (
        <h2 {...props} id={id} className={className}>
          {children}
        </h2>
      );
    if (level === 3)
      return (
        <h3 {...props} id={id} className={className}>
          {children}
        </h3>
      );
    if (level === 4)
      return (
        <h4 {...props} id={id} className={className}>
          {children}
        </h4>
      );
    if (level === 5)
      return (
        <h5 {...props} id={id} className={className}>
          {children}
        </h5>
      );
    return (
      <h6 {...props} id={id} className={className}>
        {children}
      </h6>
    );
  };

  return (
    <section className="persona-notes" id="writings" aria-labelledby="persona-notes-title">
      <PersonaSectionHeader
        index="03 / SCRAPS"
        title="WRITINGS"
        note="THE SAME ARCHIVE AS INSIGHTS, JUST IN A MORE PERSONAL CORNER"
        id="persona-notes-title"
      />

      <div className="persona-writing-tools">
        <label className="persona-writing-search">
          <Icon icon="mdi:magnify" width={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH WRITINGS..."
            aria-label="Search writings"
          />
        </label>

        <div className="persona-writing-filters">
          <button
            className={category === 'all' ? 'active' : ''}
            onClick={() => setCategory('all')}
            type="button"
          >
            ALL
          </button>
          {categories.map((cat) => (
            <button
              className={category === cat ? 'active' : ''}
              onClick={() => setCategory(cat)}
              type="button"
              key={cat}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="persona-writing-sort">
          <span>SORT</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort writings"
          >
            <option value="newest">NEWEST</option>
            <option value="oldest">OLDEST</option>
            <option value="az">A—Z</option>
            <option value="za">Z—A</option>
          </select>
        </label>
      </div>

      <div className="persona-notes-layout">
        <div className="persona-notes-rail">
          <span>{loading ? 'LOADING' : `${visiblePosts.length} ENTRIES`}</span>
          <span>SEARCHABLE</span>
          <span>UNCURATED</span>
          <span>OCCASIONAL</span>
        </div>

        <div className="persona-note-list">
          {loading ? (
            <div className="persona-writing-empty">FETCHING THE NOTEBOOK...</div>
          ) : visiblePosts.length === 0 ? (
            <div className="persona-writing-empty">NOTHING MATCHED. TRY ANOTHER SEARCH.</div>
          ) : (
            paginatedPosts.map((post) => (
              <article className="persona-note" key={post.id}>
                <button
                  className="persona-note-open"
                  type="button"
                  onClick={() => openPost(post)}
                  aria-label={`Read ${post.title}`}
                >
                  <div className="persona-note-date">
                    <span>{formatDate(post.created_at)}</span>
                    <i />
                  </div>
                  <div className="persona-note-body">
                    <span className="persona-meta">
                      {post.category || 'THOUGHT'} {post.featured ? ' / FEATURED' : ''}
                    </span>
                    <h3>{post.title}</h3>
                    <p>
                      {post.excerpt ||
                        post.content.replace(/[#>*_`\u005B\u005D()]/g, ' ').slice(0, 180)}
                    </p>
                    <small>
                      {post.reading_time || ''}
                      {post.tags?.length ? `  /  ${post.tags.join(' · ')}` : ''}
                    </small>
                  </div>
                  <Icon className="persona-note-arrow" icon="mdi:arrow-top-right" width={22} />
                </button>
                <a
                  className="persona-note-permalink"
                  href={getPostHref(post.slug)}
                  aria-label={`Direct link to ${post.title}`}
                  title="Open direct link"
                >
                  <Icon icon="mdi:link-variant" width={17} aria-hidden="true" />
                </a>
              </article>
            ))
          )}

          {!loading && visiblePosts.length > 0 && totalPages > 1 && (
            <nav className="persona-writing-pagination" aria-label="Writings pagination">
              <button
                type="button"
                className="persona-writing-page-control"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <Icon icon="mdi:arrow-left" width={18} />
              </button>

              <div className="persona-writing-page-numbers">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={currentPage === page ? 'active' : ''}
                    onClick={() => setCurrentPage(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {String(page).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="persona-writing-page-control"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <Icon icon="mdi:arrow-right" width={18} />
              </button>

              <span className="persona-writing-page-status">
                PAGE {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
              </span>
            </nav>
          )}
        </div>
      </div>

      {selectedPost && (
        <div
          className="persona-writing-reader-backdrop"
          onMouseDown={(event) => {
            // Close only when the actual backdrop is clicked. In particular,
            // clicking/dragging the overlay scrollbar must not close the reader.
            const target = event.currentTarget;
            const isScrollbar = event.clientX >= target.clientWidth;
            if (event.target === target && !isScrollbar) closePost();
          }}
        >
          <div
            className="persona-writing-reader"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="persona-reader-close"
              type="button"
              onClick={closePost}
              aria-label="Close"
            >
              <Icon icon="mdi:close" width={24} />
            </button>
            <header className="persona-reader-hero">
              {(selectedPost.cover_image || selectedPost.thumbnail) && (
                <img src={selectedPost.cover_image || selectedPost.thumbnail} alt="" />
              )}
              <div className="persona-reader-hero-overlay" />
              <div className="persona-reader-hero-content">
                <div className="persona-reader-badges">
                  <span>{selectedPost.category || 'THOUGHT'}</span>
                  {selectedPost.tags?.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <h1>{selectedPost.title}</h1>
                <div className="persona-reader-meta">
                  <span>
                    <Icon icon="mdi:clock-outline" width={16} /> {selectedPost.reading_time || ''}
                  </span>
                  <span>
                    <Icon icon="mdi:calendar-outline" width={16} />{' '}
                    {formatDate(selectedPost.created_at)}
                  </span>
                </div>
              </div>
            </header>
            <div className="persona-reader-layout">
              {toc.length > 0 && (
                <aside className="persona-reader-toc" aria-label="Table of contents">
                  <div className="persona-reader-toc-inner">
                    <span className="persona-reader-toc-label">ON THIS PAGE</span>
                    <nav>
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={`persona-reader-toc-item level-${item.level} ${activeTocId === item.id ? 'active' : ''}`}
                          onClick={(event) => {
                            event.preventDefault();
                            document
                              .getElementById(item.id)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                        >
                          <span className="persona-reader-toc-dot" />
                          <span>{item.text}</span>
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>
              )}

              <main className="persona-reader-main">
                {toc.length > 0 && (
                  <details className="persona-reader-toc-mobile">
                    <summary>
                      <span>Contents</span>
                      <Icon icon="mdi:chevron-down" width={18} />
                    </summary>
                    <nav>
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={`persona-reader-toc-item level-${item.level} ${activeTocId === item.id ? 'active' : ''}`}
                          onClick={(event) => {
                            event.preventDefault();
                            document
                              .getElementById(item.id)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                        >
                          <span className="persona-reader-toc-dot" />
                          <span>{item.text}</span>
                        </a>
                      ))}
                    </nav>
                  </details>
                )}

                <button className="persona-reader-back" onClick={closePost}>
                  <Icon icon="mdi:arrow-left" width={18} /> Back to Writings
                </button>
                {selectedPost.excerpt && (
                  <div className="persona-reader-excerpt">{selectedPost.excerpt}</div>
                )}
                <div className="persona-writing-content persona-reader-body">
                  {(() => {
                    headingRenderIndexRef.current = 0;
                    return null;
                  })()}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
                    components={{
                      h1: ({ children, ...props }: any) => renderReaderHeading(1, children, props),
                      h2: ({ children, ...props }: any) => renderReaderHeading(2, children, props),
                      h3: ({ children, ...props }: any) => renderReaderHeading(3, children, props),
                      h4: ({ children, ...props }: any) => renderReaderHeading(4, children, props),
                      h5: ({ children, ...props }: any) => renderReaderHeading(5, children, props),
                      h6: ({ children, ...props }: any) => renderReaderHeading(6, children, props),
                      table: ({ children, ...props }: any) => (
                        <div className="persona-md-table-wrap">
                          <table {...props}>{children}</table>
                        </div>
                      ),
                      a: ({ href, children, ...props }: any) => {
                        const external = /^https?:\/\//i.test(href || '');
                        return (
                          <a
                            href={href}
                            className="persona-md-link"
                            target={external ? '_blank' : undefined}
                            rel={external ? 'noopener noreferrer' : undefined}
                            {...props}
                          >
                            {children}
                          </a>
                        );
                      },
                      img: ({ alt, ...props }: any) => (
                        <figure className="persona-md-figure">
                          <img className="persona-md-image" alt={alt || ''} {...props} />
                          {alt && <figcaption>{alt}</figcaption>}
                        </figure>
                      ),
                      pre: ({ children, ...props }: any) => (
                        <div className="persona-md-code-block">
                          <pre {...props}>{children}</pre>
                        </div>
                      ),
                      input: ({ checked, ...props }: any) => (
                        <input
                          type="checkbox"
                          checked={checked || false}
                          readOnly
                          className="persona-md-task-checkbox"
                          {...props}
                        />
                      ),
                      details: ({ children, ...props }: any) => (
                        <details className="persona-md-details" {...props}>
                          {children}
                        </details>
                      ),
                      summary: ({ children, ...props }: any) => (
                        <summary className="persona-md-summary" {...props}>
                          {children}
                        </summary>
                      ),
                      hr: (props: any) => <hr className="persona-md-hr" {...props} />,
                    }}
                  >
                    {selectedPost.content}
                  </ReactMarkdown>
                </div>
              </main>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WritingsSection;
