import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  LoaderCircle,
  Search,
  ExternalLink,
  BookMarked,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Library,
  CalendarDays,
  Gamepad2,
  LayoutGrid,
  List,
  PieChart,
  CheckCircle2,
  ArrowUpRight,
  Film,
  Sparkles,
  Trophy,
  Compass,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './MasterlistPage.scss';

type MangaStatus = 'Reading' | 'Completed' | 'On-Hold' | 'Dropped' | 'Plan to Read' | string;
type AniListMetadata = {
  id: number;
  siteUrl: string;
  description: string | null;
  genres: string[];
  format: string | null;
  status: string | null;
  countryOfOrigin: string | null;
  chapters: number | null;
  volumes: number | null;
  averageScore: number | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  coverImage: { extraLarge: string | null; large: string | null };
  staff: { edges: { role: string; node: { name: { full: string } } }[] };
};
type CachedAniListMetadata = AniListMetadata | { _notFound: boolean };
type MangaEntry = {
  id: number | string;
  title: string;
  anilist_id: number | null;
  mal_id: number | null;
  total_volumes: number | null;
  total_chapters: number | null;
  read_volumes: number | null;
  read_chapters: number | null;
  score: number | null;
  status: MangaStatus;
  start_date: string | null;
  finish_date: string | null;
  tags: string[] | null;
  comments: string | null;
  cover_url: string | null;
  anilist_metadata: CachedAniListMetadata | null;
  anilist_fetched_at: string | null;
  anilist_fetch_status: string | null;
};

type MovieEntry = {
  id: string;
  title: string;
  year: number | null;
  watchlistDate: string | null;
  letterboxdUri: string | null;
  posterUrl: string | null;
  country: string | null;
  genres: string[];
  status: string;
  rating: number | null;
  notes: string | null;
  format: string;
};

type GameEntry = {
  id: string;
  title: string;
  coverUrl: string | null;
  releaseDate: string;
  platform: string;
  status: string;
  completion: string;
  ownership: string;
  format: string;
  country: string;
  playtime: string;
  timesCompleted: number;
  completionDate: string;
  notes: string;
  score: number | null;
  tags: string[];
};

const ANILIST_FIELDS = `id siteUrl description(asHtml: false) genres format status countryOfOrigin chapters volumes averageScore startDate { year month day } coverImage { extraLarge large } staff(perPage: 25, sort: [RELEVANCE, ID]) { edges { role node { name { full } } } }`;
const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const METADATA_BATCH_SIZE = 8;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchAniListBatch(
  entries: MangaEntry[],
): Promise<Record<string, AniListMetadata | null>> {
  const validEntries = entries.filter((entry) => entry.anilist_id || entry.mal_id);
  if (!validEntries.length) return {};
  const fields = validEntries.map((entry, index) => {
    const key = `m${index}`;
    const id = entry.anilist_id ?? entry.mal_id;
    const idField = entry.anilist_id ? 'id' : 'idMal';
    return `${key}: Media(${idField}: ${Number(id)}, type: MANGA) { ${ANILIST_FIELDS} }`;
  });
  const query = `query { ${fields.join('\n')} }`;
  let response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query }),
  });
  // A few restrictive proxies normalize GraphQL endpoints differently.
  if (response.status === 404) {
    response = await fetch(`${ANILIST_ENDPOINT}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query }),
    });
  }
  if (!response.ok)
    throw new Error(`AniList returned HTTP ${response.status}. Metadata sync will retry later.`);
  const payload = await response.json();
  if (payload.errors?.length && !payload.data) {
    throw new Error(
      payload.errors[0]?.message || 'AniList could not process the metadata request.',
    );
  }
  const result: Record<string, AniListMetadata | null> = {};
  validEntries.forEach((entry, index) => {
    result[String(entry.id)] = (payload.data?.[`m${index}`] ?? null) as AniListMetadata | null;
  });
  return result;
}

function safeMetadata(entry: MangaEntry): AniListMetadata | null {
  if (!entry.anilist_metadata || (entry.anilist_metadata as any)._notFound) return null;
  return entry.anilist_metadata as AniListMetadata;
}

function getTotalChapters(entry: MangaEntry) {
  return entry.total_chapters && entry.total_chapters > 0
    ? entry.total_chapters
    : (safeMetadata(entry)?.chapters ?? null);
}

function getTotalVolumes(entry: MangaEntry) {
  return entry.total_volumes && entry.total_volumes > 0
    ? entry.total_volumes
    : (safeMetadata(entry)?.volumes ?? null);
}

function cleanDescription(description: string | null | undefined) {
  return (description ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function DistributionList({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; detail?: string }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="manga-stat-panel">
      <div className="manga-stat-panel-heading">
        <h3>{title}</h3>
        <span>{total.toLocaleString()} total</span>
      </div>
      {items.length === 0 ? (
        <p className="manga-stat-empty">Metadata will appear here as AniList syncs.</p>
      ) : (
        <div className="manga-distribution-list">
          {items.map((item) => (
            <div className="manga-distribution-row" key={item.label}>
              <div className="manga-distribution-label">
                <span>{item.label}</span>
                <strong>{item.detail ?? item.value.toLocaleString()}</strong>
              </div>
              <div className="manga-bar-track">
                <span
                  style={{
                    width: `${Math.max(item.value > 0 ? 1 : 0, (item.value / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MiniDonut({
  items,
  variant = 'donut',
}: {
  items: { label: string; value: number }[];
  variant?: 'donut' | 'pie';
}) {
  const palette = ['#f4c430', '#e53935', '#2457d6', '#68b6a3', '#e8e3d5', '#8b6bd6', '#d98b42'];
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;
  const segments = items
    .filter((item) => item.value > 0)
    .map((item, index) => {
      const start = cursor;
      cursor += (item.value / total) * 100;
      return `${palette[index % palette.length]} ${start}% ${cursor}%`;
    });
  return (
    <div className={`masterlist-donut-wrap ${variant === 'pie' ? 'is-pie-chart' : ''}`}>
      <div
        className={variant === 'pie' ? 'masterlist-pie' : 'masterlist-donut'}
        style={{
          background: `conic-gradient(${segments.length ? segments.join(', ') : '#252832 0% 100%'})`,
        }}
      >
        {variant === 'donut' && (
          <div>
            <strong>{total === 1 && !items.length ? '—' : total.toLocaleString()}</strong>
            <span>ENTRIES</span>
          </div>
        )}
      </div>
      <div className="masterlist-donut-legend">
        {items
          .filter((item) => item.value > 0)
          .map((item, index) => (
            <div key={item.label}>
              <i style={{ background: palette[index % palette.length] }} />
              <span>{item.label}</span>
              <strong>{Math.round((item.value / total) * 100)}%</strong>
            </div>
          ))}
      </div>
    </div>
  );
}

const MangaMetadata: React.FC<{ entry: MangaEntry }> = ({ entry }) => {
  const [open, setOpen] = useState(false);
  const metadata = safeMetadata(entry);
  // AniList metadata can be partial or malformed for entries that do not match an AniList record.
  // Guard each nested field so a missing staff connection never crashes the Literature tab.
  const authors = (metadata?.staff?.edges ?? [])
    .filter((edge) => /story|art|original|author|illustration/i.test(edge?.role ?? ''))
    .map((edge) => {
      const name = edge?.node?.name?.full;
      return name ? `${name}${edge.role ? ` (${edge.role})` : ''}` : null;
    })
    .filter((author): author is string => Boolean(author));
  return (
    <div className="manga-metadata-wrap">
      <button
        className="manga-metadata-toggle"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? 'Hide AniList metadata' : 'View AniList metadata'} <ExternalLink size={13} />
      </button>
      {open && (
        <div className="manga-metadata-panel">
          {!metadata ? (
            <p className="manga-metadata-muted">
              {entry.anilist_fetch_status === 'not_found'
                ? 'No matching AniList entry was found for this ID.'
                : 'Metadata has not synced yet. The background sync will retry when AniList is available.'}
            </p>
          ) : (
            <>
              {metadata.description && (
                <p className="manga-metadata-description">
                  {cleanDescription(metadata.description)}
                </p>
              )}
              <dl className="manga-metadata-grid">
                <div>
                  <dt>Year</dt>
                  <dd>{metadata.startDate?.year ?? 'Unknown'}</dd>
                </div>
                <div>
                  <dt>Genres</dt>
                  <dd>{metadata.genres?.length ? metadata.genres.join(', ') : 'Unknown'}</dd>
                </div>
                <div>
                  <dt>Author / staff</dt>
                  <dd>
                    {authors?.length ? Array.from(new Set(authors)).join(', ') : 'Not listed'}
                  </dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{metadata.format ?? 'Unknown'}</dd>
                </div>
                <div>
                  <dt>Publication</dt>
                  <dd>{metadata.status?.replace(/_/g, ' ') ?? 'Unknown'}</dd>
                </div>
                <div>
                  <dt>Volumes / chapters</dt>
                  <dd>
                    {metadata.volumes ?? '—'} / {metadata.chapters ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt>AniList score</dt>
                  <dd>
                    {metadata.averageScore != null ? `${metadata.averageScore}/100` : 'Unrated'}
                  </dd>
                </div>
                <div>
                  <dt>Country</dt>
                  <dd>{metadata.countryOfOrigin ?? 'Unknown'}</dd>
                </div>
              </dl>
              {metadata.siteUrl && (
                <a
                  className="manga-external-link"
                  href={metadata.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open AniList entry <ExternalLink size={13} />
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const STATUSES = ['All', 'Reading', 'Completed', 'On-Hold', 'Dropped', 'Plan to Read'];

const MasterlistContent: React.FC = () => {
  const [entries, setEntries] = useState<MangaEntry[]>([]);
  const entriesRef = useRef<MangaEntry[]>([]);
  entriesRef.current = entries;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('Waiting for your list…');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ done: 0, total: 0 });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'title' | 'score' | 'progress'>('title');
  const [activeTab, setActiveTab] = useState<'stats' | 'manga' | 'games' | 'movies'>('stats');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [games, setGames] = useState<GameEntry[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState('');
  const [gameQuery, setGameQuery] = useState('');
  const [gameStatusFilter, setGameStatusFilter] = useState('All');
  const [gameSortBy, setGameSortBy] = useState<'title' | 'score' | 'platform'>('title');
  const [movies, setMovies] = useState<MovieEntry[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState('');
  const [movieQuery, setMovieQuery] = useState('');
  const [movieStatusFilter, setMovieStatusFilter] = useState('All');
  const [movieSortBy, setMovieSortBy] = useState<'title' | 'year' | 'rating'>('title');

  const loadEntries = async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase
      .from('manga_masterlist')
      .select(
        'id,title,anilist_id,mal_id,total_volumes,total_chapters,read_volumes,read_chapters,score,status,start_date,finish_date,tags,comments,cover_url,anilist_metadata,anilist_fetched_at,anilist_fetch_status',
      )
      .order('title', { ascending: true });
    if (loadError) setError(`Could not load Literature. ${loadError.message}`);
    else setEntries((data ?? []) as MangaEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadGames = async () => {
      setGamesLoading(true);
      setGamesError('');
      const { data, error: loadError } = await supabase
        .from('game_masterlist')
        .select(
          'igdb_id,game_name,cover_url,game_release_date,platform,status,completion,ownership,format,country,playtime,times_completed,completion_date,progress_notes,collection_notes,rating_score,tags',
        )
        .order('game_name', { ascending: true });

      if (cancelled) return;
      if (loadError) {
        setGamesError(`Could not load the game collection from Supabase. ${loadError.message}`);
        setGames([]);
      } else {
        const parsed = (data ?? []).map((record: any): GameEntry => {
          const playtime =
            record.playtime == null || record.playtime === ''
              ? ''
              : `${Number(record.playtime).toLocaleString()}${Number(record.playtime) === 1 ? ' hour' : ' hours'}`;
          return {
            id: String(record.igdb_id),
            title: record.game_name || 'Untitled game',
            coverUrl: record.cover_url || null,
            releaseDate: record.game_release_date || '',
            platform: record.platform || 'Platform not specified',
            status: record.status || 'No Status',
            completion: record.completion || 'Not specified',
            ownership: record.ownership || 'Not specified',
            format: record.format || 'Not specified',
            country: record.country || '',
            playtime: playtime === '0 hours' ? '' : playtime,
            timesCompleted: Number(record.times_completed || 0) || 0,
            completionDate: record.completion_date || '',
            notes: record.progress_notes || record.collection_notes || '',
            score:
              record.rating_score != null && Number.isFinite(Number(record.rating_score))
                ? Number(record.rating_score)
                : null,
            tags: String(record.tags || '')
              .split(/[;,]/)
              .map((tag: string) => tag.trim())
              .filter(Boolean),
          };
        });
        setGames(parsed);
      }
      setGamesLoading(false);
    };
    void loadGames();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadMovies = async () => {
      setMoviesLoading(true);
      setMoviesError('');
      const { data, error: loadError } = await supabase
        .from('movie_masterlist')
        .select(
          'id,title,release_year,watchlist_date,letterboxd_uri,poster_url,country,genres,status,rating,notes,format',
        )
        .order('title', { ascending: true });
      if (cancelled) return;
      if (loadError) {
        setMoviesError(`Could not load the movie collection from Supabase. ${loadError.message}`);
        setMovies([]);
      } else
        setMovies(
          (data ?? []).map((record: any): MovieEntry => ({
            id: String(record.id ?? record.letterboxd_uri ?? record.title),
            title: record.title || 'Untitled movie',
            year: record.release_year == null ? null : Number(record.release_year),
            watchlistDate: record.watchlist_date || null,
            letterboxdUri: record.letterboxd_uri || null,
            posterUrl: record.poster_url || null,
            country: record.country || null,
            genres: Array.isArray(record.genres)
              ? record.genres
              : String(record.genres || '')
                  .split(/[;,]/)
                  .map((tag: string) => tag.trim())
                  .filter(Boolean),
            status: record.status || 'Watchlist',
            rating:
              record.rating != null && Number.isFinite(Number(record.rating))
                ? Number(record.rating)
                : null,
            notes: record.notes || null,
            format: record.format || 'Film',
          })),
        );
      setMoviesLoading(false);
    };
    void loadMovies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || !entriesRef.current.length) return;
    let cancelled = false;
    const syncMetadata = async () => {
      const now = Date.now();
      const needsMetadata = entriesRef.current.filter((entry) => {
        if (!entry.anilist_id && !entry.mal_id) return false;
        const fetchedAt = entry.anilist_fetched_at
          ? new Date(entry.anilist_fetched_at).getTime()
          : 0;
        const cacheExpired = !fetchedAt || now - fetchedAt > CACHE_TTL_MS;
        return cacheExpired && entry.anilist_fetch_status !== 'not_found';
      });
      if (!needsMetadata.length) {
        setSyncMessage('Metadata cache is up to date.');
        return;
      }
      setSyncing(true);
      setSyncProgress({ done: 0, total: needsMetadata.length });
      setSyncMessage(
        `Syncing AniList metadata for ${needsMetadata.length.toLocaleString()} titles…`,
      );
      let done = 0;
      for (let start = 0; start < needsMetadata.length; start += METADATA_BATCH_SIZE) {
        if (cancelled) break;
        const batch = needsMetadata.slice(start, start + METADATA_BATCH_SIZE);
        try {
          let batchResult: Record<string, AniListMetadata | null> = {};
          let lastError: Error | null = null;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              batchResult = await fetchAniListBatch(batch);
              lastError = null;
              break;
            } catch (err) {
              lastError =
                err instanceof Error ? err : new Error('AniList metadata request failed.');
              if (attempt < 2) await wait(1200 * (attempt + 1));
            }
          }
          if (lastError) throw lastError;

          const updates = batch.map(async (entry) => {
            const metadata = batchResult[String(entry.id)] ?? null;
            const updatePayload = {
              anilist_metadata: metadata ?? { _notFound: true },
              anilist_fetched_at: new Date().toISOString(),
              anilist_fetch_status: metadata ? 'ok' : 'not_found',
            };
            const { error: updateError } = await supabase
              .from('manga_masterlist')
              .update(updatePayload)
              .eq('id', entry.id);
            if (updateError)
              throw new Error(
                `Could not cache AniList metadata for "${entry.title}": ${updateError.message}`,
              );
            return { id: entry.id, ...updatePayload };
          });
          const saved = await Promise.all(updates);
          if (cancelled) break;
          setEntries((current) =>
            current.map((entry) => {
              const savedEntry = saved.find((item) => String(item.id) === String(entry.id));
              return savedEntry ? { ...entry, ...savedEntry } : entry;
            }),
          );
          done += batch.length;
          setSyncProgress({ done, total: needsMetadata.length });
          setSyncMessage(
            `Synced ${done.toLocaleString()} of ${needsMetadata.length.toLocaleString()} titles.`,
          );
        } catch (err) {
          if (!cancelled) {
            setSyncMessage(
              err instanceof Error
                ? err.message
                : 'AniList sync paused. It will retry on a later visit.',
            );
          }
          break;
        }
        // Stay comfortably below AniList's public rate limit.
        if (start + METADATA_BATCH_SIZE < needsMetadata.length) await wait(850);
      }
      if (!cancelled && done === needsMetadata.length)
        setSyncMessage(
          `All available metadata synced · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        );
      if (!cancelled) setSyncing(false);
    };
    void syncMetadata();
    return () => {
      cancelled = true;
    };
  }, [loading]); // Read the latest entries via ref; this background cache starts once after the initial list load.

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = entries.filter((entry) => {
      const matchesQuery =
        !needle ||
        [entry.title, entry.comments, ...(entry.tags ?? [])].some((value) =>
          value?.toLowerCase().includes(needle),
        );
      return matchesQuery && (statusFilter === 'All' || entry.status === statusFilter);
    });
    return result.sort((a, b) => {
      if (sortBy === 'score')
        return (b.score ?? -1) - (a.score ?? -1) || a.title.localeCompare(b.title);
      if (sortBy === 'progress')
        return (b.read_chapters ?? 0) - (a.read_chapters ?? 0) || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });
  }, [entries, query, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const metadataEntries = entries.map((entry) => ({ entry, metadata: safeMetadata(entry) }));
    const scores = entries
      .map((entry) => entry.score)
      .filter((score): score is number => score != null && score > 0);
    const meanScore = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
    const standardDeviation = scores.length
      ? Math.sqrt(
          scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / scores.length,
        )
      : 0;
    const chaptersRead = entries.reduce((sum, entry) => sum + (entry.read_chapters ?? 0), 0);
    const volumesRead = entries.reduce((sum, entry) => sum + (entry.read_volumes ?? 0), 0);
    const plannedChapters = entries.reduce((sum, entry) => {
      const total = getTotalChapters(entry) ?? 0;
      if (
        entry.status === 'Plan to Read' ||
        entry.status === 'Reading' ||
        entry.status === 'On-Hold'
      ) {
        return sum + Math.max(0, total - (entry.read_chapters ?? 0));
      }
      return sum;
    }, 0);
    const countBy = (values: (string | number | null | undefined)[]) => {
      const counts = new Map<string, number>();
      values.forEach((value) => {
        if (value === null || value === undefined || value === '') return;
        const label = String(value);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      });
      return Array.from(counts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    };
    const status = countBy(entries.map((entry) => entry.status));
    const genreCounts = new Map<string, number>();
    metadataEntries.forEach(({ metadata, entry }) => {
      const genres = metadata?.genres?.length ? metadata.genres : (entry.tags ?? []);
      genres.forEach((genre) => genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1));
    });
    const genres = Array.from(genreCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, 10);
    const formats = countBy(metadataEntries.map(({ metadata }) => metadata?.format));
    const countries = countBy(metadataEntries.map(({ metadata }) => metadata?.countryOfOrigin));
    const scoreCounts = countBy(scores);
    const scoreDistribution = scoreCounts
      .sort((a, b) => Number(a.label) - Number(b.label))
      .map((item) => ({
        ...item,
        detail: `${item.value} title${item.value === 1 ? '' : 's'} · ${entries
          .filter((entry) => String(entry.score) === item.label)
          .reduce((sum, entry) => sum + (entry.read_chapters ?? 0), 0)
          .toLocaleString()} ch.`,
      }));
    const chapterBuckets = [
      { label: '0 chapters', min: 0, max: 0 },
      { label: '1–10', min: 1, max: 10 },
      { label: '11–25', min: 11, max: 25 },
      { label: '26–50', min: 26, max: 50 },
      { label: '51–100', min: 51, max: 100 },
      { label: '101–200', min: 101, max: 200 },
      { label: '201+', min: 201, max: Infinity },
    ].map((bucket) => {
      const matching = entries.filter((entry) => {
        const chapters = getTotalChapters(entry);
        return chapters != null && chapters >= bucket.min && chapters <= bucket.max;
      });
      const scored = matching.filter((entry) => (entry.score ?? 0) > 0);
      const average = scored.length
        ? scored.reduce((sum, entry) => sum + (entry.score ?? 0), 0) / scored.length
        : null;
      return {
        label: bucket.label,
        value: matching.length,
        detail: `${matching.length} titles · ${average === null ? '—' : average.toFixed(1)} mean score`,
      };
    });
    const releaseYears = countBy(
      metadataEntries.map(({ metadata }) => metadata?.startDate?.year),
    ).sort((a, b) => Number(a.label) - Number(b.label));
    const readYears = countBy(
      entries.map((entry) => entry.finish_date?.slice(0, 4) ?? entry.start_date?.slice(0, 4)),
    ).sort((a, b) => Number(a.label) - Number(b.label));
    const topItems = (items: { label: string; value: number }[]) =>
      items
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
        .slice(0, 7)
        .map((item) => ({
          ...item,
          detail: `${Math.round(
            (item.value /
              Math.max(
                1,
                items.reduce((sum, x) => sum + x.value, 0),
              )) *
              100,
          )}%`,
        }));
    return {
      chaptersRead,
      volumesRead,
      plannedChapters,
      meanScore,
      standardDeviation,
      completed: entries.filter((entry) => entry.status === 'Completed').length,
      reading: entries.filter((entry) => entry.status === 'Reading').length,
      scoreCount: scores.length,
      genres,
      genreCount: genreCounts.size,
      formats: topItems(formats),
      countries,
      status,
      scoreDistribution,
      chapterBuckets,
      releaseYears,
      readYears,
      metadataCount: metadataEntries.filter(({ metadata }) => !!metadata).length,
    };
  }, [entries]);

  const filteredGames = useMemo(() => {
    const needle = gameQuery.trim().toLowerCase();
    const result = games.filter((game) => {
      const matchesQuery =
        !needle ||
        [
          game.title,
          game.platform,
          game.status,
          game.completion,
          game.ownership,
          ...game.tags,
        ].some((value) => value.toLowerCase().includes(needle));
      return matchesQuery && (gameStatusFilter === 'All' || game.status === gameStatusFilter);
    });
    return result.sort((a, b) => {
      if (gameSortBy === 'score')
        return (b.score ?? -1) - (a.score ?? -1) || a.title.localeCompare(b.title);
      if (gameSortBy === 'platform')
        return a.platform.localeCompare(b.platform) || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });
  }, [games, gameQuery, gameStatusFilter, gameSortBy]);

  const gameStats = useMemo(() => {
    const countBy = (values: string[]) => {
      const counts = new Map<string, number>();
      values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
      return Array.from(counts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    };
    const rated = games.filter((game) => game.score != null);
    const normalized = (value: string) => value.trim().toLowerCase();
    const isCompleted = (game: GameEntry) =>
      /completed|beaten|100%/.test(normalized(game.completion));
    const isPlayed = (game: GameEntry) =>
      /played|playing|in progress/.test(normalized(game.status));
    return {
      played: games.filter(isPlayed).length,
      owned: games.filter((game) => normalized(game.ownership) === 'owned').length,
      completed: games.filter(isCompleted).length,
      ratedCount: rated.length,
      meanScore: rated.length
        ? rated.reduce((sum, game) => sum + (game.score ?? 0), 0) / rated.length
        : 0,
      platforms: countBy(games.map((game) => game.platform)).slice(0, 8),
      completion: countBy(games.map((game) => game.completion)),
      formats: countBy(games.map((game) => game.format)),
      ownership: countBy(games.map((game) => game.ownership)),
      status: countBy(games.map((game) => game.status)),
      countries: countBy(games.map((game) => game.country)),
      releaseYears: countBy(
        games.map((game) => (game.releaseDate ? game.releaseDate.slice(0, 4) : '')),
      ).sort((a, b) => Number(a.label) - Number(b.label)),
      scoreDistribution: countBy(rated.map((game) => String(game.score))).sort(
        (a, b) => Number(a.label) - Number(b.label),
      ),
    };
  }, [games]);

  const filteredMovies = useMemo(() => {
    const needle = movieQuery.trim().toLowerCase();
    const result = movies.filter((movie) => {
      const searchable = [
        movie.title,
        String(movie.year ?? ''),
        movie.country ?? '',
        movie.status,
        ...movie.genres,
      ];
      return (
        (!needle || searchable.some((value) => value.toLowerCase().includes(needle))) &&
        (movieStatusFilter === 'All' || movie.status === movieStatusFilter)
      );
    });
    return result.sort((a, b) => {
      if (movieSortBy === 'year')
        return (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title);
      if (movieSortBy === 'rating')
        return (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });
  }, [movies, movieQuery, movieStatusFilter, movieSortBy]);

  const movieStats = useMemo(() => {
    const rated = movies.filter((movie) => movie.rating != null);
    const counts = (values: string[]) => {
      const map = new Map<string, number>();
      values.filter(Boolean).forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
      return Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    };
    const genreCounts = new Map<string, number>();
    movies.forEach((movie) => {
      const uniqueGenres = new Set<string>();
      movie.genres.forEach((rawGenre) => {
        const genre = rawGenre.trim();
        if (genre) uniqueGenres.add(genre);
      });
      uniqueGenres.forEach((genre) => genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1));
    });
    const scoreDistribution = counts(rated.map((movie) => String(movie.rating)));
    return {
      ratedCount: rated.length,
      meanScore: rated.length
        ? rated.reduce((sum, movie) => sum + (movie.rating ?? 0), 0) / rated.length
        : 0,
      statuses: counts(movies.map((movie) => movie.status)),
      countries: counts(movies.map((movie) => movie.country || 'Unknown')),
      genres: Array.from(genreCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
      formats: counts(movies.map((movie) => movie.format || 'Film')),
      releaseYears: counts(
        movies.map((movie) => (movie.year == null ? '' : String(movie.year))),
      ).sort((a, b) => Number(a.label) - Number(b.label)),
      scoreDistribution: scoreDistribution.sort((a, b) => Number(a.label) - Number(b.label)),
      posterCount: movies.filter((movie) => !!movie.posterUrl).length,
    };
  }, [movies]);

  const combinedGenres = useMemo(() => {
    const counts = new Map<string, { label: string; value: number }>();
    const addGenres = (genres: string[]) => {
      const seenForTitle = new Set<string>();
      genres
        .map((genre) => genre.trim())
        .filter(Boolean)
        .forEach((genre) => {
          const key = genre.toLocaleLowerCase();
          if (seenForTitle.has(key)) return;
          seenForTitle.add(key);
          const current = counts.get(key);
          counts.set(key, { label: current?.label ?? genre, value: (current?.value ?? 0) + 1 });
        });
    };
    entries.forEach((entry) => {
      const metadata = safeMetadata(entry);
      addGenres(metadata?.genres?.length ? metadata.genres : (entry.tags ?? []));
    });
    // Game tags are the genre/category data currently available in game_masterlist.
    games.forEach((game) => addGenres(game.tags));
    movies.forEach((movie) => addGenres(movie.genres));
    return Array.from(counts.values())
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, 10);
  }, [entries, games, movies]);

  const combinedCountries = useMemo(() => {
    const counts = new Map<string, { label: string; value: number }>();
    const addCountry = (rawCountry: string | null | undefined) => {
      const country = rawCountry?.trim();
      if (!country) return;
      const key = country.toLocaleLowerCase();
      const current = counts.get(key);
      counts.set(key, { label: current?.label ?? country, value: (current?.value ?? 0) + 1 });
    };
    entries.forEach((entry) => addCountry(safeMetadata(entry)?.countryOfOrigin));
    games.forEach((game) => addCountry(game.country));
    movies.forEach((movie) => addCountry(movie.country));
    return Array.from(counts.values())
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, 8);
  }, [entries, games, movies]);

  const formatDistribution = useMemo(() => {
    const countByFormat = (values: string[]) => {
      const counts = new Map<string, number>();
      values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
      return Array.from(counts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    };
    const mangaFormats = countByFormat(
      entries.map((entry) => safeMetadata(entry)?.format || '').filter(Boolean),
    ).map((item) => ({ ...item, label: `Literature · ${item.label}` }));
    const gameFormats = gameStats.formats.map((item) => ({
      ...item,
      label: `Games · ${item.label}`,
    }));
    const movieFormats = countByFormat(movies.map((movie) => movie.format || 'Film')).map(
      (item) => ({ ...item, label: `Movies · ${item.label}` }),
    );
    return [...mangaFormats, ...gameFormats, ...movieFormats].sort(
      (a, b) => b.value - a.value || a.label.localeCompare(b.label),
    );
  }, [entries, gameStats.formats, movies]);

  return (
    <main className="masterlist-page">
      <div className="masterlist-shell">
        <header className="masterlist-header">
          <div className="masterlist-eyebrow">
            <span className="masterlist-eyebrow-dot" /> PORTFOLIOKO / PERSONAL LIBRARY{' '}
            <span> — 001</span>
          </div>
          <div className="masterlist-heading-row">
            <div>
              <h1>
                Masterlist<span>Index.</span>
              </h1>
              <p className="masterlist-intro">
                One home for the literature you read, the games you play, and the movies you want to
                watch.
              </p>
            </div>
            <div className="masterlist-header-mark" aria-hidden="true">
              庫<span>↗</span>
            </div>
          </div>
          <div className="masterlist-rule">
            <span>01 / STATS</span>
            <i />
            <span>02 / LITERATURE</span>
            <i />
            <span>03 / GAMES</span>
            <i />
            <span>04 / MOVIES</span>
          </div>
        </header>

        <nav className="masterlist-tabs" aria-label="Masterlist sections">
          {(
            [
              { id: 'stats', label: 'Stats', icon: BarChart3, note: 'Overview & charts' },
              {
                id: 'manga',
                label: 'Literature',
                icon: BookOpen,
                note: `${entries.length} titles`,
              },
              {
                id: 'games',
                label: 'Games',
                icon: Gamepad2,
                note: gamesLoading ? 'Loading library' : `${games.length} games`,
              },
              {
                id: 'movies',
                label: 'Movies',
                icon: Film,
                note: moviesLoading ? 'Loading watchlist' : `${movies.length} films`,
              },
            ] as const
          ).map(({ id, label, icon: Icon, note }) => (
            <button
              key={id}
              type="button"
              className={`masterlist-tab ${activeTab === id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon size={17} />
              <span>{label}</span>
              <small>{note}</small>
            </button>
          ))}
        </nav>

        {activeTab === 'stats' && (
          <>
            {gamesError && (
              <div className="masterlist-notice error">
                {gamesError}
                <p>
                  Check that <code>public.game_masterlist</code> exists and its SELECT policy allows
                  this page to read the table.
                </p>
              </div>
            )}
            <section className="masterlist-stats-hero" aria-label="Collection overview">
              <div className="masterlist-stats-hero-title">
                <span className="masterlist-kicker">01 — COLLECTION PULSE</span>
                <h2>
                  Everything
                  <br />
                  <em>you collect.</em>
                </h2>
              </div>
              <div className="masterlist-stats-total">
                <span>LIBRARY TOTAL</span>
                <strong>{(entries.length + games.length + movies.length).toLocaleString()}</strong>
                <small>records across 3 formats</small>
              </div>
              <div className="masterlist-stats-hero-key" aria-hidden="true">
                <span className="key-manga">M</span>
                <span className="key-games">G</span>
                <span className="key-movies">F</span>
              </div>
            </section>
            <section className="masterlist-stats">
              <div>
                <span>TOTAL LITERATURE</span>
                <strong>{entries.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>TOTAL GAMES</span>
                <strong>{gamesLoading ? '…' : games.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>TOTAL MOVIES</span>
                <strong>{moviesLoading ? '…' : movies.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>LITERATURE COMPLETED</span>
                <strong>{stats.completed.toLocaleString()}</strong>
              </div>
              <div>
                <span>GAMES BEATEN</span>
                <strong>{gamesLoading ? '…' : gameStats.completed.toLocaleString()}</strong>
              </div>
              <div>
                <span>MOVIES RATED</span>
                <strong>{moviesLoading ? '…' : movieStats.ratedCount.toLocaleString()}</strong>
              </div>
              <div>
                <span>READING NOW</span>
                <strong>{stats.reading.toLocaleString()}</strong>
              </div>
              <div>
                <span>PLAYED / PLAYING</span>
                <strong>{gamesLoading ? '…' : gameStats.played.toLocaleString()}</strong>
              </div>
            </section>

            <section
              className="masterlist-full-breakdown"
              aria-label="Complete collection statistics"
            >
              <div className="masterlist-breakdown-heading">
                <div>
                  <span className="masterlist-kicker">ALL FIELDS · LIVE FROM SUPABASE</span>
                  <h2>Every shelf, accounted for.</h2>
                </div>
                <p>
                  Counts and distributions use the records currently loaded from your three
                  masterlists. Missing values are not counted as zero.
                </p>
              </div>
              <div className="masterlist-breakdown-grid">
                <article className="masterlist-breakdown-card is-literature">
                  <div className="masterlist-breakdown-title">
                    <BookOpen size={19} />
                    <div>
                      <h3>Literature</h3>
                      <span>{entries.length.toLocaleString()} titles</span>
                    </div>
                  </div>
                  <div className="masterlist-breakdown-metrics">
                    <div>
                      <span>Completed</span>
                      <strong>{stats.completed}</strong>
                    </div>
                    <div>
                      <span>Reading</span>
                      <strong>{stats.reading}</strong>
                    </div>
                    <div>
                      <span>Scored</span>
                      <strong>{stats.scoreCount}</strong>
                    </div>
                    <div>
                      <span>Mean score</span>
                      <strong>{stats.scoreCount ? stats.meanScore.toFixed(2) : '—'}</strong>
                    </div>
                    <div>
                      <span>Chapters read</span>
                      <strong>{stats.chaptersRead.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>Volumes read</span>
                      <strong>{stats.volumesRead.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>Planned chapters</span>
                      <strong>{stats.plannedChapters.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>Metadata coverage</span>
                      <strong>
                        {stats.metadataCount}/{entries.length}
                      </strong>
                    </div>
                  </div>
                  <DistributionList
                    title="All literature statuses"
                    items={stats.status.map((item) => ({
                      ...item,
                      detail: `${item.value} titles`,
                    }))}
                  />
                  <DistributionList
                    title="Personal score distribution"
                    items={stats.scoreDistribution.map((item) => ({
                      label: `Score ${item.label}`,
                      value: item.value,
                      detail: `${item.value} titles`,
                    }))}
                  />
                  <DistributionList
                    title="Literature formats"
                    items={stats.formats.map((item) => ({
                      ...item,
                      detail: `${item.value} titles`,
                    }))}
                  />
                  <DistributionList
                    title="Top literature genres"
                    items={stats.genres.map((item) => ({
                      ...item,
                      detail: `${item.value} titles`,
                    }))}
                  />
                </article>
                <article className="masterlist-breakdown-card is-games">
                  <div className="masterlist-breakdown-title">
                    <Gamepad2 size={19} />
                    <div>
                      <h3>Games</h3>
                      <span>
                        {gamesLoading ? 'Loading…' : `${games.length.toLocaleString()} games`}
                      </span>
                    </div>
                  </div>
                  <div className="masterlist-breakdown-metrics">
                    <div>
                      <span>Played / playing</span>
                      <strong>{gameStats.played}</strong>
                    </div>
                    <div>
                      <span>Owned</span>
                      <strong>{gameStats.owned}</strong>
                    </div>
                    <div>
                      <span>Completed</span>
                      <strong>{gameStats.completed}</strong>
                    </div>
                    <div>
                      <span>Scored</span>
                      <strong>{gameStats.ratedCount}</strong>
                    </div>
                    <div>
                      <span>Mean score</span>
                      <strong>{gameStats.ratedCount ? gameStats.meanScore.toFixed(2) : '—'}</strong>
                    </div>
                    <div>
                      <span>Platforms</span>
                      <strong>{gameStats.platforms.length}</strong>
                    </div>
                    <div>
                      <span>Countries</span>
                      <strong>{gameStats.countries.length}</strong>
                    </div>
                    <div>
                      <span>Release years</span>
                      <strong>{gameStats.releaseYears.length}</strong>
                    </div>
                  </div>
                  <DistributionList
                    title="All game statuses"
                    items={gameStats.status.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Completion profile"
                    items={gameStats.completion.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Ownership"
                    items={gameStats.ownership.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Platforms"
                    items={gameStats.platforms.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Score distribution"
                    items={gameStats.scoreDistribution.map((item) => ({
                      label: `Score ${item.label}`,
                      value: item.value,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Game formats"
                    items={gameStats.formats.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Countries of origin"
                    items={gameStats.countries.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Release year"
                    items={gameStats.releaseYears
                      .slice(-12)
                      .map((item) => ({ ...item, detail: `${item.value} games` }))}
                  />
                </article>
                <article className="masterlist-breakdown-card is-movies">
                  <div className="masterlist-breakdown-title">
                    <Film size={19} />
                    <div>
                      <h3>Movies</h3>
                      <span>
                        {moviesLoading ? 'Loading…' : `${movies.length.toLocaleString()} films`}
                      </span>
                    </div>
                  </div>
                  <div className="masterlist-breakdown-metrics">
                    <div>
                      <span>Rated</span>
                      <strong>{movieStats.ratedCount}</strong>
                    </div>
                    <div>
                      <span>Mean score</span>
                      <strong>
                        {movieStats.ratedCount ? movieStats.meanScore.toFixed(2) : '—'}
                      </strong>
                    </div>
                    <div>
                      <span>Posters</span>
                      <strong>
                        {movieStats.posterCount}/{movies.length}
                      </strong>
                    </div>
                    <div>
                      <span>Countries</span>
                      <strong>{movieStats.countries.length}</strong>
                    </div>
                    <div>
                      <span>Genres</span>
                      <strong>{movieStats.genres.length}</strong>
                    </div>
                    <div>
                      <span>Formats</span>
                      <strong>{movieStats.formats.length}</strong>
                    </div>
                    <div>
                      <span>Release years</span>
                      <strong>{movieStats.releaseYears.length}</strong>
                    </div>
                    <div>
                      <span>Unrated</span>
                      <strong>{movies.length - movieStats.ratedCount}</strong>
                    </div>
                  </div>
                  <DistributionList
                    title="All watchlist statuses"
                    items={movieStats.statuses.map((item) => ({
                      ...item,
                      detail: `${item.value} movies`,
                    }))}
                  />
                  <DistributionList
                    title="Rating distribution"
                    items={movieStats.scoreDistribution.map((item) => ({
                      label: `Score ${item.label}`,
                      value: item.value,
                      detail: `${item.value} movies`,
                    }))}
                  />
                  <DistributionList
                    title="Top movie genres"
                    items={movieStats.genres
                      .slice(0, 10)
                      .map((item) => ({ ...item, detail: `${item.value} movies` }))}
                  />
                  <DistributionList
                    title="Countries of origin"
                    items={movieStats.countries.map((item) => ({
                      ...item,
                      detail: `${item.value} movies`,
                    }))}
                  />
                  <DistributionList
                    title="Movie formats"
                    items={movieStats.formats.map((item) => ({
                      ...item,
                      detail: `${item.value} movies`,
                    }))}
                  />
                  <DistributionList
                    title="Release year"
                    items={movieStats.releaseYears
                      .slice(-12)
                      .map((item) => ({ ...item, detail: `${item.value} movies` }))}
                  />
                </article>
              </div>
            </section>

            <section className="manga-analytics">
              <div className="manga-analytics-header">
                <div>
                  <span className="masterlist-kicker">01 — COLLECTION INTELLIGENCE</span>
                  <h2>Your library, in focus.</h2>
                </div>
                <div className={`manga-sync-status ${syncing ? 'is-syncing' : ''}`}>
                  <span className="manga-sync-dot" />
                  <div>
                    <strong>{syncing ? 'AUTO-SYNC IN PROGRESS' : 'ANILIST METADATA'}</strong>
                    <small>{syncMessage}</small>
                    {syncing && (
                      <div className="manga-sync-track">
                        <span
                          style={{
                            width: `${syncProgress.total ? (syncProgress.done / syncProgress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    title="Retry metadata sync"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>
              <div className="masterlist-insight-strip">
                <article className="masterlist-insight-feature">
                  <div className="masterlist-insight-icon">
                    <Sparkles size={18} />
                  </div>
                  <span className="masterlist-insight-label">YOUR MULTIVERSE</span>
                  <strong>
                    {(entries.length + games.length + movies.length).toLocaleString()}
                    <small> entries</small>
                  </strong>
                  <p>One personal archive across stories, games, and cinema.</p>
                  <div className="masterlist-insight-stack" aria-label="Collection proportions">
                    <span
                      className="lit"
                      style={{
                        width: `${(entries.length / Math.max(1, entries.length + games.length + movies.length)) * 100}%`,
                      }}
                    />
                    <span
                      className="games"
                      style={{
                        width: `${(games.length / Math.max(1, entries.length + games.length + movies.length)) * 100}%`,
                      }}
                    />
                    <span
                      className="movies"
                      style={{
                        width: `${(movies.length / Math.max(1, entries.length + games.length + movies.length)) * 100}%`,
                      }}
                    />
                  </div>
                </article>
                <article className="masterlist-insight-mini">
                  <div>
                    <Trophy size={17} />
                    <span>FINISHED STORIES</span>
                  </div>
                  <strong>{stats.completed.toLocaleString()}</strong>
                  <p>
                    {entries.length
                      ? `${Math.round((stats.completed / entries.length) * 100)}% of your literature shelf completed`
                      : 'Your reading milestones will show here.'}
                  </p>
                </article>
                <article className="masterlist-insight-mini">
                  <div>
                    <Gamepad2 size={17} />
                    <span>GAMES CONQUERED</span>
                  </div>
                  <strong>{gameStats.completed.toLocaleString()}</strong>
                  <p>
                    {games.length
                      ? `${Math.round((gameStats.completed / games.length) * 100)}% completion rate across your catalogue`
                      : 'Your game wins will show here.'}
                  </p>
                </article>
                <article className="masterlist-insight-mini">
                  <div>
                    <Film size={17} />
                    <span>POSTER WALL</span>
                  </div>
                  <strong>
                    {movieStats.posterCount.toLocaleString()}
                    <small> / {movies.length.toLocaleString()}</small>
                  </strong>
                  <p>
                    {movies.length
                      ? `${Math.round((movieStats.posterCount / movies.length) * 100)}% of movies have artwork`
                      : 'Movie artwork coverage will show here.'}
                  </p>
                </article>
              </div>
              <div className="masterlist-personality-panel">
                <div className="masterlist-personality-heading">
                  <div>
                    <span className="masterlist-kicker">THE FUN PART</span>
                    <h3>Your collection signals</h3>
                  </div>
                  <Compass size={21} />
                </div>
                <div className="masterlist-personality-grid">
                  <div>
                    <span>TOP LITERATURE GENRE</span>
                    <strong>{stats.genres[0]?.label ?? 'Still discovering'}</strong>
                    <small>
                      {stats.genres[0]
                        ? `${stats.genres[0].value} titles tagged`
                        : 'Sync metadata or add tags to reveal your taste.'}
                    </small>
                  </div>
                  <div>
                    <span>FAVOURITE GAME PLATFORM</span>
                    <strong>{gameStats.platforms[0]?.label ?? 'Not enough data yet'}</strong>
                    <small>
                      {gameStats.platforms[0]
                        ? `${gameStats.platforms[0].value} games in your catalogue`
                        : 'Add platform details to uncover your gaming home.'}
                    </small>
                  </div>
                  <div>
                    <span>HIGHEST-RATED MEDIUM</span>
                    <strong>
                      {(() => {
                        const means = [
                          { label: 'Literature', value: stats.meanScore, count: stats.scoreCount },
                          {
                            label: 'Games',
                            value: gameStats.meanScore,
                            count: gameStats.ratedCount,
                          },
                          {
                            label: 'Movies',
                            value: movieStats.meanScore,
                            count: movieStats.ratedCount,
                          },
                        ]
                          .filter((item) => item.count > 0)
                          .sort((a, b) => b.value - a.value);
                        return means[0]?.label ?? 'Waiting for ratings';
                      })()}
                    </strong>
                    <small>
                      {(() => {
                        const means = [
                          { label: 'Literature', value: stats.meanScore, count: stats.scoreCount },
                          {
                            label: 'Games',
                            value: gameStats.meanScore,
                            count: gameStats.ratedCount,
                          },
                          {
                            label: 'Movies',
                            value: movieStats.meanScore,
                            count: movieStats.ratedCount,
                          },
                        ]
                          .filter((item) => item.count > 0)
                          .sort((a, b) => b.value - a.value);
                        return means[0]
                          ? `Average score ${means[0].value.toFixed(2)} / 10`
                          : 'Rate a few favourites to compare your taste.';
                      })()}
                    </small>
                  </div>
                  <div>
                    <span>DISCOVERY MAP</span>
                    <strong>{combinedCountries.length} origins</strong>
                    <small>Countries represented across the three collections.</small>
                  </div>
                </div>
              </div>
              <div className="manga-analytics-grid masterlist-stats-charts">
                <section className="manga-stat-panel manga-chart-panel">
                  <div className="manga-stat-panel-heading">
                    <h3>Collection mix</h3>
                    <span>ALL MEDIA</span>
                  </div>
                  <MiniDonut
                    items={[
                      { label: 'Literature', value: entries.length },
                      { label: 'Games', value: games.length },
                      { label: 'Movies', value: movies.length },
                    ]}
                  />
                </section>
                <section className="manga-stat-panel manga-chart-panel">
                  <div className="manga-stat-panel-heading">
                    <h3>Format distribution</h3>
                    <span>ALL FORMATS</span>
                  </div>
                  <MiniDonut items={formatDistribution} />
                </section>
                <DistributionList
                  title="Top genres"
                  items={combinedGenres.map((item) => ({
                    ...item,
                    detail: `${item.value} titles`,
                  }))}
                />
                <DistributionList
                  title="Most played platforms"
                  items={gameStats.platforms.map((item) => ({
                    ...item,
                    detail: `${item.value} games`,
                  }))}
                />
                <DistributionList
                  title="Game completion profile"
                  items={gameStats.completion.map((item) => ({
                    ...item,
                    detail: `${item.value} games`,
                  }))}
                />
                <section className="manga-stat-panel manga-chart-panel">
                  <div className="manga-stat-panel-heading">
                    <h3>Country of origin</h3>
                    <span>LITERATURE + GAMES + MOVIES</span>
                  </div>
                  <MiniDonut items={combinedCountries} variant="pie" />
                </section>
                <section className="manga-stat-panel manga-chart-panel">
                  <div className="manga-stat-panel-heading">
                    <h3>Movie watchlist status</h3>
                    <span>{movies.length} MOVIES</span>
                  </div>
                  <MiniDonut items={movieStats.statuses} />
                </section>
                <DistributionList
                  title="Game format distribution"
                  items={gameStats.formats.map((item) => ({
                    ...item,
                    detail: `${item.value} games`,
                  }))}
                />
                <DistributionList
                  title="Game ownership"
                  items={gameStats.ownership.map((item) => ({
                    ...item,
                    detail: `${item.value} games`,
                  }))}
                />
                <DistributionList
                  title="Game status"
                  items={gameStats.status.map((item) => ({
                    ...item,
                    detail: `${item.value} games`,
                  }))}
                />
                <DistributionList
                  title="Score distribution"
                  items={stats.scoreDistribution.map((item) => ({
                    label: `Score ${item.label}`,
                    value: item.value,
                    detail: item.detail,
                  }))}
                />
                <DistributionList title="Chapter-length profile" items={stats.chapterBuckets} />
                <DistributionList
                  title="Release year"
                  items={stats.releaseYears
                    .slice(-10)
                    .map((item) => ({ ...item, detail: `${item.value} titles` }))}
                />
                <section className="manga-stat-panel manga-stat-summary">
                  <div className="manga-stat-panel-heading">
                    <h3>Literature snapshot</h3>
                    <TrendingUp size={17} />
                  </div>
                  <div className="manga-snapshot-row">
                    <CheckCircle2 size={17} />
                    <span>Scored titles</span>
                    <strong>{stats.scoreCount}</strong>
                  </div>
                  <div className="manga-snapshot-row">
                    <Library size={17} />
                    <span>Planned chapters remaining</span>
                    <strong>{stats.plannedChapters.toLocaleString()}</strong>
                  </div>
                  <div className="manga-snapshot-row">
                    <CalendarDays size={17} />
                    <span>Metadata available</span>
                    <strong>
                      {stats.metadataCount} / {entries.length}
                    </strong>
                  </div>
                  <div className="manga-snapshot-row">
                    <PieChart size={17} />
                    <span>Unique genres found</span>
                    <strong>{stats.genreCount || '—'}</strong>
                  </div>
                  <div className="manga-snapshot-row">
                    <TrendingUp size={17} />
                    <span>Mean personal score</span>
                    <strong>{stats.scoreCount ? stats.meanScore.toFixed(2) : '—'}</strong>
                  </div>
                  <p>
                    Genre and format charts only include titles with metadata. Scores exclude
                    unscored titles; missing fields are not treated as zero.
                  </p>
                </section>
                <section className="manga-stat-panel manga-game-teaser">
                  <div className="manga-stat-panel-heading">
                    <h3>Game shelf</h3>
                    <Gamepad2 size={17} />
                  </div>
                  <div className="manga-game-teaser-count">
                    {gamesLoading ? '…' : games.length.toLocaleString()}
                    <span>games catalogued</span>
                  </div>
                  <p>
                    {gameStats.played} played or in progress · {gameStats.owned} marked owned ·{' '}
                    {gameStats.completed} beaten / completed.
                  </p>
                  <button
                    type="button"
                    className="masterlist-inline-action"
                    onClick={() => setActiveTab('games')}
                  >
                    Explore games <ArrowUpRight size={14} />
                  </button>
                </section>
                <section className="manga-stat-panel manga-game-teaser">
                  <div className="manga-stat-panel-heading">
                    <h3>Movie shelf</h3>
                    <Film size={17} />
                  </div>
                  <div className="manga-game-teaser-count">
                    {moviesLoading ? '…' : movies.length.toLocaleString()}
                    <span>movies catalogued</span>
                  </div>
                  <p>
                    {movieStats.ratedCount} rated ·{' '}
                    {movieStats.meanScore
                      ? `mean score ${movieStats.meanScore.toFixed(1)}`
                      : 'ratings waiting to be added'}{' '}
                    · {movieStats.statuses.length} watchlist statuses.
                  </p>
                  <button
                    type="button"
                    className="masterlist-inline-action"
                    onClick={() => setActiveTab('movies')}
                  >
                    Explore movies <ArrowUpRight size={14} />
                  </button>
                </section>
              </div>
            </section>
          </>
        )}

        {activeTab === 'manga' && (
          <section className="masterlist-library masterlist-tab-content">
            <div className="masterlist-section-heading">
              <div>
                <span className="masterlist-kicker">02 — LITERATURE COLLECTION</span>
                <h2>Every story. Indexed.</h2>
              </div>
              <BookMarked size={25} />
            </div>
            <div className="masterlist-searchbar">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, tags, or notes…"
                aria-label="Search literature masterlist"
              />
              {query && (
                <button
                  className="masterlist-clear-search"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="masterlist-status-filters">
              <label htmlFor="manga-status-filter">Status</label>
              <select
                id="manga-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <label htmlFor="manga-sort">Sort</label>
              <select
                id="manga-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="title">Title A–Z</option>
                <option value="score">Score</option>
                <option value="progress">Chapters read</option>
              </select>
              <span>
                {filtered.length} {filtered.length === 1 ? 'title' : 'titles'}
              </span>
              <div className="masterlist-view-toggle" aria-label="Literature layout">
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={17} />
                </button>
              </div>
            </div>
            {error && (
              <div className="masterlist-notice error">
                {error}
                <p>
                  Check that the <code>manga_masterlist</code> table exists and the read policy
                  allows this page to select its rows.
                </p>
              </div>
            )}
            {loading ? (
              <div className="masterlist-loading">
                <LoaderCircle className="masterlist-spinner" size={22} />
                <span>Loading your literature…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="masterlist-empty-state">
                <div className="masterlist-empty-icon">
                  <BookOpen size={24} />
                </div>
                <h3>{entries.length ? 'No matching titles.' : 'Your literature list is empty.'}</h3>
                <p>
                  {entries.length
                    ? 'Try another search or status filter.'
                    : 'Add literature entries in your existing Supabase table. This page is intentionally read-only—there are no add, edit, or delete controls.'}
                </p>
              </div>
            ) : (
              <div className={`masterlist-library-grid ${viewMode === 'list' ? 'is-list' : ''}`}>
                {filtered.map((entry) => {
                  const metadata = safeMetadata(entry);
                  const totalChapters = getTotalChapters(entry);
                  const totalVolumes = getTotalVolumes(entry);
                  const readParts = [
                    entry.read_volumes != null && entry.read_volumes > 0
                      ? `${entry.read_volumes}${totalVolumes ? ` / ${totalVolumes}` : ''} vol.`
                      : null,
                    entry.read_chapters != null && entry.read_chapters > 0
                      ? `${entry.read_chapters}${totalChapters ? ` / ${totalChapters}` : ''} ch.`
                      : null,
                  ].filter(Boolean);
                  const progressPercent =
                    totalChapters && totalChapters > 0
                      ? Math.min(
                          100,
                          Math.round(((entry.read_chapters ?? 0) / totalChapters) * 100),
                        )
                      : null;
                  const cover =
                    entry.cover_url ||
                    metadata?.coverImage?.large ||
                    metadata?.coverImage?.extraLarge;
                  return (
                    <article className="masterlist-library-card" key={entry.id}>
                      <div className="masterlist-library-cover">
                        {cover ? (
                          <img
                            src={cover}
                            alt={`Cover for ${entry.title}`}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="masterlist-cover-placeholder">
                            <BookOpen size={29} />
                          </div>
                        )}
                        <span className="masterlist-card-type">
                          {metadata?.format ?? 'LITERATURE'}
                        </span>
                      </div>
                      <div className="masterlist-card-content">
                        <h3>{entry.title}</h3>
                        <div className="masterlist-card-meta">
                          {entry.status}
                          <span />
                          {entry.score != null && entry.score > 0
                            ? `Score ${entry.score}/10`
                            : 'Unscored'}
                        </div>
                        {readParts.length > 0 && (
                          <p className="masterlist-entry-progress">{readParts.join(' · ')}</p>
                        )}
                        {progressPercent !== null && (
                          <div
                            className="manga-progress-track"
                            aria-label={`${progressPercent}% of chapters read`}
                          >
                            <span style={{ width: `${progressPercent}%` }} />
                          </div>
                        )}
                        {metadata?.genres?.length ? (
                          <div className="manga-tags">
                            {metadata.genres.slice(0, 4).map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        ) : entry.tags?.length ? (
                          <div className="manga-tags">
                            {entry.tags.map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        ) : null}
                        {(entry.start_date || entry.finish_date) && (
                          <p className="masterlist-entry-notes">
                            {entry.start_date ? `Started ${entry.start_date}` : ''}
                            {entry.start_date && entry.finish_date ? ' · ' : ''}
                            {entry.finish_date ? `Finished ${entry.finish_date}` : ''}
                          </p>
                        )}
                        {entry.comments && (
                          <p className="masterlist-entry-notes">{entry.comments}</p>
                        )}
                        <MangaMetadata entry={entry} />
                        {(metadata?.siteUrl || entry.anilist_id) && (
                          <a
                            className="manga-external-link"
                            href={
                              metadata?.siteUrl || `https://anilist.co/manga/${entry.anilist_id}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on AniList <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'games' && (
          <section className="masterlist-library masterlist-tab-content">
            <div className="masterlist-section-heading">
              <div>
                <span className="masterlist-kicker">03 — GAME COLLECTION</span>
                <h2>Press start.</h2>
              </div>
              <Gamepad2 size={27} />
            </div>
            <section className="masterlist-game-metrics">
              <div>
                <span>CATALOGUED</span>
                <strong>{games.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>PLAYED / PLAYING</span>
                <strong>{gameStats.played.toLocaleString()}</strong>
              </div>
              <div>
                <span>OWNED</span>
                <strong>{gameStats.owned.toLocaleString()}</strong>
              </div>
              <div>
                <span>BEATEN / COMPLETED</span>
                <strong>{gameStats.completed.toLocaleString()}</strong>
              </div>
              <div>
                <span>MEAN SCORE</span>
                <strong>{gameStats.ratedCount ? gameStats.meanScore.toFixed(1) : '—'}</strong>
              </div>
            </section>
            <div className="masterlist-searchbar">
              <Search size={18} />
              <input
                value={gameQuery}
                onChange={(e) => setGameQuery(e.target.value)}
                placeholder="Search games, platforms, status…"
                aria-label="Search game collection"
              />
              {gameQuery && (
                <button
                  className="masterlist-clear-search"
                  onClick={() => setGameQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="masterlist-status-filters">
              <label htmlFor="game-status-filter">Status</label>
              <select
                id="game-status-filter"
                value={gameStatusFilter}
                onChange={(e) => setGameStatusFilter(e.target.value)}
              >
                <option>All</option>
                {Array.from(new Set(games.map((game) => game.status)))
                  .sort()
                  .map((status) => (
                    <option key={status}>{status}</option>
                  ))}
              </select>
              <label htmlFor="game-sort">Sort</label>
              <select
                id="game-sort"
                value={gameSortBy}
                onChange={(e) => setGameSortBy(e.target.value as typeof gameSortBy)}
              >
                <option value="title">Title A–Z</option>
                <option value="score">Score</option>
                <option value="platform">Platform</option>
              </select>
              <span>{filteredGames.length} games</span>
              <div className="masterlist-view-toggle" aria-label="Game layout">
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={17} />
                </button>
              </div>
            </div>
            {gamesError && (
              <div className="masterlist-notice error">
                {gamesError}
                <p>
                  Check that <code>public.game_masterlist</code> exists and its SELECT policy allows
                  this page to read the table.
                </p>
              </div>
            )}
            {gamesLoading ? (
              <div className="masterlist-loading">
                <LoaderCircle className="masterlist-spinner" size={22} />
                <span>Loading your games…</span>
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="masterlist-empty-state">
                <div className="masterlist-empty-icon">
                  <Gamepad2 size={24} />
                </div>
                <h3>No matching games.</h3>
                <p>Try a different search or status filter.</p>
              </div>
            ) : (
              <div className={`masterlist-game-grid ${viewMode === 'list' ? 'is-list' : ''}`}>
                {filteredGames.map((game) => (
                  <article className="masterlist-game-card" key={`${game.id}-${game.title}`}>
                    <div
                      className={`masterlist-game-card-mark ${game.coverUrl ? 'has-cover' : ''}`}
                    >
                      <Gamepad2 size={25} />
                      {game.coverUrl && (
                        <img
                          className="masterlist-game-cover"
                          src={game.coverUrl}
                          alt={`${game.title} cover art`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            event.currentTarget.parentElement?.classList.remove('has-cover');
                          }}
                        />
                      )}
                      <span>{game.releaseDate ? game.releaseDate.slice(0, 4) : '—'}</span>
                    </div>
                    <div className="masterlist-game-card-body">
                      <div className="masterlist-game-card-top">
                        <span className="masterlist-game-platform">{game.platform}</span>
                        <span className="masterlist-game-status">{game.status}</span>
                      </div>
                      <h3>{game.title}</h3>
                      <p className="masterlist-game-completion">
                        {game.completion}
                        {game.timesCompleted > 0 ? ` · completed ${game.timesCompleted}×` : ''}
                      </p>
                      <div className="masterlist-game-card-bottom">
                        <span>
                          {game.ownership} · {game.format}
                        </span>
                        {game.score != null && <strong>★ {game.score}/10</strong>}
                      </div>
                      {game.playtime && (
                        <p className="masterlist-entry-notes">Playtime: {game.playtime}</p>
                      )}
                      {game.notes && <p className="masterlist-entry-notes">{game.notes}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'movies' && (
          <section className="masterlist-library masterlist-tab-content">
            <div className="masterlist-section-heading">
              <div>
                <span className="masterlist-kicker">04 — MOVIE WATCHLIST</span>
                <h2>Tonight, or someday.</h2>
              </div>
              <Film size={27} />
            </div>
            <section className="masterlist-game-metrics">
              <div>
                <span>CATALOGUED</span>
                <strong>{movies.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>WATCHLIST STATUSES</span>
                <strong>{movieStats.statuses.length.toLocaleString()}</strong>
              </div>
              <div>
                <span>RATED</span>
                <strong>{movieStats.ratedCount.toLocaleString()}</strong>
              </div>
              <div>
                <span>MEAN SCORE</span>
                <strong>{movieStats.ratedCount ? movieStats.meanScore.toFixed(1) : '—'}</strong>
              </div>
              <div>
                <span>COUNTRIES</span>
                <strong>{movieStats.countries.length.toLocaleString()}</strong>
              </div>
            </section>
            <div className="masterlist-searchbar">
              <Search size={18} />
              <input
                value={movieQuery}
                onChange={(e) => setMovieQuery(e.target.value)}
                placeholder="Search movies, years, countries, genres…"
                aria-label="Search movie watchlist"
              />
              {movieQuery && (
                <button
                  className="masterlist-clear-search"
                  onClick={() => setMovieQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="masterlist-status-filters">
              <label htmlFor="movie-status-filter">Status</label>
              <select
                id="movie-status-filter"
                value={movieStatusFilter}
                onChange={(e) => setMovieStatusFilter(e.target.value)}
              >
                <option>All</option>
                {Array.from(new Set(movies.map((movie) => movie.status)))
                  .sort()
                  .map((status) => (
                    <option key={status}>{status}</option>
                  ))}
              </select>
              <label htmlFor="movie-sort">Sort</label>
              <select
                id="movie-sort"
                value={movieSortBy}
                onChange={(e) => setMovieSortBy(e.target.value as typeof movieSortBy)}
              >
                <option value="title">Title A–Z</option>
                <option value="year">Release year</option>
                <option value="rating">Rating</option>
              </select>
              <span>{filteredMovies.length} movies</span>
              <div className="masterlist-view-toggle" aria-label="Movie layout">
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={17} />
                </button>
              </div>
            </div>
            {moviesError && (
              <div className="masterlist-notice error">
                {moviesError}
                <p>
                  Run <code>supabase/movie_masterlist.sql</code> in Supabase SQL Editor, then import
                  your movie list.
                </p>
              </div>
            )}
            {moviesLoading ? (
              <div className="masterlist-loading">
                <LoaderCircle className="masterlist-spinner" size={22} />
                <span>Loading your movies…</span>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="masterlist-empty-state">
                <div className="masterlist-empty-icon">
                  <Film size={24} />
                </div>
                <h3>{movies.length ? 'No matching movies.' : 'Your movie watchlist is empty.'}</h3>
                <p>
                  {movies.length
                    ? 'Try another search or status filter.'
                    : 'Your uploaded watchlist.csv currently contains only the Letterboxd header row. Export your watchlist with entries, then import those rows into Supabase public.movie_masterlist.'}
                </p>
              </div>
            ) : (
              <div
                className={`masterlist-game-grid masterlist-movie-grid ${viewMode === 'list' ? 'is-list' : ''}`}
              >
                {filteredMovies.map((movie) => (
                  <article className="masterlist-game-card masterlist-movie-card" key={movie.id}>
                    <div
                      className={`masterlist-game-card-mark ${movie.posterUrl ? 'has-cover' : ''}`}
                    >
                      <Film size={25} />
                      {movie.posterUrl && (
                        <img
                          className="masterlist-game-cover"
                          src={movie.posterUrl}
                          alt={`${movie.title} poster`}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            event.currentTarget.parentElement?.classList.remove('has-cover');
                          }}
                        />
                      )}
                      <span>{movie.year ?? '—'}</span>
                    </div>
                    <div className="masterlist-game-card-body">
                      <div className="masterlist-game-card-top">
                        <span className="masterlist-game-platform">
                          {movie.country || 'Country unknown'}
                        </span>
                        <span className="masterlist-game-status">{movie.status}</span>
                      </div>
                      <h3>{movie.title}</h3>
                      <p className="masterlist-game-completion">
                        {movie.genres.length ? movie.genres.join(' · ') : 'Genre not specified'}
                      </p>
                      <div className="masterlist-game-card-bottom">
                        <span>
                          {movie.format || 'Film'}
                          {movie.watchlistDate ? ` · Added ${movie.watchlistDate}` : ''}
                        </span>
                        {movie.rating != null && <strong>★ {movie.rating}/10</strong>}
                      </div>
                      {movie.notes && <p className="masterlist-entry-notes">{movie.notes}</p>}
                      {movie.letterboxdUri && (
                        <a
                          className="manga-external-link"
                          href={movie.letterboxdUri}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open on Letterboxd <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="masterlist-footer">
          <span>PORTFOLIOKO / MASTERLIST</span>
          <span>
            <BookOpen size={13} /> LITERATURE <i /> <Gamepad2 size={13} /> GAMES <i />{' '}
            <Film size={13} /> MOVIES — SUPABASE
          </span>
        </footer>
      </div>
    </main>
  );
};

export default MasterlistContent;
