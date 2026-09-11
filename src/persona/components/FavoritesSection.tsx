import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import PersonaSectionHeader from './PersonaSectionHeader';
import { favorites, PersonaMediaItem } from '../data/persona.data';

type ResolvedImages = Record<string, string>;

const malImageCache = new Map<string, string>();

async function resolveMalImage(query: string): Promise<string | undefined> {
  if (malImageCache.has(query)) return malImageCache.get(query);
  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`,
    );
    if (!response.ok) return undefined;
    const payload = await response.json();
    const image =
      payload?.data?.[0]?.images?.jpg?.large_image_url ||
      payload?.data?.[0]?.images?.jpg?.image_url;
    if (image) malImageCache.set(query, image);
    return image;
  } catch {
    return undefined;
  }
}

const FavoritesSection: React.FC = () => {
  const [selected, setSelected] = useState<{ category: string; item: PersonaMediaItem } | null>(
    null,
  );
  const [resolvedImages, setResolvedImages] = useState<ResolvedImages>({});
  const [pages, setPages] = useState<Record<string, number>>({});

  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    const mangaItems = favorites.Manga ?? [];
    let cancelled = false;
    Promise.all(
      mangaItems
        .filter((item) => item.malQuery)
        .map(async (item) => [item.title, await resolveMalImage(item.malQuery!)] as const),
    ).then((results) => {
      if (cancelled) return;
      const next: ResolvedImages = {};
      results.forEach(([title, image]) => {
        if (image) next[title] = image;
      });
      setResolvedImages(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selected]);

  const imageFor = (item: PersonaMediaItem) =>
    item.malQuery ? resolvedImages[item.title] : item.image;

  return (
    <section className="persona-media" id="favorites" aria-labelledby="persona-media-title">
      <PersonaSectionHeader
        index="02 / TASTE"
        title="FAVOURITES"
        note="A VERY SUBJECTIVE DATABASE — NO RANKING, NO LIMIT"
        id="persona-media-title"
      />

      <div className="persona-media-sections">
        {Object.entries(favorites).map(([category, items]) => (
          <section className="persona-media-group" key={category}>
            {(() => {
              const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
              const currentPage = Math.min(pages[category] ?? 1, totalPages);
              const start = (currentPage - 1) * ITEMS_PER_PAGE;
              const visibleItems = items.slice(start, start + ITEMS_PER_PAGE);

              return (
                <>
                  <div className="persona-group-title">
                    <span>{category}</span>
                    <span className="persona-group-count">
                      {String(items.length).padStart(2, '0')} ENTRIES
                    </span>
                    <i />
                  </div>
                  <div className="persona-media-list">
                    {visibleItems.map((item, index) => {
                      const absoluteIndex = start + index;
                      const image = imageFor(item);
                      return (
                        <button
                          className="persona-media-card"
                          key={`${category}-${item.title}-${absoluteIndex}`}
                          type="button"
                          onClick={() => setSelected({ category, item })}
                          aria-label={`Open ${item.title}`}
                        >
                          <div className="persona-media-image-wrap">
                            {image ? (
                              <img
                                src={image}
                                alt=""
                                className="persona-media-image"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="persona-media-image-placeholder" />
                            )}
                          </div>
                          <div className="persona-media-copy">
                            <span className="persona-meta">{item.meta}</span>
                            <h3>{item.title}</h3>
                            <p>{item.note}</p>
                          </div>
                          <span className="persona-card-number">
                            #{String(absoluteIndex + 1).padStart(2, '0')}
                          </span>
                          <Icon
                            className="persona-media-arrow"
                            icon="mdi:arrow-top-right"
                            width={19}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="persona-media-pagination" aria-label={`${category} pagination`}>
                      <button
                        type="button"
                        className="persona-media-page-control"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setPages((prev) => ({ ...prev, [category]: currentPage - 1 }))
                        }
                        aria-label={`Previous ${category} page`}
                      >
                        <Icon icon="mdi:arrow-left" width={16} />
                      </button>
                      <div className="persona-media-page-numbers">
                        {Array.from({ length: totalPages }, (_, pageIndex) => {
                          const page = pageIndex + 1;
                          return (
                            <button
                              key={page}
                              type="button"
                              className={page === currentPage ? 'active' : ''}
                              aria-current={page === currentPage ? 'page' : undefined}
                              onClick={() => setPages((prev) => ({ ...prev, [category]: page }))}
                            >
                              {String(page).padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>
                      <span className="persona-media-page-status">
                        {String(currentPage).padStart(2, '0')} /{' '}
                        {String(totalPages).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        className="persona-media-page-control"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setPages((prev) => ({ ...prev, [category]: currentPage + 1 }))
                        }
                        aria-label={`Next ${category} page`}
                      >
                        <Icon icon="mdi:arrow-right" width={16} />
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </section>
        ))}
      </div>

      {selected && (
        <div className="persona-media-modal-backdrop" onMouseDown={() => setSelected(null)}>
          <article
            className="persona-media-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="persona-media-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="persona-modal-close"
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <Icon icon="mdi:close" width={24} />
            </button>
            <div className="persona-modal-index">
              02 / TASTE / {selected.category.toUpperCase()}
            </div>
            <div className="persona-modal-layout">
              <div className="persona-modal-art">
                {imageFor(selected.item) ? (
                  <img
                    src={imageFor(selected.item)}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div />
                )}
              </div>
              <div className="persona-modal-copy">
                <span className="persona-meta">{selected.item.meta}</span>
                <h2 id="persona-media-modal-title">{selected.item.title}</h2>
                <div className="persona-modal-rule" />
                <span className="persona-modal-label">WHY IT STAYS</span>
                <p>{selected.item.note}</p>
                {selected.item.source && (
                  <a
                    className="persona-modal-source"
                    href={selected.item.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    OPEN SOURCE ↗
                  </a>
                )}
                <span className="persona-modal-hint">ESC TO CLOSE</span>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
};

export default FavoritesSection;
