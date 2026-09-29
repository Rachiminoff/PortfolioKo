import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import { Icon } from '@iconify/react';
import { supabase } from '../../lib/supabase';

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

interface TocItem {
  id: string;
  label: string;
  level: number;
}

const POSTS_PER_PAGE = 5;

const WritingsSection: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeTocId, setActiveTocId] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [readerProgress, setReaderProgress] = useState(0);
  const readerRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);

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
    setTocOpen(false);
  };

  const closePost = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('post')) {
      url.searchParams.delete('post');
      url.hash = 'writings';
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
    setSelectedPost(null);
    setTocItems([]);
    setActiveTocId('');
  }, []);

  useEffect(() => {
    const syncPostFromUrl = () => {
      const slug = new URLSearchParams(window.location.search).get('post');
      setSelectedPost(slug ? posts.find((post) => post.slug === slug) || null : null);
    };

    syncPostFromUrl();
    window.addEventListener('popstate', syncPostFromUrl);
    return () => window.removeEventListener('popstate', syncPostFromUrl);
  }, [posts]);

  useEffect(() => {
    if (!selectedPost) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePost();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    setReaderProgress(0);
    // Always start a newly opened article at the top. Mobile browsers can
    // otherwise retain the previous reader scroll position when the dialog
    // content is replaced.
    requestAnimationFrame(() => {
      if (readerRef.current) readerRef.current.scrollTop = 0;
    });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      setReaderProgress(0);
    };
  }, [selectedPost, closePost]);

  useEffect(() => {
    const article = articleRef.current;
    const root = readerRef.current;
    if (!selectedPost || !article || !root) return;

    let frame = 0;
    let cleanupResize: (() => void) | undefined;

    const getHeadings = () =>
      Array.from(article.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]'));

    const updateActive = () => {
      const headings = getHeadings();
      if (!headings.length) {
        setActiveTocId('');
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const activationOffset = Math.min(180, Math.max(96, root.clientHeight * 0.22));
      const activationY = rootRect.top + activationOffset;
      let active = headings[0].id;

      // The active item is the last heading that has crossed the reading line.
      // Do not special-case the bottom of the container: that was causing the
      // final heading to become active during the initial render.
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= activationY) {
          active = heading.id;
        } else {
          break;
        }
      }

      // If the reader is genuinely at the bottom, the last visible section is
      // the current section. This is deliberately checked only after layout is
      // established and only within a small bottom threshold.
      const maxScrollTop = Math.max(0, root.scrollHeight - root.clientHeight);
      if (maxScrollTop > 0 && root.scrollTop >= maxScrollTop - 12) {
        const lastHeading = headings[headings.length - 1];
        const lastTop = lastHeading.getBoundingClientRect().top;
        if (lastTop < rootRect.bottom) active = lastHeading.id;
      }

      setActiveTocId((current) => (current === active ? current : active));
    };

    const publishToc = () => {
      const headings = getHeadings();
      setTocItems(
        headings.map((heading) => ({
          id: heading.id,
          label: heading.textContent?.trim() || 'Section',
          level: heading.tagName === 'H4' ? 4 : heading.tagName === 'H3' ? 3 : 2,
        })),
      );
      updateActive();
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActive);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // Markdown/images can change article height after the first paint. Re-run
    // the TOC after those layout changes instead of freezing the initial state.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(publishToc);
    });
    observer.observe(article);

    const renderFrame = requestAnimationFrame(() => {
      publishToc();
      requestAnimationFrame(updateActive);
    });

    cleanupResize = () => observer.disconnect();

    return () => {
      cancelAnimationFrame(renderFrame);
      cancelAnimationFrame(frame);
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cleanupResize?.();
    };
  }, [selectedPost]);

  useEffect(() => {
    const root = readerRef.current;
    if (!selectedPost || !root) return;

    const updateProgress = () => {
      const max = root.scrollHeight - root.clientHeight;
      setReaderProgress(max > 0 ? Math.min(100, Math.max(0, (root.scrollTop / max) * 100)) : 0);
    };

    updateProgress();
    root.addEventListener('scroll', updateProgress, { passive: true });
    return () => root.removeEventListener('scroll', updateProgress);
  }, [selectedPost]);

  const scrollToHeading = useCallback((id: string) => {
    const root = readerRef.current;
    const target = articleRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!root || !target) return;

    const top =
      target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 28;
    root.scrollTo({ top, behavior: 'smooth' });
    setActiveTocId(id);
    setTocOpen(false);
  }, []);

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

  const featuredPost = useMemo(
    () => visiblePosts.find((post) => post.featured) || visiblePosts[0] || null,
    [visiblePosts],
  );

  const archivePosts = useMemo(
    () => visiblePosts.filter((post) => post.id !== featuredPost?.id),
    [visiblePosts, featuredPost],
  );

  const totalPages = Math.max(1, Math.ceil(archivePosts.length / POSTS_PER_PAGE));
  const paginatedPosts = useMemo(
    () => archivePosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
    [archivePosts, currentPage],
  );

  useEffect(() => setCurrentPage(1), [query, category, sort]);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <section className="persona-notes" id="writings" aria-labelledby="persona-notes-title">
      <div className="persona-writing-intro">
        <div className="persona-writing-intro-copy">
          <span className="persona-writing-kicker">PERSONAL ARCHIVE / 03</span>
          <h3>
            My little corner
            <br />
            <em>of the internet.</em>
          </h3>
          <p>
            A running collection of essays, observations, experiments, and things worth thinking
            about twice.
          </p>
        </div>
      </div>

      <div className="persona-writing-toolbar">
        <label className="persona-writing-search">
          <span className="persona-writing-search-index">01</span>
          <Icon icon="mdi:magnify" width={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH THE ARCHIVE"
            aria-label="Search writings"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <Icon icon="mdi:close" width={16} />
            </button>
          )}
        </label>

        <div className="persona-writing-filters" aria-label="Filter writings by category">
          <span className="persona-writing-filter-label">FILTER</span>
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

      {loading ? (
        <div className="persona-writing-state">
          <span>01</span>
          <strong>FETCHING THE NOTEBOOK...</strong>
          <i />
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="persona-writing-state persona-writing-state-empty">
          <span>00</span>
          <strong>NOTHING MATCHED.</strong>
          <p>Try another search term or clear the current filter.</p>
        </div>
      ) : (
        <>
          {featuredPost && (
            <article className="persona-writing-featured">
              <button
                className="persona-writing-featured-open"
                type="button"
                onClick={() => openPost(featuredPost)}
                aria-label={`Read ${featuredPost.title}`}
              >
                <div className="persona-writing-featured-art">
                  {(featuredPost.cover_image || featuredPost.thumbnail) && (
                    <img src={featuredPost.cover_image || featuredPost.thumbnail} alt="" />
                  )}
                  <span className="persona-writing-featured-shape persona-writing-featured-shape-red" />
                  <span className="persona-writing-featured-shape persona-writing-featured-shape-yellow" />
                  <span className="persona-writing-featured-number">01</span>
                </div>
                <div className="persona-writing-featured-copy">
                  <div className="persona-writing-featured-meta">
                    <span>FEATURED / {featuredPost.category || 'THOUGHT'}</span>
                    <span>{formatDate(featuredPost.created_at)}</span>
                  </div>
                  <h3>{featuredPost.title}</h3>
                  <p>
                    {featuredPost.excerpt ||
                      featuredPost.content.replace(/[#>*_`\u005B\]()]/g, ' ').slice(0, 240)}
                  </p>
                  <div className="persona-writing-featured-foot">
                    <span>{featuredPost.reading_time || 'READ'}</span>
                    <span>
                      OPEN ESSAY <Icon icon="mdi:arrow-top-right" width={18} />
                    </span>
                  </div>
                </div>
              </button>
              <a
                className="persona-writing-featured-link"
                href={getPostHref(featuredPost.slug)}
                aria-label={`Direct link to ${featuredPost.title}`}
                title="Open direct link"
              >
                <Icon icon="mdi:link-variant" width={17} aria-hidden="true" />
              </a>
            </article>
          )}

          {archivePosts.length > 0 && (
            <div className="persona-writing-archive">
              <div className="persona-writing-archive-head">
                <div>
                  <span>02 / ARCHIVE</span>
                  <h4>Everything else</h4>
                </div>
                <p>
                  {archivePosts.length} {archivePosts.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>

              <div className="persona-writing-archive-list">
                {paginatedPosts.map((post, index) => (
                  <article className="persona-writing-entry" key={post.id}>
                    <div className="persona-writing-entry-index">
                      <span>
                        {String((currentPage - 1) * POSTS_PER_PAGE + index + 2).padStart(2, '0')}
                      </span>
                      <i />
                    </div>
                    <button
                      className="persona-writing-entry-open"
                      type="button"
                      onClick={() => openPost(post)}
                      aria-label={`Read ${post.title}`}
                    >
                      <div className="persona-writing-entry-meta">
                        <span>{post.category || 'THOUGHT'}</span>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                      <h5>{post.title}</h5>
                      <p>
                        {post.excerpt ||
                          post.content.replace(/[#>*_`\u005B\]()]/g, ' ').slice(0, 170)}
                      </p>
                      <small>
                        {post.reading_time || 'READ'}
                        {post.tags?.length ? ` / ${post.tags.slice(0, 3).join(' · ')}` : ''}
                      </small>
                    </button>
                    <div className="persona-writing-entry-action">
                      <a
                        href={getPostHref(post.slug)}
                        aria-label={`Direct link to ${post.title}`}
                        title="Open direct link"
                      >
                        <Icon icon="mdi:link-variant" width={16} />
                      </a>
                      <button
                        type="button"
                        onClick={() => openPost(post)}
                        aria-label={`Open ${post.title}`}
                      >
                        <Icon icon="mdi:arrow-top-right" width={21} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="persona-writing-pagination" aria-label="Writings pagination">
                  <span className="persona-writing-page-status">
                    PAGE {String(currentPage).padStart(2, '0')} /{' '}
                    {String(totalPages).padStart(2, '0')}
                  </span>
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
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <Icon icon="mdi:arrow-left" width={18} />
                  </button>
                  <button
                    type="button"
                    className="persona-writing-page-control"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <Icon icon="mdi:arrow-right" width={18} />
                  </button>
                </nav>
              )}
            </div>
          )}
        </>
      )}

      {selectedPost && (
        <div
          className="persona-writing-reader-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePost();
          }}
        >
          <div
            className="persona-writing-reader"
            ref={readerRef}
            role="dialog"
            aria-modal="true"
            aria-label={selectedPost.title}
          >
            <div className="persona-reader-progress" aria-hidden="true">
              <span style={{ width: `${readerProgress}%` }} />
            </div>
            <button
              className="persona-reader-close"
              type="button"
              onClick={closePost}
              aria-label="Close"
            >
              <Icon icon="mdi:close" width={24} />
            </button>

            <header
              className={`persona-reader-hero ${selectedPost.cover_image || selectedPost.thumbnail ? 'has-image' : 'no-image'}`}
            >
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
                    <Icon icon="mdi:clock-outline" width={16} />{' '}
                    {selectedPost.reading_time || 'Reading time unavailable'}
                  </span>
                  <span>
                    <Icon icon="mdi:calendar-outline" width={16} />{' '}
                    {formatDate(selectedPost.created_at)}
                  </span>
                  {selectedPost.updated_at && (
                    <span>
                      <Icon icon="mdi:update" width={16} /> Updated{' '}
                      {formatDate(selectedPost.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            </header>

            <main className="persona-reader-main">
              <div className="persona-reader-topbar">
                <button className="persona-reader-back" type="button" onClick={closePost}>
                  <Icon icon="mdi:arrow-left" width={18} /> Back to Writings
                </button>
                <button
                  className="persona-reader-copy"
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                >
                  <Icon icon="mdi:link-variant" width={17} /> Copy link
                </button>
              </div>

              {selectedPost.excerpt && (
                <div className="persona-reader-excerpt">{selectedPost.excerpt}</div>
              )}

              {tocItems.length > 0 && (
                <div className="persona-reader-toc-mobile">
                  <button
                    type="button"
                    onClick={() => setTocOpen((open) => !open)}
                    aria-expanded={tocOpen}
                  >
                    <span>
                      <Icon icon="mdi:format-list-bulleted" /> In this article
                    </span>
                    <Icon icon={tocOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} />
                  </button>
                  {tocOpen && (
                    <nav aria-label="Table of contents">
                      {tocItems.map((item) => (
                        <button
                          key={item.id}
                          className={activeTocId === item.id ? 'active' : ''}
                          onClick={() => scrollToHeading(item.id)}
                          type="button"
                        >
                          {item.label}
                        </button>
                      ))}
                    </nav>
                  )}
                </div>
              )}

              <div
                className={`persona-reader-layout ${tocItems.length > 0 ? 'has-toc' : 'no-toc'}`}
              >
                {tocItems.length > 0 && (
                  <aside className="persona-reader-toc" aria-label="Table of contents">
                    <div className="persona-reader-toc-label">ON THIS PAGE</div>
                    <nav>
                      {tocItems.map((item) => (
                        <button
                          key={item.id}
                          className={`${activeTocId === item.id ? 'active' : ''} level-${item.level}`}
                          onClick={() => scrollToHeading(item.id)}
                          type="button"
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </nav>
                  </aside>
                )}

                <article className="persona-writing-content persona-reader-body" ref={articleRef}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
                    components={{
                      h1: ({ children, ...props }: any) => (
                        <h1 className="persona-md-h1" {...props}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children, ...props }: any) => (
                        <h2 className="persona-md-h2" {...props}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children, ...props }: any) => (
                        <h3 className="persona-md-h3" {...props}>
                          {children}
                        </h3>
                      ),
                      h4: ({ children, ...props }: any) => (
                        <h4 className="persona-md-h4" {...props}>
                          {children}
                        </h4>
                      ),
                      h5: ({ children, ...props }: any) => (
                        <h5 className="persona-md-h5" {...props}>
                          {children}
                        </h5>
                      ),
                      h6: ({ children, ...props }: any) => (
                        <h6 className="persona-md-h6" {...props}>
                          {children}
                        </h6>
                      ),
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
                      blockquote: ({ children, ...props }: any) => (
                        <blockquote className="persona-md-quote" {...props}>
                          <span className="persona-md-quote-mark" aria-hidden="true">
                            “
                          </span>
                          <div className="persona-md-quote-content">{children}</div>
                        </blockquote>
                      ),
                      hr: (props: any) => <hr className="persona-md-hr" {...props} />,
                    }}
                  >
                    {selectedPost.content}
                  </ReactMarkdown>
                </article>
              </div>
            </main>
          </div>
        </div>
      )}
    </section>
  );
};

export default WritingsSection;
