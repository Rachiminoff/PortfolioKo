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
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './MasterlistPage.scss';
import './MasterlistStats.scss';

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
  created_at?: string | null;
};

type MovieEntry = {
  id: string;
  title: string;
  year: number | null;
  watchlistDate: string | null;
  letterboxdUri: string | null;
  posterUrl: string | null;
  country: string | null;
  createdAt?: string | null;
  watchedDate: string | null;
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
  addedDate?: string;
  score: number | null;
  tags: string[];
  genres: string[];
  gameType: string;
  digitalService: string;
  subscription: string;
  acquisitionSource: string;
  acquisitionDate: string;
  playtimeHours: number | null;
  amountPaid: number | null;
  additionalCost: number | null;
  manualProgress: number | null;
  lentOut: boolean;
  borrowedFrom: string;
  region: string;
  subRatings: {
    gameplay: number | null;
    sound: number | null;
    story: number | null;
    visual: number | null;
    accessibility: number | null;
  };
};

const METADATA_BATCH_SIZE = 8;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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

type CountItem = { label: string; value: number; detail?: string };
type Tile = { label: string; value: string; sub?: string };

const COUNTRY_NAMES: Record<string, string> = {
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  US: 'United States',
  USA: 'United States',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  IT: 'Italy',
  ES: 'Spain',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
  PH: 'Philippines',
  TH: 'Thailand',
  RU: 'Russia',
  SE: 'Sweden',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  BR: 'Brazil',
  MX: 'Mexico',
};

function normalizeCountry(raw: string | null | undefined) {
  const value = raw?.trim();
  if (!value) return '';
  return COUNTRY_NAMES[value.toUpperCase()] ?? value;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const byLabel = (a: CountItem, b: CountItem) =>
  a.label.localeCompare(b.label, undefined, { numeric: true });

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function yearOf(date: string | null | undefined): string {
  const match = /^(\d{4})/.exec(date ?? '');
  return match ? match[1] : '';
}

function decadeOf(year: string | number | null | undefined): string {
  const value = Number(year);
  return Number.isFinite(value) && value >= 1800 ? `${Math.floor(value / 10) * 10}s` : '';
}

function daysBetween(from: string | null | undefined, to: string | null | undefined) {
  if (!from || !to) return null;
  const a = Date.parse(from.slice(0, 10));
  const b = Date.parse(to.slice(0, 10));
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000);
}

const fmt = (value: number | null | undefined, digits = 1) =>
  value == null || !Number.isFinite(value) ? '—' : value.toFixed(digits);
const fmtInt = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? '—' : Math.round(value).toLocaleString();
const fmtMoney = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? '—'
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtDays = (days: number | null | undefined) => {
  if (days == null) return '—';
  if (days < 60) return `${days} d`;
  if (days < 730) return `${(days / 30.44).toFixed(1)} mo`;
  return `${(days / 365.25).toFixed(1)} yr`;
};
const pctOf = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** Mean score per group (needs at least `minCount` rated items), best first. */
function meanByGroup(
  rows: { groups: string[]; score: number }[],
  minCount = 2,
  limit = 8,
): CountItem[] {
  const map = new Map<string, number[]>();
  rows.forEach(({ groups, score }) => {
    new Set(groups.map((group) => group.trim()).filter(Boolean)).forEach((group) =>
      map.set(group, [...(map.get(group) ?? []), score]),
    );
  });
  return Array.from(map.entries())
    .filter(([, scores]) => scores.length >= minCount)
    .map(([label, scores]) => {
      const average = mean(scores) ?? 0;
      return {
        label,
        value: average,
        detail: `${average.toFixed(2)} · ${scores.length} rated`,
      };
    })
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function StatTiles({ title, kicker, tiles }: { title: string; kicker?: string; tiles: Tile[] }) {
  return (
    <section className="manga-stat-panel ml-wide ml-tiles-panel">
      <div className="manga-stat-panel-heading">
        <h3>{title}</h3>
        {kicker && <span>{kicker}</span>}
      </div>
      <div className="ml-tiles">
        {tiles.map((tile) => (
          <div className="ml-tile" key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.value}</strong>
            {tile.sub && <small>{tile.sub}</small>}
          </div>
        ))}
      </div>
    </section>
  );
}

function RankedList({
  title,
  kicker,
  items,
  empty = 'Nothing to rank yet.',
}: {
  title: string;
  kicker?: string;
  items: { label: string; value: string; detail?: string }[];
  empty?: string;
}) {
  return (
    <section className="manga-stat-panel">
      <div className="manga-stat-panel-heading">
        <h3>{title}</h3>
        {kicker && <span>{kicker}</span>}
      </div>
      {items.length === 0 ? (
        <p className="manga-stat-empty">{empty}</p>
      ) : (
        <ol className="ml-ranked">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              <i>{String(index + 1).padStart(2, '0')}</i>
              <span>
                {item.label}
                {item.detail && <small>{item.detail}</small>}
              </span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DistributionList({
  title,
  items,
  scaleMax,
  caption,
  empty = 'Metadata will appear here as AniList syncs.',
}: {
  title: string;
  items: CountItem[];
  /** Fix the bar scale (e.g. 10 for ratings) instead of scaling to the largest row. */
  scaleMax?: number;
  /** Replaces the “N total” caption, which is meaningless for averages. */
  caption?: string;
  empty?: string;
}) {
  const max = scaleMax ?? Math.max(1, ...items.map((item) => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="manga-stat-panel">
      <div className="manga-stat-panel-heading">
        <h3>{title}</h3>
        <span>{caption ?? `${total.toLocaleString()} total`}</span>
      </div>
      {items.length === 0 ? (
        <p className="manga-stat-empty">{empty}</p>
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

function BarTrendChart({
  items,
  ariaLabel = 'Combined release counts by year',
  unit = 'entries',
  empty = 'Release-year data will appear as metadata becomes available.',
}: {
  items: { label: string; value: number }[];
  ariaLabel?: string;
  unit?: string;
  empty?: string;
}) {
  const data = items.filter((item) => /^\d{4}$/.test(item.label)).slice(-14);
  const max = Math.max(1, ...data.map((item) => item.value));
  if (!data.length) return <p className="manga-stat-empty">{empty}</p>;
  return (
    <div className="ml-trend-chart" role="img" aria-label={ariaLabel}>
      <div className="ml-trend-bars">
        {data.map((item) => (
          <div
            className="ml-trend-column"
            key={item.label}
            title={`${item.label}: ${item.value} ${unit}`}
          >
            <strong>{item.value}</strong>
            <span style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }} />
            <small>{item.label.slice(2)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionGrowthChart({ items }: { items: { date: string; kind: string }[] }) {
  const colors: Record<string, string> = {
    Literature: '#f4c430',
    Games: '#e53935',
    Movies: '#2457d6',
  };
  const dated = items
    .map((item) => ({ ...item, month: item.date.slice(0, 7) }))
    .filter((item) => /^\d{4}-\d{2}$/.test(item.month));
  if (!dated.length)
    return <p className="manga-stat-empty">Collection-date data is not available yet.</p>;
  const months = Array.from(new Set(dated.map((item) => item.month)))
    .sort()
    .slice(-18);
  const series = Object.keys(colors).map((kind) => {
    let cumulative = 0;
    return {
      kind,
      points: months.map((month) => {
        cumulative += dated.filter((item) => item.kind === kind && item.month === month).length;
        return cumulative;
      }),
    };
  });
  const max = Math.max(1, ...series.flatMap((line) => line.points));
  const x = (i: number) => (months.length < 2 ? 260 : 28 + (i / (months.length - 1)) * 464);
  const y = (value: number) => 150 - (value / max) * 122;
  return (
    <div className="ml-line-wrap">
      <svg
        className="ml-line-chart"
        viewBox="0 0 520 180"
        role="img"
        aria-label="Cumulative collection additions over time"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1="28"
            x2="492"
            y1={150 - fraction * 122}
            y2={150 - fraction * 122}
            stroke="#34363b"
            strokeWidth="1"
          />
        ))}
        {series.map((line) => (
          <polyline
            key={line.kind}
            points={line.points.map((value, i) => `${x(i)},${y(value)}`).join(' ')}
            fill="none"
            stroke={colors[line.kind]}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {months
          .filter((_, i) => i === 0 || i === months.length - 1 || i % 4 === 0)
          .map((month) => (
            <text
              key={month}
              x={x(months.indexOf(month))}
              y="171"
              textAnchor="middle"
              fill="#a7a7a7"
              fontSize="10"
            >
              {month.slice(2)}
            </text>
          ))}
      </svg>
      <div className="ml-scatter-legend">
        {series.map((line) => (
          <span key={line.kind}>
            <i style={{ background: colors[line.kind] }} />
            {line.kind}
          </span>
        ))}
      </div>
    </div>
  );
}

function RatingScatter({
  points,
}: {
  points: { label: string; value: number; kind: string; year: number | null }[];
}) {
  const valid = points.filter(
    (point) =>
      Number.isFinite(point.value) &&
      point.value >= 0 &&
      point.value <= 10 &&
      point.year != null &&
      point.year >= 1800 &&
      point.year <= new Date().getFullYear() + 2,
  );
  const colors: Record<string, string> = {
    Literature: '#f4c430',
    Games: '#e53935',
    Movies: '#2457d6',
  };
  if (!valid.length)
    return (
      <p className="manga-stat-empty">
        Ratings and release years are both needed to plot this chart.
      </p>
    );
  const minYear = Math.floor(Math.min(...valid.map((point) => point.year as number)) / 5) * 5;
  const maxYear =
    Math.ceil(Math.max(...valid.map((point) => point.year as number)) / 5) * 5 || minYear + 5;
  const range = Math.max(5, maxYear - minYear);
  return (
    <div className="ml-scatter-wrap">
      <svg
        className="ml-scatter"
        viewBox="0 0 520 190"
        role="img"
        aria-label="Ratings by release year"
      >
        {[0, 2, 4, 6, 8, 10].map((n) => (
          <g key={n}>
            <line
              x1="36"
              x2="510"
              y1={160 - n * 13}
              y2={160 - n * 13}
              stroke="#34363b"
              strokeWidth="1"
            />
            <text x="5" y={164 - n * 13} fill="#9da3af" fontSize="10">
              {n}
            </text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const year = Math.round(minYear + range * fraction);
          const x = 36 + fraction * 474;
          return (
            <g key={fraction}>
              <line x1={x} x2={x} y1="30" y2="160" stroke="#292b30" strokeDasharray="2 4" />
              <text x={x} y="180" textAnchor="middle" fill="#9da3af" fontSize="10">
                {year}
              </text>
            </g>
          );
        })}
        {valid.slice(0, 650).map((point, index) => {
          const x = 36 + (((point.year as number) - minYear) / range) * 474;
          const y = 160 - point.value * 13;
          return (
            <circle
              key={`${point.kind}-${point.label}-${index}`}
              cx={Math.max(36, Math.min(510, x))}
              cy={y}
              r="3.2"
              fill={colors[point.kind] ?? '#f4f0e6'}
              opacity=".78"
            >
              <title>
                {point.label} · {point.kind} · {point.year} · {point.value}/10
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="ml-scatter-legend">
        {Object.entries(colors).map(([label, color]) => (
          <span key={label}>
            <i style={{ background: color }} />
            {label}
          </span>
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
  const [statsScope, setStatsScope] = useState<'overview' | 'manga' | 'games' | 'movies'>(
    'overview',
  );
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
        'id,title,anilist_id,mal_id,total_volumes,total_chapters,read_volumes,read_chapters,score,status,start_date,finish_date,tags,comments,cover_url,anilist_metadata,anilist_fetched_at,anilist_fetch_status,created_at',
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
          'igdb_id,game_name,cover_url,game_release_date,platform,game_type,status,completion,ownership,acquisition,format,digital_service,subscription,country,region,playtime,times_completed,completion_date,progress_notes,collection_notes,borrowed_from,lent_out,amount_paid,additional_cost,acquisition_date,acquisition_source,manual_progress,rating_score,rating_gameplay,rating_sound,rating_story,rating_visual,rating_accessibility,genres,tags,date_added,created_at',
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
            addedDate: record.date_added || record.created_at || '',
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
            genres: Array.isArray(record.genres)
              ? record.genres.map((genre: string) => String(genre).trim()).filter(Boolean)
              : [],
            gameType: record.game_type || '',
            digitalService: record.digital_service || '',
            subscription: record.subscription || '',
            acquisitionSource: record.acquisition_source || '',
            acquisitionDate: record.acquisition_date || '',
            playtimeHours: toNumber(record.playtime),
            amountPaid: toNumber(record.amount_paid),
            additionalCost: toNumber(record.additional_cost),
            manualProgress: toNumber(record.manual_progress),
            lentOut: /^(yes|true|y)$/i.test(String(record.lent_out ?? '').trim()),
            borrowedFrom: record.borrowed_from || '',
            region: record.region || '',
            subRatings: {
              gameplay: toNumber(record.rating_gameplay),
              sound: toNumber(record.rating_sound),
              story: toNumber(record.rating_story),
              visual: toNumber(record.rating_visual),
              accessibility: toNumber(record.rating_accessibility),
            },
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
          'id,title,release_year,watchlist_date,watched_date,letterboxd_uri,poster_url,country,genres,status,rating,notes,format,created_at',
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
            watchedDate: record.watched_date || null,
            createdAt: record.created_at || null,
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
          let saved: Array<Record<string, any>> = [];
          let lastError: Error | null = null;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              // The server fetches AniList and writes the cache; the browser cannot write it.
              const response = await fetch('/api/masterlist/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: batch.map((entry) => entry.id) }),
              });
              if (!response.ok) throw new Error(`Metadata sync returned HTTP ${response.status}.`);
              saved = (await response.json()).data ?? [];
              lastError = null;
              break;
            } catch (error) {
              lastError = error instanceof Error ? error : new Error('Metadata sync failed.');
              if (attempt < 2) await wait(2200 * (attempt + 1));
            }
          }
          if (lastError) throw lastError;
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
        if (start + METADATA_BATCH_SIZE < needsMetadata.length) await wait(2100);
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
    const countries = countBy(
      metadataEntries.map(({ metadata }) => normalizeCountry(metadata?.countryOfOrigin)),
    );
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
    const scoredEntries = entries.filter((entry) => (entry.score ?? 0) > 0);
    const finishDurations = entries
      .map((entry) => daysBetween(entry.start_date, entry.finish_date))
      .filter((days): days is number => days != null);
    const communityPairs = scoredEntries
      .map((entry) => ({
        mine: entry.score as number,
        community: safeMetadata(entry)?.averageScore ?? null,
      }))
      .filter((pair) => pair.community != null && pair.community > 0)
      .map((pair) => ({ mine: pair.mine, community: (pair.community as number) / 10 }));
    const tasteGap = communityPairs.length
      ? (mean(communityPairs.map((pair) => pair.mine)) ?? 0) -
        (mean(communityPairs.map((pair) => pair.community)) ?? 0)
      : null;
    const genreScores = meanByGroup(
      scoredEntries.map((entry) => {
        const metadata = safeMetadata(entry);
        return {
          groups: metadata?.genres?.length ? metadata.genres : (entry.tags ?? []),
          score: entry.score as number,
        };
      }),
    );
    const progressEntries = entries.filter((entry) => entry.status === 'Reading');
    const currentlyReading = progressEntries
      .map((entry) => ({ entry, total: getTotalChapters(entry) }))
      .sort(
        (a, b) =>
          (b.entry.read_chapters ?? 0) - (a.entry.read_chapters ?? 0) ||
          a.entry.title.localeCompare(b.entry.title),
      )
      .slice(0, 6)
      .map(({ entry, total }) => ({
        label: entry.title,
        value: total
          ? `${pctOf(entry.read_chapters ?? 0, total)}%`
          : `${entry.read_chapters ?? 0} ch`,
        detail: `${entry.read_chapters ?? 0} / ${total ?? '?'} chapters`,
      }));
    const topRated = [...scoredEntries]
      .sort(
        (a, b) =>
          (b.score ?? 0) - (a.score ?? 0) ||
          (b.read_chapters ?? 0) - (a.read_chapters ?? 0) ||
          a.title.localeCompare(b.title),
      )
      .slice(0, 6)
      .map((entry) => ({
        label: entry.title,
        value: `${entry.score}/10`,
        detail: `${entry.status} · ${entry.read_chapters ?? 0} ch`,
      }));
    const mostRead = [...entries]
      .filter((entry) => (entry.read_chapters ?? 0) > 0)
      .sort((a, b) => (b.read_chapters ?? 0) - (a.read_chapters ?? 0))
      .slice(0, 6)
      .map((entry) => ({
        label: entry.title,
        value: `${(entry.read_chapters ?? 0).toLocaleString()} ch`,
        detail: `${entry.read_volumes ?? 0} vol · ${entry.status}`,
      }));
    const completedEntries = entries.filter((entry) => entry.status === 'Completed');
    return {
      topRated,
      mostRead,
      currentlyReading,
      genreScores,
      tasteGap,
      communityCount: communityPairs.length,
      medianDaysToFinish: median(finishDurations),
      finishedTracked: finishDurations.length,
      volumesOwnedTotal: entries.reduce((sum, entry) => sum + (getTotalVolumes(entry) ?? 0), 0),
      avgChaptersCompleted: mean(completedEntries.map((entry) => entry.read_chapters ?? 0)),
      commentCount: entries.filter((entry) => entry.comments?.trim()).length,
      droppedCount: entries.filter((entry) => entry.status === 'Dropped').length,
      onHoldCount: entries.filter((entry) => entry.status === 'On-Hold').length,
      plannedCount: entries.filter((entry) => entry.status === 'Plan to Read').length,
      startedYears: countBy(entries.map((entry) => yearOf(entry.start_date))).sort(byLabel),
      finishedYears: countBy(entries.map((entry) => yearOf(entry.finish_date))).sort(byLabel),
      decades: countBy(
        metadataEntries.map(({ metadata }) => decadeOf(metadata?.startDate?.year)),
      ).sort(byLabel),
      publication: countBy(
        metadataEntries.map(({ metadata }) => metadata?.status?.replace(/_/g, ' ')),
      ),
      scoreStdDev: scores.length ? standardDeviation : null,
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
    const hours = games
      .map((game) => game.playtimeHours)
      .filter((value): value is number => value != null && value > 0);
    const totalHours = hours.reduce((sum, value) => sum + value, 0);
    const spendRows = games.filter((game) => (game.amountPaid ?? 0) > 0);
    const totalSpent = games.reduce(
      (sum, game) => sum + (game.amountPaid ?? 0) + (game.additionalCost ?? 0),
      0,
    );
    const subKeys = [
      ['Gameplay', 'gameplay'],
      ['Story', 'story'],
      ['Visuals', 'visual'],
      ['Sound', 'sound'],
      ['Accessibility', 'accessibility'],
    ] as const;
    const subRatings = [
      { label: 'Overall', values: rated.map((game) => game.score as number) },
      ...subKeys.map(([label, key]) => ({
        label,
        values: games
          .map((game) => game.subRatings[key])
          .filter((value): value is number => value != null),
      })),
    ]
      .filter((row) => row.values.length)
      .map((row) => {
        const average = mean(row.values) ?? 0;
        return {
          label: row.label,
          value: average,
          detail: `${average.toFixed(2)} · ${row.values.length} rated`,
        };
      });
    const hoursByPlatform = new Map<string, number>();
    games.forEach((game) => {
      if ((game.playtimeHours ?? 0) > 0)
        hoursByPlatform.set(
          game.platform,
          (hoursByPlatform.get(game.platform) ?? 0) + (game.playtimeHours ?? 0),
        );
    });
    const playtimeBuckets = [
      { label: 'Under 1 h', min: 0, max: 1 },
      { label: '1–5 h', min: 1, max: 5 },
      { label: '5–20 h', min: 5, max: 20 },
      { label: '20–50 h', min: 20, max: 50 },
      { label: '50–100 h', min: 50, max: 100 },
      { label: '100 h+', min: 100, max: Infinity },
    ].map((bucket) => ({
      label: bucket.label,
      value: hours.filter((value) => value >= bucket.min && value < bucket.max).length,
    }));
    const genreValues = games.map((game) => (game.genres.length ? game.genres : game.tags));
    const genreCounts = new Map<string, number>();
    genreValues.forEach((list) =>
      new Set(list).forEach((genre) => genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)),
    );
    const isUnplayed = (game: GameEntry) =>
      /unplayed/.test(normalized(game.status)) || /not started/.test(normalized(game.completion));
    const gameExtras = {
      totalHours,
      avgHours: mean(hours),
      medianHours: median(hours),
      playtimeTracked: hours.length,
      longestGames: [...games]
        .filter((game) => (game.playtimeHours ?? 0) > 0)
        .sort((a, b) => (b.playtimeHours ?? 0) - (a.playtimeHours ?? 0))
        .slice(0, 6)
        .map((game) => ({
          label: game.title,
          value: `${Math.round(game.playtimeHours ?? 0).toLocaleString()} h`,
          detail: `${game.platform} · ${game.completion}`,
        })),
      topRated: [...rated]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.title.localeCompare(b.title))
        .slice(0, 6)
        .map((game) => ({
          label: game.title,
          value: `${game.score}/10`,
          detail: `${game.platform}${game.playtimeHours ? ` · ${Math.round(game.playtimeHours)} h` : ''}`,
        })),
      hoursByPlatform: Array.from(hoursByPlatform.entries())
        .map(([label, value]) => ({
          label,
          value,
          detail: `${Math.round(value).toLocaleString()} h`,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      playtimeBuckets,
      subRatings,
      genres: Array.from(genreCounts.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
        .slice(0, 10),
      genreCount: genreCounts.size,
      genreScores: meanByGroup(
        rated.map((game) => ({
          groups: game.genres.length ? game.genres : game.tags,
          score: game.score as number,
        })),
      ),
      decades: countBy(games.map((game) => decadeOf(yearOf(game.releaseDate)))).sort(byLabel),
      storefronts: countBy(games.map((game) => game.digitalService)),
      gameTypes: countBy(games.map((game) => game.gameType)),
      subscriptions: countBy(games.map((game) => game.subscription)),
      sources: countBy(games.map((game) => game.acquisitionSource)),
      addedYears: countBy(
        games.map((game) => yearOf(game.acquisitionDate) || yearOf(game.addedDate)),
      ).sort(byLabel),
      completedYears: countBy(games.map((game) => yearOf(game.completionDate))).sort(byLabel),
      timesCompletedTotal: games.reduce((sum, game) => sum + game.timesCompleted, 0),
      backlog: games.filter((game) => isUnplayed(game) && normalized(game.ownership) === 'owned')
        .length,
      unplayed: games.filter(isUnplayed).length,
      dropped: games.filter((game) => /dropped/.test(normalized(game.completion))).length,
      unfinished: games.filter((game) => /unfinished/.test(normalized(game.completion))).length,
      continuous: games.filter((game) => /continuous/.test(normalized(game.completion))).length,
      lentOut: games.filter((game) => game.lentOut).length,
      borrowed: games.filter((game) => game.borrowedFrom).length,
      totalSpent,
      paidCount: spendRows.length,
      avgPaid: mean(spendRows.map((game) => game.amountPaid ?? 0)),
      costPerHour: totalSpent > 0 && totalHours > 0 ? totalSpent / totalHours : null,
      avgManualProgress: mean(
        games.map((game) => game.manualProgress).filter((value): value is number => value != null),
      ),
      completionRate: pctOf(
        games.filter(isCompleted).length,
        games.filter((game) => !isUnplayed(game)).length,
      ),
    };
    return {
      played: games.filter(isPlayed).length,
      owned: games.filter((game) => normalized(game.ownership) === 'owned').length,
      completed: games.filter(isCompleted).length,
      ratedCount: rated.length,
      meanScore: rated.length
        ? rated.reduce((sum, game) => sum + (game.score ?? 0), 0) / rated.length
        : 0,
      ...gameExtras,
      platforms: countBy(games.map((game) => game.platform)).slice(0, 8),
      completion: countBy(games.map((game) => game.completion)),
      formats: countBy(games.map((game) => game.format)),
      ownership: countBy(games.map((game) => game.ownership)),
      status: countBy(games.map((game) => game.status)),
      countries: countBy(games.map((game) => normalizeCountry(game.country))),
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
    const isWatched = (movie: MovieEntry) =>
      Boolean(movie.watchedDate) || /watched|seen/i.test(movie.status);
    const watched = movies.filter(isWatched);
    const watchlist = movies.filter((movie) => !isWatched(movie));
    const thisYear = String(new Date().getFullYear());
    const years = movies
      .map((movie) => movie.year)
      .filter((year): year is number => year != null && year > 1800);
    const waits = watched
      .map((movie) => daysBetween(movie.watchlistDate, movie.watchedDate))
      .filter((days): days is number => days != null);
    const oldestWait = watchlist
      .map((movie) => ({ movie, days: daysBetween(movie.watchlistDate, new Date().toISOString()) }))
      .filter((row): row is { movie: MovieEntry; days: number } => row.days != null)
      .sort((a, b) => b.days - a.days)[0];
    const genreOf = (movie: MovieEntry) =>
      movie.genres.map((genre) => genre.trim()).filter(Boolean);
    const ratedRows = rated.map((movie) => ({ movie, score: movie.rating as number }));
    const movieExtras = {
      watchedCount: watched.length,
      watchlistCount: watchlist.length,
      watchedThisYear: watched.filter((movie) => yearOf(movie.watchedDate) === thisYear).length,
      watchedYears: counts(watched.map((movie) => yearOf(movie.watchedDate))).sort(byLabel),
      addedYears: counts(
        movies.map((movie) => yearOf(movie.watchlistDate || movie.createdAt)),
      ).sort(byLabel),
      decades: counts(movies.map((movie) => decadeOf(movie.year))).sort(byLabel),
      avgYear: mean(years),
      oldest: movies
        .filter((movie) => movie.year != null && movie.year > 1800)
        .sort((a, b) => (a.year as number) - (b.year as number))[0],
      newest: movies
        .filter((movie) => movie.year != null)
        .sort((a, b) => (b.year as number) - (a.year as number))[0],
      medianWait: median(waits),
      waitTracked: waits.length,
      oldestWait,
      genreScores: meanByGroup(
        ratedRows.map(({ movie, score }) => ({ groups: genreOf(movie), score })),
      ),
      countryScores: meanByGroup(
        ratedRows.map(({ movie, score }) => ({ groups: [normalizeCountry(movie.country)], score })),
        2,
        6,
      ),
      decadeScores: meanByGroup(
        ratedRows.map(({ movie, score }) => ({ groups: [decadeOf(movie.year)], score })),
        2,
        8,
      ).sort((a, b) => a.label.localeCompare(b.label)),
      topRated: [...rated]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title))
        .slice(0, 6)
        .map((movie) => ({
          label: movie.title,
          value: `${movie.rating}/10`,
          detail: [movie.year, movie.country].filter(Boolean).join(' · '),
        })),
      upNext: [...watchlist]
        .sort((a, b) => (a.watchlistDate ?? '9999').localeCompare(b.watchlistDate ?? '9999'))
        .slice(0, 6)
        .map((movie) => ({
          label: movie.title,
          value: String(movie.year ?? '—'),
          detail: movie.watchlistDate ? `added ${movie.watchlistDate}` : movie.country || undefined,
        })),
      notesCount: movies.filter((movie) => movie.notes?.trim()).length,
      linkedCount: movies.filter((movie) => movie.letterboxdUri).length,
      unknownCountry: movies.filter((movie) => !movie.country).length,
      noGenre: movies.filter((movie) => !genreOf(movie).length).length,
      genreCount: new Set(movies.flatMap(genreOf)).size,
      ratingStdDev: (() => {
        const average = mean(rated.map((movie) => movie.rating as number));
        return average == null
          ? null
          : Math.sqrt(
              mean(rated.map((movie) => Math.pow((movie.rating as number) - average, 2))) ?? 0,
            );
      })(),
    };
    return {
      ...movieExtras,
      ratedCount: rated.length,
      meanScore: rated.length
        ? rated.reduce((sum, movie) => sum + (movie.rating ?? 0), 0) / rated.length
        : 0,
      statuses: counts(movies.map((movie) => movie.status)),
      countries: counts(movies.map((movie) => normalizeCountry(movie.country) || 'Unknown')),
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
      const country = normalizeCountry(rawCountry);
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

  const combinedReleaseYears = useMemo(() => {
    const counts = new Map<string, number>();
    const add = (items: { label: string; value: number }[]) =>
      items.forEach((item) => {
        if (/^\d{4}$/.test(item.label))
          counts.set(item.label, (counts.get(item.label) ?? 0) + item.value);
      });
    add(stats.releaseYears);
    add(gameStats.releaseYears);
    add(movieStats.releaseYears);
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => Number(a.label) - Number(b.label));
  }, [stats.releaseYears, gameStats.releaseYears, movieStats.releaseYears]);

  const combinedRatings = useMemo(
    () => [
      ...entries
        .filter((entry) => entry.score != null && entry.score > 0)
        .map((entry) => ({
          label: entry.title,
          value: entry.score as number,
          kind: 'Literature',
          year: safeMetadata(entry)?.startDate?.year ?? null,
        })),
      ...games
        .filter((game) => game.score != null)
        .map((game) => ({
          label: game.title,
          value: game.score as number,
          kind: 'Games',
          year: game.releaseDate ? Number(game.releaseDate.slice(0, 4)) : null,
        })),
      ...movies
        .filter((movie) => movie.rating != null)
        .map((movie) => ({
          label: movie.title,
          value: movie.rating as number,
          kind: 'Movies',
          year: movie.year,
        })),
    ],
    [entries, games, movies],
  );

  const collectionActivity = useMemo(
    () =>
      [
        ...entries.map((entry) => ({ date: entry.created_at || '', kind: 'Literature' })),
        ...games.map((game) => ({ date: game.addedDate || '', kind: 'Games' })),
        ...movies.map((movie) => ({
          date: movie.watchlistDate || movie.createdAt || '',
          kind: 'Movies',
        })),
      ].filter((item) => Boolean(item.date)),
    [entries, games, movies],
  );

  const overview = useMemo(() => {
    const sumYears = (...lists: CountItem[][]) => {
      const map = new Map<string, number>();
      lists.flat().forEach((item) => map.set(item.label, (map.get(item.label) ?? 0) + item.value));
      return Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort(byLabel);
    };
    const finishedYears = sumYears(
      stats.finishedYears,
      gameStats.completedYears,
      movieStats.watchedYears,
    );
    const decades = sumYears(stats.decades, gameStats.decades, movieStats.decades);
    const thisYear = String(new Date().getFullYear());
    const ratingBuckets = Array.from({ length: 10 }, (_, index) => {
      const bucket = index + 1;
      const inBucket = combinedRatings.filter(
        (point) => Math.min(10, Math.max(1, Math.round(point.value))) === bucket,
      );
      return {
        label: String(bucket),
        value: inBucket.length,
        detail: `${inBucket.length} · ${['Literature', 'Games', 'Movies']
          .map(
            (kind) =>
              `${inBucket.filter((point) => point.kind === kind).length} ${kind.slice(0, 1)}`,
          )
          .join(' / ')}`,
      };
    });
    const overallMean = mean(combinedRatings.map((point) => point.value));
    const topOverall = [...combinedRatings]
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
      .slice(0, 8)
      .map((point) => ({
        label: point.label,
        value: `${point.value}/10`,
        detail: `${point.kind}${point.year ? ` · ${point.year}` : ''}`,
      }));
    const backlog = {
      literature: stats.plannedCount,
      games: gameStats.backlog,
      movies: movieStats.watchlistCount,
    };
    const finishedThisYear = finishedYears.find((item) => item.label === thisYear)?.value ?? 0;
    return {
      finishedYears,
      decades,
      ratingBuckets,
      overallMean,
      topOverall,
      backlog,
      backlogTotal: backlog.literature + backlog.games + backlog.movies,
      finishedThisYear,
      thisYear,
      ratedShare: pctOf(combinedRatings.length, entries.length + games.length + movies.length),
      mediumMeans: [
        { label: 'Literature', value: stats.meanScore, count: stats.scoreCount },
        { label: 'Games', value: gameStats.meanScore, count: gameStats.ratedCount },
        { label: 'Movies', value: movieStats.meanScore, count: movieStats.ratedCount },
      ]
        .filter((item) => item.count > 0)
        .map((item) => ({
          label: item.label,
          value: item.value,
          detail: `${item.value.toFixed(2)} · ${item.count} rated`,
        })),
    };
  }, [stats, gameStats, movieStats, combinedRatings, entries.length, games.length, movies.length]);

  const libraryTotal = entries.length + games.length + movies.length;
  const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
  const mediaCards = [
    {
      id: 'manga' as const,
      label: 'Literature',
      icon: BookOpen,
      loading: loading,
      total: entries.length,
      done: stats.completed,
      doneLabel: 'completed',
      percent: pct(stats.completed, entries.length),
      sub: `${stats.reading} reading · ${stats.scoreCount ? `avg ${stats.meanScore.toFixed(1)}` : 'no scores'}`,
    },
    {
      id: 'games' as const,
      label: 'Games',
      icon: Gamepad2,
      loading: gamesLoading,
      total: games.length,
      done: gameStats.completed,
      doneLabel: 'beaten',
      percent: pct(gameStats.completed, games.length),
      sub: `${gameStats.played} playing · ${gameStats.ratedCount ? `avg ${gameStats.meanScore.toFixed(1)}` : 'no scores'}`,
    },
    {
      id: 'movies' as const,
      label: 'Movies',
      icon: Film,
      loading: moviesLoading,
      total: movies.length,
      done: movieStats.ratedCount,
      doneLabel: 'rated',
      percent: pct(movieStats.ratedCount, movies.length),
      sub: movieStats.ratedCount ? `avg ${movieStats.meanScore.toFixed(1)}` : 'no ratings yet',
    },
  ];
  const highestMedium = [
    { label: 'Literature', value: stats.meanScore, count: stats.scoreCount },
    { label: 'Games', value: gameStats.meanScore, count: gameStats.ratedCount },
    { label: 'Movies', value: movieStats.meanScore, count: movieStats.ratedCount },
  ]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.value - a.value)[0];

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
          <div className="ml-dash">
            {gamesError && (
              <div className="masterlist-notice error">
                {gamesError}
                <p>
                  Check that <code>public.game_masterlist</code> exists and its SELECT policy allows
                  this page to read the table.
                </p>
              </div>
            )}

            <section className="ml-dash-hero" aria-label="Collection overview">
              <div className="ml-dash-hero-copy">
                <span className="masterlist-kicker">01 — COLLECTION PULSE</span>
                <h2>
                  Everything <em>you collect.</em>
                </h2>
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
                    aria-label="Retry metadata sync"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>
              <div className="ml-dash-total">
                <span>LIBRARY TOTAL</span>
                <strong>{libraryTotal.toLocaleString()}</strong>
                <div className="ml-dash-stack" aria-hidden="true">
                  <i
                    className="lit"
                    style={{ width: `${(entries.length / Math.max(1, libraryTotal)) * 100}%` }}
                  />
                  <i
                    className="games"
                    style={{ width: `${(games.length / Math.max(1, libraryTotal)) * 100}%` }}
                  />
                  <i
                    className="movies"
                    style={{ width: `${(movies.length / Math.max(1, libraryTotal)) * 100}%` }}
                  />
                </div>
                <small>
                  {combinedCountries.length} origins · {combinedGenres.length} shared genres
                </small>
              </div>
            </section>

            <section className="ml-dash-kpis" aria-label="Totals by medium">
              {mediaCards.map((card) => (
                <button
                  type="button"
                  key={card.id}
                  className={`ml-kpi ml-kpi-${card.id} ${statsScope === card.id ? 'is-active' : ''}`}
                  onClick={() => setStatsScope(card.id)}
                  aria-label={`Show ${card.label} charts`}
                >
                  <span className="ml-kpi-head">
                    <card.icon size={16} />
                    {card.label}
                  </span>
                  <strong>{card.loading ? '…' : card.total.toLocaleString()}</strong>
                  <span className="ml-kpi-bar" aria-hidden="true">
                    <i style={{ width: `${card.percent}%` }} />
                  </span>
                  <small>
                    <b>{card.loading ? '…' : card.done.toLocaleString()}</b> {card.doneLabel}
                    <em>{card.percent}%</em>
                  </small>
                  <small className="ml-kpi-sub">{card.sub}</small>
                </button>
              ))}
            </section>

            <section className="ml-dash-signals" aria-label="Collection signals">
              <div>
                <span>TOP GENRE</span>
                <strong>{stats.genres[0]?.label ?? 'Still discovering'}</strong>
                <small>
                  {stats.genres[0] ? `${stats.genres[0].value} titles` : 'Sync metadata to reveal'}
                </small>
              </div>
              <div>
                <span>HOME PLATFORM</span>
                <strong>{gameStats.platforms[0]?.label ?? '—'}</strong>
                <small>
                  {gameStats.platforms[0] ? `${gameStats.platforms[0].value} games` : 'No data yet'}
                </small>
              </div>
              <div>
                <span>HIGHEST-RATED</span>
                <strong>{highestMedium?.label ?? '—'}</strong>
                <small>
                  {highestMedium ? `Avg ${highestMedium.value.toFixed(2)} / 10` : 'No ratings yet'}
                </small>
              </div>
              <div>
                <span>DISCOVERY MAP</span>
                <strong>{combinedCountries.length} origins</strong>
                <small>across all collections</small>
              </div>
            </section>

            <div className="ml-dash-scope" role="tablist" aria-label="Chart scope">
              {(
                [
                  ['overview', 'Overview'],
                  ['manga', 'Literature'],
                  ['games', 'Games'],
                  ['movies', 'Movies'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={statsScope === id}
                  className={statsScope === id ? 'is-active' : ''}
                  onClick={() => setStatsScope(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="ml-dash-board" key={statsScope}>
              {statsScope === 'overview' && (
                <>
                  <StatTiles
                    title="At a glance"
                    kicker="ALL MEDIA"
                    tiles={[
                      {
                        label: 'Finished this year',
                        value: fmtInt(overview.finishedThisYear),
                        sub: `read, beaten or watched in ${overview.thisYear}`,
                      },
                      {
                        label: 'Backlog',
                        value: fmtInt(overview.backlogTotal),
                        sub: `${overview.backlog.literature} to read · ${overview.backlog.games} unplayed · ${overview.backlog.movies} to watch`,
                      },
                      {
                        label: 'Chapters read',
                        value: fmtInt(stats.chaptersRead),
                        sub: `${fmtInt(stats.volumesRead)} volumes`,
                      },
                      {
                        label: 'Hours played',
                        value: fmtInt(gameStats.totalHours),
                        sub: gameStats.playtimeTracked
                          ? `across ${plural(gameStats.playtimeTracked, 'game')}`
                          : 'no playtime logged',
                      },
                      {
                        label: 'Movies watched',
                        value: fmtInt(movieStats.watchedCount),
                        sub: `${movieStats.watchedThisYear} in ${overview.thisYear}`,
                      },
                      {
                        label: 'Average rating',
                        value: fmt(overview.overallMean, 2),
                        sub: `${combinedRatings.length.toLocaleString()} rated · ${overview.ratedShare}% of library`,
                      },
                      {
                        label: 'Distinct genres',
                        value: fmtInt(
                          combinedGenres.length
                            ? new Set(
                                [...stats.genres, ...gameStats.genres, ...movieStats.genres].map(
                                  (g) => g.label.toLowerCase(),
                                ),
                              ).size
                            : 0,
                        ),
                        sub: 'top-10 lists combined',
                      },
                      {
                        label: 'Origins',
                        value: fmtInt(combinedCountries.length),
                        sub: combinedCountries[0]
                          ? `most: ${combinedCountries[0].label}`
                          : undefined,
                      },
                    ]}
                  />
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Release timeline</h3>
                      <span>ALL MEDIA · RELEASE YEAR</span>
                    </div>
                    <BarTrendChart items={combinedReleaseYears} />
                  </section>
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Collection growth</h3>
                      <span>CUMULATIVE · DATED RECORDS</span>
                    </div>
                    <CollectionGrowthChart items={collectionActivity} />
                  </section>
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Rating map</h3>
                      <span>{combinedRatings.length.toLocaleString()} SCORED ITEMS</span>
                    </div>
                    <RatingScatter points={combinedRatings} />
                  </section>
                  <section className="manga-stat-panel">
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
                  <section className="manga-stat-panel">
                    <div className="manga-stat-panel-heading">
                      <h3>Country of origin</h3>
                      <span>ALL MEDIA</span>
                    </div>
                    <MiniDonut items={combinedCountries} variant="pie" />
                  </section>
                  <DistributionList
                    title="Shared genre landscape"
                    items={combinedGenres.map((item) => ({
                      ...item,
                      detail: `${item.value} items`,
                    }))}
                  />
                  <section className="manga-stat-panel">
                    <div className="manga-stat-panel-heading">
                      <h3>Format distribution</h3>
                      <span>ALL FORMATS</span>
                    </div>
                    <MiniDonut items={formatDistribution} />
                  </section>
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Finished per year</h3>
                      <span>READ · BEATEN · WATCHED</span>
                    </div>
                    <BarTrendChart
                      items={overview.finishedYears}
                      ariaLabel="Titles finished per year across all media"
                      unit="finished"
                      empty="Finish, completion and watched dates will chart here once they are filled in."
                    />
                  </section>
                  <DistributionList
                    title="Rating distribution"
                    caption="ALL MEDIA · ROUNDED"
                    items={overview.ratingBuckets}
                    empty="No ratings yet."
                  />
                  <DistributionList
                    title="Average rating by medium"
                    caption="OUT OF 10"
                    scaleMax={10}
                    items={overview.mediumMeans}
                    empty="No ratings yet."
                  />
                  <DistributionList
                    title="Backlog by medium"
                    caption="PLANNED · UNPLAYED · WATCHLIST"
                    items={[
                      { label: 'Literature', value: overview.backlog.literature },
                      { label: 'Games', value: overview.backlog.games },
                      { label: 'Movies', value: overview.backlog.movies },
                    ]}
                  />
                  <DistributionList
                    title="Decades"
                    caption="ALL MEDIA · RELEASE"
                    items={overview.decades}
                    empty="Release dates will appear here."
                  />
                  <RankedList
                    title="Top rated overall"
                    kicker="ALL MEDIA"
                    items={overview.topOverall}
                    empty="Rate something to see your favourites."
                  />
                </>
              )}

              {statsScope === 'manga' && (
                <>
                  <StatTiles
                    title="Literature at a glance"
                    kicker={`${entries.length.toLocaleString()} TITLES`}
                    tiles={[
                      {
                        label: 'Completion rate',
                        value: `${pctOf(stats.completed, entries.length)}%`,
                        sub: `${stats.completed} of ${entries.length} completed`,
                      },
                      {
                        label: 'Volumes read',
                        value: fmtInt(stats.volumesRead),
                        sub: stats.volumesOwnedTotal
                          ? `of ${fmtInt(stats.volumesOwnedTotal)} known volumes`
                          : undefined,
                      },
                      {
                        label: 'Avg length (completed)',
                        value: fmtInt(stats.avgChaptersCompleted),
                        sub: 'chapters per finished title',
                      },
                      {
                        label: 'Median time to finish',
                        value: fmtDays(stats.medianDaysToFinish),
                        sub: stats.finishedTracked
                          ? `from ${plural(stats.finishedTracked, 'dated title')}`
                          : 'needs start + finish dates',
                      },
                      {
                        label: 'Score spread',
                        value: stats.scoreStdDev == null ? '—' : `±${stats.scoreStdDev.toFixed(2)}`,
                        sub: 'standard deviation',
                      },
                      {
                        label: 'Vs AniList',
                        value:
                          stats.tasteGap == null
                            ? '—'
                            : `${stats.tasteGap >= 0 ? '+' : ''}${stats.tasteGap.toFixed(2)}`,
                        sub: stats.communityCount
                          ? `your avg minus community, ${stats.communityCount} titles`
                          : 'needs synced AniList scores',
                      },
                      {
                        label: 'Paused or dropped',
                        value: fmtInt(stats.onHoldCount + stats.droppedCount),
                        sub: `${stats.onHoldCount} on hold · ${stats.droppedCount} dropped`,
                      },
                      {
                        label: 'With comments',
                        value: fmtInt(stats.commentCount),
                        sub: `${pctOf(stats.commentCount, entries.length)}% of titles`,
                      },
                    ]}
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
                      <span>Chapters read</span>
                      <strong>{stats.chaptersRead.toLocaleString()}</strong>
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
                  <DistributionList title="Reading status" items={stats.status} />
                  <DistributionList
                    title="Top genres"
                    items={stats.genres.map((item) => ({
                      ...item,
                      detail: `${item.value} titles`,
                    }))}
                  />
                  <DistributionList title="Chapter-length profile" items={stats.chapterBuckets} />
                  <DistributionList title="Formats" items={stats.formats} />
                  <DistributionList title="Score distribution" items={stats.scoreDistribution} />
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Finished per year</h3>
                      <span>FINISH DATE</span>
                    </div>
                    <BarTrendChart
                      items={stats.finishedYears}
                      ariaLabel="Literature finished per year"
                      unit="finished"
                      empty="Add finish dates to see your reading pace."
                    />
                  </section>
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Started per year</h3>
                      <span>START DATE</span>
                    </div>
                    <BarTrendChart
                      items={stats.startedYears}
                      ariaLabel="Literature started per year"
                      unit="started"
                      empty="Add start dates to see when you picked titles up."
                    />
                  </section>
                  <DistributionList
                    title="Best-scored genres"
                    caption="MEAN SCORE · 2+ RATED"
                    scaleMax={10}
                    items={stats.genreScores}
                    empty="Rate at least two titles in a genre to rank it."
                  />
                  <DistributionList title="Decades" caption="RELEASE START" items={stats.decades} />
                  <DistributionList title="Publication status" items={stats.publication} />
                  <DistributionList title="Country of origin" items={stats.countries.slice(0, 8)} />
                  <RankedList
                    title="Top rated"
                    kicker="PERSONAL SCORE"
                    items={stats.topRated}
                    empty="Score a title to see it here."
                  />
                  <RankedList
                    title="Most chapters read"
                    kicker="BY SERIES"
                    items={stats.mostRead}
                    empty="No chapter progress logged yet."
                  />
                  <RankedList
                    title="Currently reading"
                    kicker="PROGRESS"
                    items={stats.currentlyReading}
                    empty="Nothing marked as Reading."
                  />
                </>
              )}

              {statsScope === 'games' && (
                <>
                  <StatTiles
                    title="Games at a glance"
                    kicker={`${games.length.toLocaleString()} GAMES`}
                    tiles={[
                      {
                        label: 'Total playtime',
                        value: `${fmtInt(gameStats.totalHours)} h`,
                        sub: gameStats.totalHours
                          ? `≈ ${(gameStats.totalHours / 24).toFixed(1)} days`
                          : 'no playtime logged',
                      },
                      {
                        label: 'Avg per game',
                        value: gameStats.avgHours == null ? '—' : `${fmt(gameStats.avgHours)} h`,
                        sub: `median ${gameStats.medianHours == null ? '—' : `${fmt(gameStats.medianHours)} h`}`,
                      },
                      {
                        label: 'Finish rate',
                        value: `${gameStats.completionRate}%`,
                        sub: `${gameStats.completed} beaten of ${games.length - gameStats.unplayed} started`,
                      },
                      {
                        label: 'Backlog',
                        value: fmtInt(gameStats.backlog),
                        sub: `${gameStats.unplayed} unplayed in total`,
                      },
                      {
                        label: 'Replays',
                        value: fmtInt(gameStats.timesCompletedTotal),
                        sub: 'total times completed',
                      },
                      {
                        label: 'Dropped / unfinished',
                        value: fmtInt(gameStats.dropped + gameStats.unfinished),
                        sub: `${gameStats.dropped} dropped · ${gameStats.unfinished} unfinished`,
                      },
                      {
                        label: 'Genres',
                        value: fmtInt(gameStats.genreCount),
                        sub: gameStats.genres[0]
                          ? `most: ${gameStats.genres[0].label}`
                          : 'none tagged yet',
                      },
                      {
                        label: 'Spend',
                        value: gameStats.totalSpent > 0 ? fmtMoney(gameStats.totalSpent) : '—',
                        sub:
                          gameStats.costPerHour != null
                            ? `${fmtMoney(gameStats.costPerHour)} per hour played`
                            : gameStats.paidCount
                              ? `${gameStats.paidCount} priced games`
                              : 'no prices logged',
                      },
                    ]}
                  />
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
                  <DistributionList
                    title="Most played platforms"
                    items={gameStats.platforms.map((item) => ({
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
                    title="Status"
                    items={gameStats.status.map((item) => ({
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
                    title="Format"
                    items={gameStats.formats.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Score distribution"
                    items={gameStats.scoreDistribution.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Rating breakdown"
                    caption="MEAN · OUT OF 10"
                    scaleMax={10}
                    items={gameStats.subRatings}
                    empty="No category ratings logged yet."
                  />
                  <DistributionList
                    title="Top genres"
                    items={gameStats.genres.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                    empty="Add genres or tags to see this."
                  />
                  <DistributionList
                    title="Best-scored genres"
                    caption="MEAN SCORE · 2+ RATED"
                    scaleMax={10}
                    items={gameStats.genreScores}
                    empty="Rate at least two games in a genre to rank it."
                  />
                  <DistributionList
                    title="Hours by platform"
                    caption="TOTAL PLAYTIME"
                    items={gameStats.hoursByPlatform}
                    empty="No playtime logged yet."
                  />
                  <DistributionList
                    title="Playtime profile"
                    caption="GAMES WITH PLAYTIME"
                    items={gameStats.playtimeBuckets.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                  />
                  <DistributionList
                    title="Storefronts"
                    items={gameStats.storefronts.map((item) => ({
                      ...item,
                      detail: `${item.value} games`,
                    }))}
                    empty="No digital service recorded."
                  />
                  <DistributionList title="Decades" caption="RELEASE" items={gameStats.decades} />
                  <DistributionList
                    title="Country of origin"
                    items={gameStats.countries.slice(0, 8)}
                    empty="No countries recorded."
                  />
                  <DistributionList
                    title="Game type"
                    items={gameStats.gameTypes}
                    empty="No game types recorded."
                  />
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Games added per year</h3>
                      <span>ACQUIRED / ADDED</span>
                    </div>
                    <BarTrendChart
                      items={gameStats.addedYears}
                      ariaLabel="Games added per year"
                      unit="games"
                    />
                  </section>
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Games completed per year</h3>
                      <span>COMPLETION DATE</span>
                    </div>
                    <BarTrendChart
                      items={gameStats.completedYears}
                      ariaLabel="Games completed per year"
                      unit="completed"
                      empty="Add completion dates to see your finishing pace."
                    />
                  </section>
                  <RankedList
                    title="Top rated"
                    kicker="PERSONAL SCORE"
                    items={gameStats.topRated}
                    empty="Rate a game to see it here."
                  />
                  <RankedList
                    title="Most played"
                    kicker="HOURS"
                    items={gameStats.longestGames}
                    empty="No playtime logged yet."
                  />
                </>
              )}

              {statsScope === 'movies' && (
                <>
                  <StatTiles
                    title="Movies at a glance"
                    kicker={`${movies.length.toLocaleString()} FILMS`}
                    tiles={[
                      {
                        label: 'Watched',
                        value: fmtInt(movieStats.watchedCount),
                        sub: `${pctOf(movieStats.watchedCount, movies.length)}% of the list`,
                      },
                      {
                        label: 'Still on watchlist',
                        value: fmtInt(movieStats.watchlistCount),
                        sub: movieStats.oldestWait
                          ? `oldest waiting ${fmtDays(movieStats.oldestWait.days)}`
                          : undefined,
                      },
                      {
                        label: `Watched in ${new Date().getFullYear()}`,
                        value: fmtInt(movieStats.watchedThisYear),
                        sub: 'by watched date',
                      },
                      {
                        label: 'Median wait',
                        value: fmtDays(movieStats.medianWait),
                        sub: movieStats.waitTracked
                          ? 'watchlist to watched'
                          : 'needs watchlist + watched dates',
                      },
                      {
                        label: 'Average rating',
                        value: movieStats.ratedCount ? fmt(movieStats.meanScore, 2) : '—',
                        sub:
                          movieStats.ratingStdDev != null
                            ? `±${movieStats.ratingStdDev.toFixed(2)} spread`
                            : 'no ratings yet',
                      },
                      {
                        label: 'Average release year',
                        value:
                          movieStats.avgYear == null ? '—' : String(Math.round(movieStats.avgYear)),
                        sub:
                          movieStats.oldest && movieStats.newest
                            ? `${movieStats.oldest.year} to ${movieStats.newest.year}`
                            : undefined,
                      },
                      {
                        label: 'Genres',
                        value: fmtInt(movieStats.genreCount),
                        sub: movieStats.noGenre ? `${movieStats.noGenre} untagged` : 'all tagged',
                      },
                      {
                        label: 'Data coverage',
                        value: `${pctOf(movieStats.posterCount, movies.length)}%`,
                        sub: `posters · ${movieStats.notesCount} with notes · ${movieStats.unknownCountry} no country`,
                      },
                    ]}
                  />
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
                      · {movieStats.posterCount} with posters.
                    </p>
                    <button
                      type="button"
                      className="masterlist-inline-action"
                      onClick={() => setActiveTab('movies')}
                    >
                      Explore movies <ArrowUpRight size={14} />
                    </button>
                  </section>
                  <DistributionList
                    title="Top genres"
                    items={movieStats.genres.slice(0, 10).map((item) => ({
                      ...item,
                      detail: `${item.value} films`,
                    }))}
                  />
                  <DistributionList
                    title="Watchlist status"
                    items={movieStats.statuses.map((item) => ({
                      ...item,
                      detail: `${item.value} films`,
                    }))}
                  />
                  <DistributionList
                    title="Country of origin"
                    items={movieStats.countries.slice(0, 8).map((item) => ({
                      ...item,
                      detail: `${item.value} films`,
                    }))}
                  />
                  <DistributionList
                    title="Format"
                    items={movieStats.formats.map((item) => ({
                      ...item,
                      detail: `${item.value} films`,
                    }))}
                  />
                  <DistributionList
                    title="Rating distribution"
                    items={movieStats.scoreDistribution.map((item) => ({
                      ...item,
                      detail: `${item.value} films`,
                    }))}
                  />
                  <DistributionList
                    title="Best-rated genres"
                    caption="MEAN · 2+ RATED"
                    scaleMax={10}
                    items={movieStats.genreScores}
                    empty="Rate at least two films in a genre to rank it."
                  />
                  <DistributionList
                    title="Rating by decade"
                    caption="MEAN · 2+ RATED"
                    scaleMax={10}
                    items={movieStats.decadeScores}
                    empty="Rate at least two films in a decade to compare."
                  />
                  <DistributionList
                    title="Best-rated countries"
                    caption="MEAN · 2+ RATED"
                    scaleMax={10}
                    items={movieStats.countryScores}
                    empty="Rate at least two films from a country to compare."
                  />
                  <DistributionList title="Decades" caption="RELEASE" items={movieStats.decades} />
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Watched per year</h3>
                      <span>WATCHED DATE</span>
                    </div>
                    <BarTrendChart
                      items={movieStats.watchedYears}
                      ariaLabel="Movies watched per year"
                      unit="watched"
                      empty="Add watched dates to see your viewing pace."
                    />
                  </section>
                  <section className="manga-stat-panel ml-wide">
                    <div className="manga-stat-panel-heading">
                      <h3>Added to watchlist per year</h3>
                      <span>WATCHLIST DATE</span>
                    </div>
                    <BarTrendChart
                      items={movieStats.addedYears}
                      ariaLabel="Movies added per year"
                      unit="added"
                    />
                  </section>
                  <RankedList
                    title="Top rated"
                    kicker="PERSONAL RATING"
                    items={movieStats.topRated}
                    empty="Rate a film to see it here."
                  />
                  <RankedList
                    title="Longest on the watchlist"
                    kicker="UP NEXT"
                    items={movieStats.upNext}
                    empty="Your watchlist is clear."
                  />
                </>
              )}
            </div>
          </div>
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
