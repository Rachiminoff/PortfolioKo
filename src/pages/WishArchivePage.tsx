// WishArchivePage.tsx - Tab-based navigation with no collapsible sections

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';
import './styles/WishArchivePage.scss';

interface WishCharacter {
  id: number;
  name: string;
  date_obtained: string;
  outcome: 'won' | 'lost';
  element: 'Anemo' | 'Geo' | 'Electro' | 'Dendro' | 'Hydro' | 'Pyro' | 'Cryo';
  version: string;
  year: number;
  artwork: string | null;
  obtained_order: number;
  description: string | null;
  created_at: string;
}

interface YearData {
  total: number;
  wins: number;
  losses: number;
  rate: number;
  avgGap: number;
  bestStreak: number;
  characters: string[];
}

interface YearStat {
  year: number;
  rate: number;
}

interface Achievement {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

interface Stats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  collectionPercentage: number;
  activeYears: number;
  avgCharsPerYear: number;
  avgWinsPerYear: number;
  avgLossesPerYear: number;
  byYear: Record<number, YearData>;
  byElement: Record<string, number>;
  mostCollectedElement: string;
  leastCollectedElement: string;
  elementDiversity: number;
  versionsParticipated: number;
  earliestVersion: string;
  latestVersion: string;
  first: WishCharacter | null;
  latest: WishCharacter | null;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  luckiestYear: YearStat | null;
  unluckiestYear: YearStat | null;
  busiestYear: number;
  busiestVersion: string;
  longestGap: number;
  shortestGap: number;
  avgGap: number;
  doubleDays: number;
  fiftyFiftyWins: number;
  guaranteedChars: number;
  yearlyStats: Array<{ year: number; total: number; wins: number; losses: number; rate: number }>;
  versionStats: Array<{ version: string; total: number }>;
  outcomeDistribution: { won: number; lost: number };
  funFacts: string[];
  achievements: Achievement[];
}

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getElementColor = (element: string): string => {
  const colors: Record<string, string> = {
    Anemo: '#7ae0db',
    Geo: '#f9b55d',
    Electro: '#bb7ae0',
    Dendro: '#7eb870',
    Hydro: '#4a90d9',
    Pyro: '#e06040',
    Cryo: '#7fc4e0',
  };
  return colors[element] || '#ffffff';
};

const getElementIcon = (element: string): string => {
  const icons: Record<string, string> = {
    Anemo: 'mdi:weather-windy',
    Geo: 'mdi:hexagon',
    Electro: 'mdi:lightning-bolt',
    Dendro: 'mdi:leaf',
    Hydro: 'mdi:water',
    Pyro: 'mdi:fire',
    Cryo: 'mdi:snowflake',
  };
  return icons[element] || 'mdi:circle';
};

// Tab Navigation Component
const TabNav: React.FC<{
  tabs: Array<{ id: string; label: string; icon: string }>;
  activeTab: string;
  onSelect: (id: string) => void;
}> = ({ tabs, activeTab, onSelect }) => {
  return (
    <div className="tab-nav">
      <div className="tab-nav-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onSelect(tab.id)}
            aria-label={`Switch to ${tab.label}`}
          >
            <Icon icon={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Animated Counter
const AnimatedCounter: React.FC<{
  target: number;
  duration?: number;
  label?: string;
  suffix?: string;
  prefix?: string;
  className?: string;
}> = ({ target, duration = 1500, label, suffix = '', prefix = '', className = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let start = 0;
            const increment = target / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= target) {
                setCount(target);
                clearInterval(timer);
              } else {
                setCount(Math.ceil(start));
              }
            }, 16);
            return () => clearInterval(timer);
          }
        });
      },
      { threshold: 0.3 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <div ref={ref} className={`animated-counter ${className}`}>
      <span className="animated-counter-value">
        {prefix}
        {count}
        {suffix}
      </span>
      {label && <span className="animated-counter-label">{label}</span>}
    </div>
  );
};

// Donut Chart
const DonutChart: React.FC<{ data: Record<string, number>; colors?: Record<string, string> }> = ({
  data,
  colors,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    const size = Math.min(rect?.width || 200, 200);
    canvas.width = size;
    canvas.height = size;

    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;
    let startAngle = -Math.PI / 2;

    const elementColors: Record<string, string> = {
      Anemo: '#7ae0db',
      Geo: '#f9b55d',
      Electro: '#bb7ae0',
      Dendro: '#7eb870',
      Hydro: '#4a90d9',
      Pyro: '#e06040',
      Cryo: '#7fc4e0',
    };

    const entries = Object.entries(data);
    entries.forEach(([key, value]) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = colors?.[key] || elementColors[key] || '#ffffff';

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();

    setHasDrawn(true);
  }, [data, colors]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasDrawn) {
            drawChart();
          }
        });
      },
      { threshold: 0.3 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasDrawn, drawChart]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => {
      if (hasDrawn) {
        drawChart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasDrawn, drawChart]);

  return (
    <div ref={ref} className="donut-chart">
      <canvas ref={canvasRef} />
    </div>
  );
};

// Bar Chart
const BarChart: React.FC<{
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  showValues?: boolean;
}> = ({ data, height = 150, showValues = true }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.2 },
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div ref={chartRef} className="bar-chart" style={{ height }}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const delay = index * 0.05;
        return (
          <div key={index} className="bar-chart-item stagger-card">
            <div className="bar-chart-bar-wrapper" style={{ height: '100%' }}>
              <div
                className="bar-chart-bar"
                style={{
                  height: hasAnimated ? `${percentage}%` : '0%',
                  backgroundColor: item.color || '#8B5CF6',
                  transitionDelay: `${delay}s`,
                  transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
            {showValues && <span className="bar-chart-value">{item.value}</span>}
            <span className="bar-chart-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Heat Map — deliberately data-only. Artwork is never rendered in this view or its tooltip.
const HeatMap: React.FC<{
  characters: WishCharacter[];
  year: number;
}> = ({ characters, year }) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getCharactersForDate = (dateKey: string) =>
    characters.filter((character) => character.date_obtained === dateKey);

  useEffect(() => {
    setIsAnimating(true);
    const timer = window.setTimeout(() => setIsAnimating(false), 320);
    return () => window.clearTimeout(timer);
  }, [year]);

  const days = useMemo(() => {
    const result: Date[] = [];
    const cursor = new Date(year, 0, 1);
    while (cursor.getFullYear() === year) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [year]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];
    const firstDay = new Date(year, 0, 1).getDay();

    for (let i = firstDay; i > 0; i -= 1) {
      currentWeek.push(new Date(year, 0, -i + 1));
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length) result.push(currentWeek);
    return result;
  }, [days, year]);

  const yearCharacters = useMemo(
    () => characters.filter((character) => character.year === year),
    [characters, year],
  );

  const dateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    yearCharacters.forEach((character) => {
      counts[character.date_obtained] = (counts[character.date_obtained] || 0) + 1;
    });
    return counts;
  }, [yearCharacters]);

  const activeDays = Object.keys(dateCounts).length;
  const wins = yearCharacters.filter((character) => character.outcome === 'won').length;
  const losses = yearCharacters.length - wins;
  const busiest = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0];
  const hoveredCharacters = hoveredDate ? getCharactersForDate(hoveredDate) : [];

  const monthLabels = Array.from({ length: 12 }, (_, index) => ({
    label: new Date(year, index, 1).toLocaleString('en-US', { month: 'short' }),
    start: new Date(year, index, 1),
  }));

  const setHover = (
    event: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>,
    dateKey: string,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: Math.min(window.innerWidth - 18, Math.max(18, rect.left + rect.width / 2)),
      y: Math.max(18, rect.top - 10),
    });
    setHoveredDate(dateKey);
  };

  return (
    <div className={`wish-v4-heat ${isAnimating ? 'is-animating' : ''}`}>
      <div className="wish-v4-heat-summary">
        <div className="wish-v4-heat-lead">
          <span className="wish-v4-kicker">ACTIVITY INDEX</span>
          <strong>{yearCharacters.length}</strong>
          <span>limited 5★ records in {year}</span>
        </div>
        <div>
          <span className="wish-v4-kicker">ACTIVE DAYS</span>
          <strong>{activeDays}</strong>
          <span>days with at least one record</span>
        </div>
        <div>
          <span className="wish-v4-kicker">WIN RATE</span>
          <strong>
            {yearCharacters.length ? `${Math.round((wins / yearCharacters.length) * 100)}%` : '—'}
          </strong>
          <span>
            {wins} wins · {losses} losses
          </span>
        </div>
        <div>
          <span className="wish-v4-kicker">BUSIEST DAY</span>
          <strong>{busiest?.[1] || 0}</strong>
          <span>{busiest ? formatDate(busiest[0]) : 'No records'}</span>
        </div>
      </div>

      <div className="wish-v4-heat-board">
        <div className="wish-v4-panel-head">
          <div>
            <span className="wish-v4-kicker">DAILY RECORD</span>
            <h3>Pull rhythm by date</h3>
          </div>
          <p>Hover or focus a square. Details stay text-only.</p>
        </div>

        <div className="wish-v4-calendar-scroll">
          <div className="wish-v4-calendar">
            <div className="wish-v4-months">
              {monthLabels.map((month) => (
                <span key={month.label}>{month.label}</span>
              ))}
            </div>
            <div className="wish-v4-calendar-body">
              <div className="wish-v4-weekdays" aria-hidden="true">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>
              <div className="wish-v4-grid" aria-label={`${year} pull activity heat map`}>
                {weeks.map((week, weekIndex) => (
                  <div className="wish-v4-week" key={weekIndex}>
                    {week.map((day, dayIndex) => {
                      const dateKey = toDateKey(day);
                      const isCurrentYear = day.getFullYear() === year;
                      const count = isCurrentYear ? dateCounts[dateKey] || 0 : 0;
                      const level = Math.min(count, 4);
                      const active = hoveredDate === dateKey;

                      return (
                        <button
                          key={`${weekIndex}-${dayIndex}`}
                          type="button"
                          className={`wish-v4-cell level-${level} ${isCurrentYear ? '' : 'outside'} ${active ? 'active' : ''}`}
                          disabled={!isCurrentYear}
                          aria-label={
                            isCurrentYear
                              ? `${formatDate(dateKey)}: ${count} character${count === 1 ? '' : 's'} obtained`
                              : undefined
                          }
                          onMouseEnter={(event) => isCurrentYear && setHover(event, dateKey)}
                          onFocus={(event) => isCurrentYear && setHover(event, dateKey)}
                          onMouseLeave={() => setHoveredDate(null)}
                          onBlur={() => setHoveredDate(null)}
                          onClick={(event) => {
                            if (!isCurrentYear) return;
                            if (hoveredDate === dateKey) setHoveredDate(null);
                            else setHover(event, dateKey);
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {hoveredDate && (
          <div
            className="wish-v4-heat-tooltip"
            style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
            role="status"
            aria-live="polite"
          >
            <div className="wish-v4-tooltip-top">
              <strong>{formatDate(hoveredDate)}</strong>
              <span>
                {hoveredCharacters.length
                  ? `${hoveredCharacters.length} RECORD${hoveredCharacters.length === 1 ? '' : 'S'}`
                  : 'NO RECORDS'}
              </span>
            </div>
            {hoveredCharacters.length > 0 && (
              <div className="wish-v4-tooltip-list">
                {hoveredCharacters.map((character) => (
                  <div className="wish-v4-tooltip-row" key={character.id}>
                    <span
                      className="wish-v4-tooltip-element"
                      style={{ color: getElementColor(character.element) }}
                    >
                      <Icon icon={getElementIcon(character.element)} />
                    </span>
                    <span className="wish-v4-tooltip-name">{character.name}</span>
                    <span className={`wish-v4-tooltip-outcome ${character.outcome}`}>
                      {character.outcome === 'won' ? 'WIN' : 'LOSS'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="wish-v4-heat-footer">
          <span>FEWER</span>
          <div className="wish-v4-legend">
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className={`wish-v4-cell level-${level}`} />
            ))}
          </div>
          <span>MORE</span>
          <span className="wish-v4-heat-footnote">
            {yearCharacters.length} records · {activeDays} active days
          </span>
        </div>
      </div>
    </div>
  );
};

// Timeline Entry Component
interface TimelineEntryProps {
  character: WishCharacter;
  index: number;
  onClick: () => void;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({ character, index, onClick }) => {
  const elementColor = getElementColor(character.element);
  const entryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 },
    );

    if (entryRef.current) {
      observer.observe(entryRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={entryRef}
      type="button"
      className="wish-timeline-entry-premium stagger-card"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
      aria-label={`View details for ${character.name}`}
    >
      <div className="wish-timeline-entry-connector">
        <div className="wish-timeline-entry-dot" style={{ backgroundColor: elementColor }} />
      </div>
      <div className="wish-timeline-entry-content">
        <div className="wish-timeline-entry-header">
          <div className="wish-timeline-entry-name">
            {character.artwork && (
              <img
                src={character.artwork}
                alt={character.name}
                className="wish-timeline-entry-portrait"
              />
            )}
            <h4>{character.name}</h4>
            <span className="wish-timeline-entry-version">v{character.version}</span>
          </div>
          <div className={`wish-timeline-entry-outcome ${character.outcome}`}>
            {character.outcome === 'won' ? '✓ Won' : '✗ Lost'}
          </div>
        </div>
        <div className="wish-timeline-entry-meta">
          <span className="wish-timeline-entry-date">{formatDate(character.date_obtained)}</span>
          <span className="wish-timeline-entry-element" style={{ color: elementColor }}>
            <Icon icon={getElementIcon(character.element)} />
            {character.element}
          </span>
        </div>
      </div>
    </button>
  );
};

// Character Card Component
interface CharacterCardProps {
  character: WishCharacter;
  onClick: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick }) => {
  const elementColor = getElementColor(character.element);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="wish-card premium-card stagger-card"
      onClick={onClick}
      style={{ '--card-accent': elementColor } as React.CSSProperties}
    >
      <div className="wish-card-image-wrapper">
        <img
          src={character.artwork || '/images/characters/placeholder.webp'}
          alt={character.name}
          className="wish-card-image"
          loading="lazy"
        />
        <div
          className="wish-card-glow"
          style={{ background: `radial-gradient(circle, ${elementColor}44, transparent 70%)` }}
        />
        <div className="wish-card-element" style={{ backgroundColor: elementColor }}>
          <Icon icon={getElementIcon(character.element)} />
        </div>
        <div className={`wish-card-outcome ${character.outcome}`}>
          {character.outcome === 'won' ? '✓ Won' : '✗ Lost'}
        </div>
        <div className="wish-card-version-badge">v{character.version}</div>
      </div>
      <div className="wish-card-content">
        <h3>{character.name}</h3>
        <p className="wish-card-date">{formatDate(character.date_obtained)}</p>
      </div>
    </div>
  );
};

// Main Component
const WishArchivePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [characters, setCharacters] = useState<WishCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const initialTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(
    ['overview', 'analytics', 'heatmap', 'funfacts', 'achievements', 'archive'].includes(
      initialTab || '',
    )
      ? initialTab || 'overview'
      : 'overview',
  );
  const [viewMode, setViewMode] = useState<'timeline' | 'gallery'>('timeline');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'version'>('date');
  const [selectedCharacter, setSelectedCharacter] = useState<WishCharacter | null>(null);
  const [heatmapYear, setHeatmapYear] = useState<number>(new Date().getFullYear());

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'mdi:home' },
    { id: 'analytics', label: 'Analytics', icon: 'mdi:chart-bar' },
    { id: 'heatmap', label: 'Heat Map', icon: 'mdi:fire' },
    { id: 'funfacts', label: 'Fun Facts', icon: 'mdi:star' },
    { id: 'achievements', label: 'Achievements', icon: 'mdi:trophy' },
    { id: 'archive', label: 'Archive', icon: 'mdi:format-list-bulleted' },
  ];

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (
      tab &&
      ['overview', 'analytics', 'heatmap', 'funfacts', 'achievements', 'archive'].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchCharacters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wish_archive')
      .select('*')
      .order('obtained_order', { ascending: true });

    if (error) {
      console.error('Error fetching wish characters:', error);
    } else {
      setCharacters(data || []);
    }
    setLoading(false);
  };

  const years = useMemo(() => {
    const yearSet = new Set(characters.map((c) => c.year));
    return [
      'all',
      ...Array.from(yearSet)
        .sort((a, b) => b - a)
        .map(String),
    ];
  }, [characters]);

  const elements = useMemo(() => {
    const elementSet = new Set(characters.map((c) => c.element));
    return ['all', ...Array.from(elementSet)];
  }, [characters]);

  useEffect(() => {
    const availableYears = years.filter((year) => year !== 'all').map(Number);
    if (availableYears.length && !availableYears.includes(heatmapYear)) {
      setHeatmapYear(availableYears[0]);
    }
  }, [years, heatmapYear]);

  const outcomes = ['all', 'won', 'lost'];

  const filteredCharacters = useMemo(() => {
    let filtered = [...characters];

    if (selectedYear !== 'all') {
      filtered = filtered.filter((c) => c.year === Number(selectedYear));
    }

    if (selectedElement !== 'all') {
      filtered = filtered.filter((c) => c.element === selectedElement);
    }

    if (selectedOutcome !== 'all') {
      filtered = filtered.filter((c) => c.outcome === selectedOutcome);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.element.toLowerCase().includes(query) ||
          c.version.includes(query),
      );
    }

    switch (sortBy) {
      case 'date':
        filtered.sort(
          (a, b) => new Date(b.date_obtained).getTime() - new Date(a.date_obtained).getTime(),
        );
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'version':
        filtered.sort((a, b) => b.version.localeCompare(a.version));
        break;
    }

    return filtered;
  }, [characters, selectedYear, selectedElement, selectedOutcome, searchQuery, sortBy]);

  const groupedByYear = useMemo(() => {
    const groups: Record<number, WishCharacter[]> = {};
    filteredCharacters.forEach((character) => {
      if (!groups[character.year]) {
        groups[character.year] = [];
      }
      groups[character.year].push(character);
    });
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [filteredCharacters]);

  const stats: Stats = useMemo(() => {
    const total = characters.length;
    const wins = characters.filter((c) => c.outcome === 'won').length;
    const losses = characters.filter((c) => c.outcome === 'lost').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    const byYear: Record<number, YearData> = {};
    characters.forEach((c) => {
      if (!byYear[c.year]) {
        byYear[c.year] = {
          total: 0,
          wins: 0,
          losses: 0,
          rate: 0,
          avgGap: 0,
          bestStreak: 0,
          characters: [],
        };
      }
      byYear[c.year].total++;
      if (c.outcome === 'won') byYear[c.year].wins++;
      else byYear[c.year].losses++;
      byYear[c.year].characters.push(c.name);
    });

    Object.keys(byYear).forEach((year) => {
      const y = byYear[Number(year)];
      y.rate = y.total > 0 ? (y.wins / y.total) * 100 : 0;

      let streak = 0;
      let bestStreak = 0;
      const yearChars = characters
        .filter((c) => c.year === Number(year))
        .sort((a, b) => new Date(a.date_obtained).getTime() - new Date(b.date_obtained).getTime());
      yearChars.forEach((c) => {
        if (c.outcome === 'won') {
          streak++;
          if (streak > bestStreak) bestStreak = streak;
        } else {
          streak = 0;
        }
      });
      y.bestStreak = bestStreak;

      const dates = yearChars.map((c) => new Date(c.date_obtained));
      let gaps: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        gaps.push(
          Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)),
        );
      }
      y.avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    });

    const byElement: Record<string, number> = {};
    characters.forEach((c) => {
      if (!byElement[c.element]) byElement[c.element] = 0;
      byElement[c.element]++;
    });

    let mostCollectedElement = '';
    let leastCollectedElement = '';
    let maxCount = 0;
    let minCount = Infinity;
    Object.entries(byElement).forEach(([element, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCollectedElement = element;
      }
      if (count < minCount) {
        minCount = count;
        leastCollectedElement = element;
      }
    });

    const elementDiversity = Object.keys(byElement).length;

    const byVersion: Record<string, number> = {};
    characters.forEach((c) => {
      if (!byVersion[c.version]) byVersion[c.version] = 0;
      byVersion[c.version]++;
    });

    let busiestVersion = '';
    let maxVersionCount = 0;
    Object.entries(byVersion).forEach(([version, count]) => {
      if (count > maxVersionCount) {
        maxVersionCount = count;
        busiestVersion = version;
      }
    });

    const versions = Object.keys(byVersion).sort();
    const earliestVersion = versions.length > 0 ? versions[0] : '';
    const latestVersion = versions.length > 0 ? versions[versions.length - 1] : '';
    const versionsParticipated = versions.length;

    const sortedByDate = [...characters].sort(
      (a, b) => new Date(a.date_obtained).getTime() - new Date(b.date_obtained).getTime(),
    );
    const first = sortedByDate[0] || null;
    const latest = sortedByDate[sortedByDate.length - 1] || null;

    const gaps: number[] = [];
    for (let i = 1; i < sortedByDate.length; i++) {
      const prev = new Date(sortedByDate[i - 1].date_obtained);
      const curr = new Date(sortedByDate[i].date_obtained);
      gaps.push(Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const longestGap = gaps.length > 0 ? Math.max(...gaps) : 0;
    const shortestGap = gaps.length > 0 ? Math.min(...gaps) : 0;

    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLoseStreak = 0;
    let currentStreakType: 'won' | 'lost' | null = null;

    const sortedForStreak = [...characters].sort(
      (a, b) => new Date(a.date_obtained).getTime() - new Date(b.date_obtained).getTime(),
    );

    sortedForStreak.forEach((c) => {
      if (c.outcome === currentStreakType) {
        currentStreak++;
      } else {
        currentStreakType = c.outcome;
        currentStreak = 1;
      }
      if (c.outcome === 'won' && currentStreak > longestWinStreak) {
        longestWinStreak = currentStreak;
      }
      if (c.outcome === 'lost' && currentStreak > longestLoseStreak) {
        longestLoseStreak = currentStreak;
      }
    });

    // A pull is "guaranteed" only when the immediately preceding pull was
    // a loss (Genshin's 50/50 pity rule). Everything else is a real 50/50,
    // and only wins on those count toward fiftyFiftyWins.
    let fiftyFiftyWins = 0;
    let guaranteedChars = 0;
    sortedForStreak.forEach((c, index) => {
      const wasGuaranteed = index > 0 && sortedForStreak[index - 1].outcome === 'lost';
      if (wasGuaranteed) {
        guaranteedChars++;
      } else if (c.outcome === 'won') {
        fiftyFiftyWins++;
      }
    });

    const dateCounts: Record<string, number> = {};
    characters.forEach((c) => {
      if (!dateCounts[c.date_obtained]) dateCounts[c.date_obtained] = 0;
      dateCounts[c.date_obtained]++;
    });
    const doubleDays = Object.values(dateCounts).filter((count) => count >= 2).length;

    const activeYears = Object.keys(byYear).length;

    let busiestYear = 0;
    let maxYearCount = 0;
    Object.entries(byYear).forEach(([year, data]) => {
      if (data.total > maxYearCount) {
        maxYearCount = data.total;
        busiestYear = Number(year);
      }
    });

    const yearlyStats = Object.entries(byYear)
      .map(([year, data]) => ({
        year: Number(year),
        total: data.total,
        wins: data.wins,
        losses: data.losses,
        rate: data.rate,
      }))
      .sort((a, b) => a.year - b.year);

    const versionStats = Object.entries(byVersion)
      .map(([version, total]) => ({
        version,
        total,
      }))
      .sort((a, b) => a.version.localeCompare(b.version));

    let luckiestYear: YearStat | null = null;
    let unluckiestYear: YearStat | null = null;

    if (yearlyStats.length > 0) {
      let bestRate = -1;
      let worstRate = 101;
      let bestYear = 0;
      let worstYear = 0;

      yearlyStats.forEach((stat) => {
        if (stat.rate > bestRate) {
          bestRate = stat.rate;
          bestYear = stat.year;
        }
        if (stat.rate < worstRate) {
          worstRate = stat.rate;
          worstYear = stat.year;
        }
      });

      if (bestRate >= 0) {
        luckiestYear = { year: bestYear, rate: bestRate };
      }
      if (worstRate <= 100) {
        unluckiestYear = { year: worstYear, rate: worstRate };
      }
    }

    const totalLimitedChars = 80;
    const collectionPercentage = (total / totalLimitedChars) * 100;
    const avgCharsPerYear = activeYears > 0 ? total / activeYears : 0;
    const avgWinsPerYear = activeYears > 0 ? wins / activeYears : 0;
    const avgLossesPerYear = activeYears > 0 ? losses / activeYears : 0;

    const funFacts: string[] = [];
    if (luckiestYear !== null) {
      funFacts.push(
        `${luckiestYear.year} was your luckiest year with a ${luckiestYear.rate.toFixed(1)}% win rate.`,
      );
    }
    if (unluckiestYear !== null) {
      funFacts.push(
        `${unluckiestYear.year} was your unluckiest year with a ${unluckiestYear.rate.toFixed(1)}% win rate.`,
      );
    }
    if (mostCollectedElement) {
      funFacts.push(
        `${mostCollectedElement} is your most collected element (${maxCount} characters).`,
      );
    }
    if (doubleDays > 0) {
      funFacts.push(
        `You obtained two or more limited characters on ${doubleDays} separate day${doubleDays > 1 ? 's' : ''}.`,
      );
    }
    if (longestWinStreak > 0) {
      funFacts.push(
        `Your longest winning streak lasted ${longestWinStreak} banner${longestWinStreak > 1 ? 's' : ''}.`,
      );
    }
    if (first && latest) {
      funFacts.push(`Your collection spans from Version ${first.version} to ${latest.version}.`);
    }
    funFacts.push(
      `You have collected characters across ${activeYears} year${activeYears > 1 ? 's' : ''}.`,
    );
    if (versionsParticipated > 0) {
      funFacts.push(`You've pulled in ${versionsParticipated} different game versions.`);
    }
    if (longestGap > 0) {
      funFacts.push(`Your longest gap between pulls was ${longestGap} days.`);
    }

    const achievements: Achievement[] = [
      {
        icon: 'mdi:compass-outline',
        title: 'First Steps',
        description: first
          ? `Obtained ${first.name}, your first recorded limited 5★.`
          : 'Obtain your first recorded limited 5★.',
        unlocked: total >= 1,
      },
      {
        icon: 'mdi:lightning-bolt',
        title: 'Lucky Streak',
        description: 'Reach a five-win streak across consecutive banners.',
        unlocked: longestWinStreak >= 5,
      },
      {
        icon: 'mdi:layers-triple-outline',
        title: 'Collector',
        description: 'Build a collection of at least 25 limited 5★ characters.',
        unlocked: total >= 25,
      },
      {
        icon: 'mdi:calendar-multiple',
        title: 'Veteran Traveler',
        description: 'Have recorded pulls across three or more active years.',
        unlocked: activeYears >= 3,
      },
      {
        icon: 'mdi:shape-outline',
        title: 'Element Specialist',
        description: 'Make Cryo your most collected element.',
        unlocked: mostCollectedElement === 'Cryo',
      },
      {
        icon: 'mdi:calendar-star',
        title: 'Double Acquisition',
        description: 'Obtain two or more limited characters on one day.',
        unlocked: doubleDays > 0,
      },
      {
        icon: 'mdi:trophy-outline',
        title: 'Nine-Win Streak',
        description: 'Reach a nine-win streak across consecutive banners.',
        unlocked: longestWinStreak >= 9,
      },
      {
        icon: 'mdi:progress-star',
        title: 'Ten on Record',
        description: 'Record at least ten limited 5★ characters.',
        unlocked: total >= 10,
      },
    ];

    return {
      total,
      wins,
      losses,
      winRate,
      collectionPercentage,
      activeYears,
      avgCharsPerYear,
      avgWinsPerYear,
      avgLossesPerYear,
      byYear,
      byElement,
      mostCollectedElement,
      leastCollectedElement,
      elementDiversity,
      versionsParticipated,
      earliestVersion,
      latestVersion,
      first,
      latest,
      currentStreak,
      longestWinStreak,
      longestLoseStreak,
      luckiestYear,
      unluckiestYear,
      busiestYear,
      busiestVersion,
      longestGap,
      shortestGap,
      avgGap,
      doubleDays,
      fiftyFiftyWins,
      guaranteedChars,
      yearlyStats,
      versionStats,
      outcomeDistribution: { won: wins, lost: losses },
      funFacts,
      achievements,
    };
  }, [characters]);

  const CharacterModal = ({
    character,
    onClose,
  }: {
    character: WishCharacter;
    onClose: () => void;
  }) => {
    const elementColor = getElementColor(character.element);

    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, []);

    return (
      <div className="wish-modal-overlay" onClick={onClose}>
        <div className="wish-modal" onClick={(e) => e.stopPropagation()}>
          <button className="wish-modal-close" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
          <div className="wish-modal-content">
            <div className="wish-modal-image-wrapper">
              <img
                src={character.artwork || '/images/characters/placeholder.webp'}
                alt={character.name}
                className="wish-modal-image"
              />
              <div className="wish-modal-element" style={{ backgroundColor: elementColor }}>
                <Icon icon={getElementIcon(character.element)} />
              </div>
            </div>
            <div className="wish-modal-info">
              <h2>{character.name}</h2>
              <div className="wish-modal-details">
                <div className="wish-modal-detail">
                  <span className="wish-modal-detail-label">Element</span>
                  <span className="wish-modal-detail-value" style={{ color: elementColor }}>
                    <Icon icon={getElementIcon(character.element)} />
                    {character.element}
                  </span>
                </div>
                <div className="wish-modal-detail">
                  <span className="wish-modal-detail-label">Version</span>
                  <span className="wish-modal-detail-value">v{character.version}</span>
                </div>
                <div className="wish-modal-detail">
                  <span className="wish-modal-detail-label">Date Obtained</span>
                  <span className="wish-modal-detail-value">
                    {formatDate(character.date_obtained)}
                  </span>
                </div>
                <div className="wish-modal-detail">
                  <span className="wish-modal-detail-label">Outcome</span>
                  <span className={`wish-modal-detail-value ${character.outcome}`}>
                    {character.outcome === 'won' ? '✓ Won' : '✗ Lost'}
                  </span>
                </div>
                <div className="wish-modal-detail">
                  <span className="wish-modal-detail-label">Order</span>
                  <span className="wish-modal-detail-value">#{character.obtained_order}</span>
                </div>
                {character.description && (
                  <div className="wish-modal-detail">
                    <span className="wish-modal-detail-label">Notes</span>
                    <span className="wish-modal-detail-value wish-modal-description">
                      {character.description}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="wish-archive-page">
        <div className="wish-loading-state">
          <div className="wish-loading-spinner" />
          <p>Loading your journey...</p>
        </div>
      </div>
    );
  }

  // The first five tabs use an isolated Bauhaus × Swiss system.
  // Timeline/archive markup and styles below are intentionally unchanged.
  const renderOverview = () => {
    const progress = Math.min(100, Math.max(0, stats.collectionPercentage));
    const elementEntries = Object.entries(stats.byElement).sort(([, a], [, b]) => b - a);
    const remaining = Math.max(0, 80 - stats.total);

    return (
      <section className="wish-v4-tab wish-v4-overview section-reveal">
        <header className="wish-v4-intro">
          <div>
            <span className="wish-v4-kicker">01 / OVERVIEW</span>
            <h2>The collection at a glance.</h2>
            <p>
              One page for the numbers that actually matter: collection size, outcomes, range, and
              the shape of the archive.
            </p>
          </div>
          <div className="wish-v4-index">
            <strong>W01</strong>
            <span>COLLECTION INDEX</span>
          </div>
        </header>

        <div className="wish-v4-overview-grid">
          <article className="wish-v4-hero-stat">
            <div className="wish-v4-hero-stat-head">
              <span>COLLECTED</span>
              <strong>
                {stats.total}
                <small>/ 80</small>
              </strong>
            </div>
            <div className="wish-v4-big-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="wish-v4-hero-stat-foot">
              <span>{Math.round(progress)}% complete</span>
              <span>{remaining} remaining</span>
            </div>
          </article>

          <div className="wish-v4-kpi-grid">
            <article className="wish-v4-kpi wish-v4-red">
              <span>WIN RATE</span>
              <strong>{Math.round(stats.winRate)}%</strong>
              <small>
                {stats.wins} wins / {stats.losses} losses
              </small>
            </article>
            <article className="wish-v4-kpi wish-v4-blue">
              <span>ACTIVE YEARS</span>
              <strong>{stats.activeYears}</strong>
              <small>{stats.avgCharsPerYear.toFixed(1)} records / year</small>
            </article>
            <article className="wish-v4-kpi wish-v4-yellow">
              <span>VERSIONS</span>
              <strong>{stats.versionsParticipated}</strong>
              <small>
                v{stats.earliestVersion || '—'} → v{stats.latestVersion || '—'}
              </small>
            </article>
            <article className="wish-v4-kpi wish-v4-paper">
              <span>WIN STREAK</span>
              <strong>{stats.longestWinStreak}</strong>
              <small>consecutive wins</small>
            </article>
          </div>
        </div>

        <div className="wish-v4-two-col">
          <article className="wish-v4-paper-card wish-v4-record-strip">
            <div className="wish-v4-card-label">ARCHIVE SPAN</div>
            <div className="wish-v4-span">
              <div>
                <span>FIRST</span>
                <strong>{stats.first?.name || '—'}</strong>
                <small>
                  {stats.first
                    ? `${formatDate(stats.first.date_obtained)} · v${stats.first.version}`
                    : 'No record'}
                </small>
              </div>
              <Icon icon="mdi:arrow-right" />
              <div>
                <span>LATEST</span>
                <strong>{stats.latest?.name || '—'}</strong>
                <small>
                  {stats.latest
                    ? `${formatDate(stats.latest.date_obtained)} · v${stats.latest.version}`
                    : 'No record'}
                </small>
              </div>
            </div>
          </article>

          <article className="wish-v4-paper-card">
            <div className="wish-v4-card-label">
              ELEMENT MIX <span>{stats.elementDiversity}/7</span>
            </div>
            <div className="wish-v4-element-list">
              {elementEntries.map(([element, count]) => (
                <div className="wish-v4-element-row" key={element}>
                  <div>
                    <span
                      className="wish-v4-element-dot"
                      style={{ background: getElementColor(element) }}
                    />
                    <strong>{element}</strong>
                    <small>{count}</small>
                  </div>
                  <span className="wish-v4-mini-track">
                    <i
                      style={{
                        width: `${(count / Math.max(stats.total, 1)) * 100}%`,
                        background: getElementColor(element),
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  };

  const renderAnalytics = () => {
    const maxYearTotal = Math.max(...stats.yearlyStats.map((item) => item.total), 1);
    return (
      <section className="wish-v4-tab wish-v4-analytics section-reveal">
        <header className="wish-v4-intro">
          <div>
            <span className="wish-v4-kicker">02 / ANALYTICS</span>
            <h2>Read the pattern, not the spreadsheet.</h2>
            <p>
              Outcome, cadence, elements, and yearly volume are separated into visual units so the
              story is visible before the numbers are.
            </p>
          </div>
          <div className="wish-v4-index wish-v4-index-blue">
            <strong>{stats.longestWinStreak}</strong>
            <span>LONGEST WIN STREAK</span>
          </div>
        </header>

        <div className="wish-v4-analytics-hero">
          <article className="wish-v4-outcome-board">
            <div className="wish-v4-board-head">
              <div>
                <span className="wish-v4-kicker">OUTCOME</span>
                <h3>Wins versus losses</h3>
              </div>
              <strong>
                {Math.round(stats.winRate)}
                <small>%</small>
              </strong>
            </div>
            <div className="wish-v4-outcome-bar">
              <span style={{ width: `${stats.winRate}%` }} />
            </div>
            <div className="wish-v4-outcome-legend">
              <div>
                <i className="win" />
                <span>WINS</span>
                <strong>{stats.wins}</strong>
              </div>
              <div>
                <i className="loss" />
                <span>LOSSES</span>
                <strong>{stats.losses}</strong>
              </div>
              <div>
                <i className="neutral" />
                <span>50/50 WINS</span>
                <strong>{stats.fiftyFiftyWins}</strong>
              </div>
              <div>
                <i className="guaranteed" />
                <span>GUARANTEED</span>
                <strong>{stats.guaranteedChars}</strong>
              </div>
            </div>
          </article>

          <article className="wish-v4-cadence-board">
            <span className="wish-v4-kicker">CADENCE</span>
            <h3>Time between records</h3>
            <strong>
              {Math.round(stats.avgGap)}
              <small> days avg.</small>
            </strong>
            <div className="wish-v4-cadence-stats">
              <span>
                <b>{stats.shortestGap || 0}</b> shortest
              </span>
              <span>
                <b>{stats.longestGap || 0}</b> longest
              </span>
              <span>
                <b>{stats.doubleDays}</b> double days
              </span>
            </div>
          </article>
        </div>

        <div className="wish-v4-analytics-grid">
          <article className="wish-v4-paper-card wish-v4-elements-board">
            <div className="wish-v4-card-label">
              ELEMENT COMPOSITION <span>{stats.total} TOTAL</span>
            </div>
            <div className="wish-v4-element-analytics">
              {Object.entries(stats.byElement)
                .sort(([, a], [, b]) => b - a)
                .map(([element, count], index) => {
                  const percentage = Math.round((count / Math.max(stats.total, 1)) * 100);
                  return (
                    <div className="wish-v4-element-analytics-row" key={element}>
                      <span className="wish-v4-element-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="wish-v4-element-icon"
                        style={{
                          color: getElementColor(element),
                          borderColor: getElementColor(element),
                        }}
                      >
                        <Icon icon={getElementIcon(element)} />
                      </span>
                      <strong>{element}</strong>
                      <div className="wish-v4-element-wide-track">
                        <i
                          style={{ width: `${percentage}%`, background: getElementColor(element) }}
                        />
                      </div>
                      <b>{count}</b>
                      <small>{percentage}%</small>
                    </div>
                  );
                })}
            </div>
          </article>

          <article className="wish-v4-paper-card wish-v4-year-board">
            <div className="wish-v4-card-label">
              YEARLY VOLUME <span>{stats.busiestYear || '—'} PEAK</span>
            </div>
            <div className="wish-v4-year-bars">
              {stats.yearlyStats.map((item) => (
                <div className="wish-v4-year-bar" key={item.year}>
                  <strong>{item.total}</strong>
                  <div>
                    <i style={{ height: `${(item.total / maxYearTotal) * 100}%` }} />
                  </div>
                  <span>{item.year}</span>
                  <small>{Math.round(item.rate)}% win</small>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="wish-v4-year-ledger">
          {stats.yearlyStats.map((item) => (
            <article key={item.year}>
              <strong>{item.year}</strong>
              <span>{item.total} records</span>
              <span>
                {item.wins}W / {item.losses}L
              </span>
              <b>{Math.round(item.rate)}%</b>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderHeatmap = () => (
    <section className="wish-v4-tab wish-v4-heat-tab section-reveal">
      <header className="wish-v4-intro">
        <div>
          <span className="wish-v4-kicker">03 / HEAT MAP</span>
          <h2>Find the rhythm in the calendar.</h2>
          <p>
            Activity only. No character artwork appears in the grid or its hover card, so the heat
            map stays fast and readable.
          </p>
        </div>
        <div className="wish-v4-year-tabs" role="tablist" aria-label="Heat map year">
          {years
            .filter((year) => year !== 'all')
            .map((year) => (
              <button
                key={year}
                type="button"
                role="tab"
                aria-selected={heatmapYear === Number(year)}
                className={heatmapYear === Number(year) ? 'active' : ''}
                onClick={() => setHeatmapYear(Number(year))}
              >
                {year}
              </button>
            ))}
        </div>
      </header>
      <HeatMap characters={characters} year={heatmapYear} />
    </section>
  );

  const renderFunFacts = () => {
    const icons = [
      'mdi:calendar-star-outline',
      'mdi:chart-timeline-variant',
      'mdi:shape-outline',
      'mdi:calendar-multiple-check',
      'mdi:lightning-bolt-outline',
      'mdi:layers-triple-outline',
      'mdi:timer-outline',
      'mdi:gamepad-variant-outline',
      'mdi:clock-fast',
    ];
    return (
      <section className="wish-v4-tab wish-v4-facts section-reveal">
        <header className="wish-v4-intro">
          <div>
            <span className="wish-v4-kicker">04 / FUN FACTS</span>
            <h2>The archive has a few odd little stories.</h2>
            <p>
              Small observations derived from the same records. No scoring—just the details that
              make the collection feel like yours.
            </p>
          </div>
          <div className="wish-v4-index wish-v4-index-yellow">
            <strong>{stats.funFacts.length}</strong>
            <span>OBSERVATIONS</span>
          </div>
        </header>

        <div className="wish-v4-fact-grid">
          {stats.funFacts.map((fact, index) => (
            <article
              key={`${fact}-${index}`}
              className={`wish-v4-fact-card ${index === 0 ? 'featured' : ''}`}
            >
              <div className="wish-v4-fact-top">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <Icon icon={icons[index % icons.length]} />
              </div>
              <p>{fact}</p>
              <div className="wish-v4-fact-rule" />
              <small>ARCHIVE NOTE</small>
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderAchievements = () => {
    const unlocked = stats.achievements.filter((achievement) => achievement.unlocked).length;
    const totalAchievements = stats.achievements.length;
    const completion = (unlocked / Math.max(totalAchievements, 1)) * 100;

    return (
      <section className="wish-v4-tab wish-v4-achievements section-reveal">
        <header className="wish-v4-intro">
          <div>
            <span className="wish-v4-kicker">05 / ACHIEVEMENTS</span>
            <h2>Milestones, made explicit.</h2>
            <p>
              Unlocked records get a clear signal. Locked records tell you what the archive still
              needs—without hiding anything behind a mystery badge.
            </p>
          </div>
          <div className="wish-v4-achievement-score">
            <strong>
              {unlocked}
              <small> / {totalAchievements}</small>
            </strong>
            <span>UNLOCKED</span>
            <div>
              <i style={{ width: `${completion}%` }} />
            </div>
          </div>
        </header>

        <div className="wish-v4-achievement-grid">
          {stats.achievements.map((achievement, index) => (
            <article
              key={`${achievement.title}-${index}`}
              className={`wish-v4-achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="wish-v4-achievement-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="wish-v4-achievement-icon">
                <Icon icon={achievement.icon} />
              </div>
              <div className="wish-v4-achievement-copy">
                <span>{achievement.unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
              </div>
              <div className="wish-v4-achievement-state">
                <Icon icon={achievement.unlocked ? 'mdi:check-bold' : 'mdi:lock-outline'} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  // Render Archive Tab
  const renderArchive = () => (
    <section className="wish-archive-tab section-reveal">
      {/* Archive Controls */}
      <div className="wish-controls">
        <div className="wish-controls-top">
          <div className="wish-view-controls">
            <button
              className={`wish-view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <Icon icon="mdi:format-list-bulleted" />
              Timeline
            </button>
            <button
              className={`wish-view-btn ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={() => setViewMode('gallery')}
            >
              <Icon icon="mdi:grid" />
              Gallery
            </button>
          </div>

          <div className="wish-search-wrapper">
            <Icon icon="mdi:search" className="wish-search-icon" />
            <input
              type="text"
              className="wish-search-input"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="wish-search-clear" onClick={() => setSearchQuery('')}>
                <Icon icon="mdi:close" />
              </button>
            )}
          </div>
        </div>

        <div className="wish-controls-bottom">
          <div className="wish-filter-chips">
            <span className="wish-filter-label">Year</span>
            {years.map((year) => (
              <button
                key={year}
                className={`wish-chip ${selectedYear === year ? 'active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year === 'all' ? 'All' : year}
              </button>
            ))}
          </div>

          <div className="wish-filter-chips">
            <span className="wish-filter-label">Element</span>
            {elements.map((element) => (
              <button
                key={element}
                className={`wish-chip ${selectedElement === element ? 'active' : ''}`}
                onClick={() => setSelectedElement(element)}
                style={
                  element !== 'all'
                    ? {
                        borderColor:
                          selectedElement === element
                            ? getElementColor(element)
                            : 'rgba(255,255,255,0.06)',
                      }
                    : {}
                }
              >
                {element === 'all' ? 'All' : element}
              </button>
            ))}
          </div>

          <div className="wish-filter-chips">
            <span className="wish-filter-label">Outcome</span>
            {outcomes.map((outcome) => (
              <button
                key={outcome}
                className={`wish-chip ${selectedOutcome === outcome ? 'active' : ''}`}
                onClick={() => setSelectedOutcome(outcome)}
              >
                {outcome === 'all' ? 'All' : outcome === 'won' ? '✓ Won' : '✗ Lost'}
              </button>
            ))}
          </div>

          <div className="wish-sort">
            <span className="wish-filter-label">Sort by</span>
            <select
              className="wish-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'version')}
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="version">Version</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="wish-content">
        {filteredCharacters.length === 0 ? (
          <div className="wish-empty">
            <Icon icon="mdi:emoticon-sad-outline" />
            <p>No characters match your current filters.</p>
            <button
              className="wish-empty-clear"
              onClick={() => {
                setSelectedYear('all');
                setSelectedElement('all');
                setSelectedOutcome('all');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="wish-timeline">
            {groupedByYear.map(([year, characters]) => (
              <div key={year} className="wish-timeline-year">
                <div className="wish-timeline-year-divider">
                  <h2 className="wish-timeline-year-label">{year}</h2>
                  <div className="wish-timeline-year-line" />
                  <div className="wish-timeline-year-stats">
                    <span>{characters.length} Characters</span>
                    <span>•</span>
                    <span>
                      {Math.round(
                        (characters.filter((c) => c.outcome === 'won').length / characters.length) *
                          100,
                      )}
                      % Win Rate
                    </span>
                  </div>
                </div>
                <div className="wish-timeline-entries">
                  {characters.map((character, index) => (
                    <TimelineEntry
                      key={character.id}
                      character={character}
                      index={index}
                      onClick={() => setSelectedCharacter(character)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="wish-gallery">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onClick={() => setSelectedCharacter(character)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="wish-archive-page">
      {/* Premium Background */}
      <div className="wish-bg">
        <div className="wish-bg-gradient" />
        <div className="wish-bg-particles">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="wish-bg-particle"
              style={
                {
                  '--delay': `${i * 0.3}s`,
                  '--x': `${10 + Math.random() * 80}%`,
                  '--y': `${10 + Math.random() * 80}%`,
                  '--size': `${1 + Math.random() * 3}px`,
                  '--duration': `${20 + Math.random() * 30}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="wish-archive-header">
        <button className="wish-back-button" onClick={() => navigate('/archive')}>
          <Icon icon="mdi:arrow-left" />
          Back to Archive
        </button>
      </div>

      {/* Hero Section */}
      <section className="wish-hero section-reveal">
        <div className="wish-hero-content">
          <div className="wish-hero-badge">✦ Collection</div>
          <h1 className="wish-hero-title">Wish Archive</h1>
          <p className="wish-hero-subtitle">
            A personal archive of every limited 5★ character I've obtained in Genshin Impact since
            2022.
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <TabNav tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

      {/* Tab Content */}
      <div className="wish-tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'heatmap' && renderHeatmap()}
        {activeTab === 'funfacts' && renderFunFacts()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'archive' && renderArchive()}
      </div>

      {/* Character Modal */}
      {selectedCharacter && (
        <CharacterModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />
      )}
    </div>
  );
};

export default WishArchivePage;
