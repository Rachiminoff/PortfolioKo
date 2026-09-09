import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '@iconify/react';
import PersonaSectionHeader from './PersonaSectionHeader';
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

const WritingsSection: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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

  useEffect(() => {
    if (!selectedPost) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPost(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPost]);

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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <section className="persona-notes" aria-labelledby="persona-notes-title">
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
            visiblePosts.map((post) => (
              <button
                className="persona-note"
                key={post.id}
                type="button"
                onClick={() => setSelectedPost(post)}
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
            ))
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
            if (event.target === target && !isScrollbar) setSelectedPost(null);
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
              onClick={() => setSelectedPost(null)}
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
            <main className="persona-reader-main">
              <button className="persona-reader-back" onClick={() => setSelectedPost(null)}>
                <Icon icon="mdi:arrow-left" width={18} /> Back to Writings
              </button>
              {selectedPost.excerpt && (
                <div className="persona-reader-excerpt">{selectedPost.excerpt}</div>
              )}
              <div className="persona-writing-content persona-reader-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPost.content}</ReactMarkdown>
              </div>
            </main>
          </div>
        </div>
      )}
    </section>
  );
};

export default WritingsSection;
