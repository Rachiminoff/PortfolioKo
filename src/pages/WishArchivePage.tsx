import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';
import FullscreenLayout from '../layouts/FullscreenLayout';
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
    year: 'numeric'
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
    Cryo: '#7fc4e0'
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
    Cryo: 'mdi:snowflake'
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
const AnimatedCounter: React.FC<{ target: number; duration?: number; label?: string; suffix?: string; prefix?: string; className?: string }> = ({
  target,
  duration = 1500,
  label,
  suffix = '',
  prefix = '',
  className = ''
}) => {
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
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <div ref={ref} className={`animated-counter ${className}`}>
      <span className="animated-counter-value">{prefix}{count}{suffix}</span>
      {label && <span className="animated-counter-label">{label}</span>}
    </div>
  );
};

// Donut Chart
const DonutChart: React.FC<{ data: Record<string, number>; colors?: Record<string, string> }> = ({
  data,
  colors
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
    const size = Math.min(rect?.width || 200, 180);
    canvas.width = size;
    canvas.height = size;

    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 16;
    let startAngle = -Math.PI / 2;

    const elementColors: Record<string, string> = {
      Anemo: '#7ae0db',
      Geo: '#f9b55d',
      Electro: '#bb7ae0',
      Dendro: '#7eb870',
      Hydro: '#4a90d9',
      Pyro: '#e06040',
      Cryo: '#7fc4e0'
    };

    const entries = Object.entries(data);
    entries.forEach(([key, value]) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = colors?.[key] || elementColors[key] || 'rgba(255,255,255,0.04)';

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.fill();
      ctx.globalAlpha = 1;

      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = '#070707';
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
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasDrawn, drawChart]);

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
      { threshold: 0.2 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div ref={chartRef} className="bar-chart" style={{ height }}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const delay = index * 0.05;
        return (
          <div key={index} className="bar-chart-item">
            <div
              className="bar-chart-bar-wrapper"
              style={{ height: '100%' }}
            >
              <div
                className="bar-chart-bar"
                style={{
                  height: hasAnimated ? `${percentage}%` : '0%',
                  backgroundColor: item.color || 'rgba(255,255,255,0.04)',
                  transitionDelay: `${delay}s`,
                }}
              />
            </div>
            {showValues && (
              <span className="bar-chart-value">{item.value}</span>
            )}
            <span className="bar-chart-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Heat Map
const HeatMap: React.FC<{
  characters: WishCharacter[];
  year: number;
  onCellHover?: (date: string | null) => void;
}> = ({ characters, year, onCellHover }) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredCharacters, setHoveredCharacters] = useState<WishCharacter[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [year]);

  const getDaysInYear = (year: number) => {
    const date = new Date(year, 0, 1);
    const days = [];
    while (date.getFullYear() === year) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const getCharactersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return characters.filter(c => c.date_obtained === dateStr);
  };

  const getIntensity = (chars: WishCharacter[]) => {
    if (chars.length === 0) return 0;
    if (chars.length === 1) return 1;
    if (chars.length === 2) return 2;
    return 3;
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'rgba(255,255,255,0.02)';
      case 1: return 'rgba(122, 224, 219, 0.15)';
      case 2: return 'rgba(122, 224, 219, 0.3)';
      case 3: return 'rgba(122, 224, 219, 0.5)';
      default: return 'rgba(255,255,255,0.02)';
    }
  };

  const days = getDaysInYear(year);
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const firstDay = new Date(year, 0, 1).getDay();

  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(new Date(year, 0, 1 - firstDay + i));
  }

  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className={`heatmap-container ${isAnimating ? 'heatmap-animating' : ''}`}>
      <div className="heatmap-grid">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="heatmap-week">
            {week.map((day, dayIndex) => {
              const chars = getCharactersForDate(day);
              const intensity = getIntensity(chars);
              const isCurrentMonth = day.getFullYear() === year;
              const dateStr = day.toISOString().split('T')[0];
              const isHovered = hoveredDate === dateStr;

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="heatmap-cell"
                  style={{
                    backgroundColor: isCurrentMonth ? getIntensityColor(intensity) : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.2,
                    transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                    zIndex: isHovered ? 2 : 1,
                  }}
                  onMouseEnter={() => {
                    setHoveredDate(dateStr);
                    setHoveredCharacters(chars);
                    if (onCellHover) onCellHover(dateStr);
                  }}
                  onMouseLeave={() => {
                    setHoveredDate(null);
                    setHoveredCharacters([]);
                    if (onCellHover) onCellHover(null);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {hoveredDate && hoveredCharacters.length > 0 && (
        <div className="heatmap-tooltip">
          <div className="heatmap-tooltip-content">
            <span className="heatmap-tooltip-date">{formatDate(hoveredDate)}</span>
            {hoveredCharacters.map(c => (
              <div key={c.id} className="heatmap-tooltip-item">
                {c.artwork && (
                  <img
                    src={c.artwork}
                    alt={c.name}
                    className="heatmap-tooltip-portrait"
                  />
                )}
                <span className="heatmap-tooltip-name">{c.name}</span>
                <span
                  className="heatmap-tooltip-element"
                  style={{ color: getElementColor(c.element) }}
                >
                  <Icon icon={getElementIcon(c.element)} />
                </span>
                <span className={`heatmap-tooltip-outcome ${c.outcome}`}>
                  {c.outcome === 'won' ? '✓' : '✗'}
                </span>
                <span className="heatmap-tooltip-version">v{c.version}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        <div className="heatmap-legend-cells">
          <div className="heatmap-legend-cell" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
          <div className="heatmap-legend-cell" style={{ backgroundColor: 'rgba(122, 224, 219, 0.15)' }} />
          <div className="heatmap-legend-cell" style={{ backgroundColor: 'rgba(122, 224, 219, 0.3)' }} />
          <div className="heatmap-legend-cell" style={{ backgroundColor: 'rgba(122, 224, 219, 0.5)' }} />
        </div>
        <span className="heatmap-legend-label">More</span>
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
  const entryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (entryRef.current) {
      observer.observe(entryRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={entryRef}
      className="wish-timeline-entry-premium"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
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
    </div>
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
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="premium-card"
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
        <div className="wish-card-glow" style={{ background: `radial-gradient(circle, ${elementColor}22, transparent 70%)` }} />
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
  const [characters, setCharacters] = useState<WishCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
    const yearSet = new Set(characters.map(c => c.year));
    return ['all', ...Array.from(yearSet).sort((a, b) => b - a).map(String)];
  }, [characters]);

  const elements = useMemo(() => {
    const elementSet = new Set(characters.map(c => c.element));
    return ['all', ...Array.from(elementSet)];
  }, [characters]);

  const outcomes = ['all', 'won', 'lost'];

  const filteredCharacters = useMemo(() => {
    let filtered = [...characters];

    if (selectedYear !== 'all') {
      filtered = filtered.filter(c => c.year === Number(selectedYear));
    }

    if (selectedElement !== 'all') {
      filtered = filtered.filter(c => c.element === selectedElement);
    }

    if (selectedOutcome !== 'all') {
      filtered = filtered.filter(c => c.outcome === selectedOutcome);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.element.toLowerCase().includes(query) ||
        c.version.includes(query)
      );
    }

    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.date_obtained).getTime() - new Date(a.date_obtained).getTime());
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
    filteredCharacters.forEach(character => {
      if (!groups[character.year]) {
        groups[character.year] = [];
      }
      groups[character.year].push(character);
    });
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [filteredCharacters]);

  const stats: Stats = useMemo(() => {
    const total = characters.length;
    const wins = characters.filter(c => c.outcome === 'won').length;
    const losses = characters.filter(c => c.outcome === 'lost').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    const byYear: Record<number, YearData> = {};
    characters.forEach(c => {
      if (!byYear[c.year]) {
        byYear[c.year] = {
          total: 0,
          wins: 0,
          losses: 0,
          rate: 0,
          avgGap: 0,
          bestStreak: 0,
          characters: []
        };
      }
      byYear[c.year].total++;
      if (c.outcome === 'won') byYear[c.year].wins++;
      else byYear[c.year].losses++;
      byYear[c.year].characters.push(c.name);
    });

    Object.keys(byYear).forEach(year => {
      const y = byYear[Number(year)];
      y.rate = y.total > 0 ? (y.wins / y.total) * 100 : 0;

      let streak = 0;
      let bestStreak = 0;
      const yearChars = characters.filter(c => c.year === Number(year)).sort(
        (a, b) => new Date(a.date_obtained).getTime() - new Date(b.date_obtained).getTime()
      );
      yearChars.forEach(c => {
        if (c.outcome === 'won') {
          streak++;
          if (streak > bestStreak) bestStreak = streak;
        } else {
          streak = 0;
        }
      });
      y.bestStreak = bestStreak;

      const dates = yearChars.map(c => new Date(c.date_obtained));
      let gaps: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        gaps.push(Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)));
      }
      y.avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    });

    const byElement: Record<string, number> = {};
    characters.forEach(c => {
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
    characters.forEach(c => {
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

    const sortedByDate = [...characters].sort((a, b) =>
      new Date(a.date_obtained).getTime() - new Date(b.date_obtained).getTime()
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
      (a, b) => new Date(a.date_obtained).getTime() - new Date(b.date_obtained).getTime()
    );

    sortedForStreak.forEach(c => {
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

    let fiftyFiftyWins = 0;
    let guaranteedChars = 0;
    sortedForStreak.forEach((c, index) => {
      if (index === 0) {
        if (c.outcome === 'won') fiftyFiftyWins++;
        else guaranteedChars++;
      } else {
        if (c.outcome === 'won') fiftyFiftyWins++;
        else guaranteedChars++;
      }
    });

    const dateCounts: Record<string, number> = {};
    characters.forEach(c => {
      if (!dateCounts[c.date_obtained]) dateCounts[c.date_obtained] = 0;
      dateCounts[c.date_obtained]++;
    });
    const doubleDays = Object.values(dateCounts).filter(count => count >= 2).length;

    const activeYears = Object.keys(byYear).length;

    let busiestYear = 0;
    let maxYearCount = 0;
    Object.entries(byYear).forEach(([year, data]) => {
      if (data.total > maxYearCount) {
        maxYearCount = data.total;
        busiestYear = Number(year);
      }
    });

    const yearlyStats = Object.entries(byYear).map(([year, data]) => ({
      year: Number(year),
      total: data.total,
      wins: data.wins,
      losses: data.losses,
      rate: data.rate
    })).sort((a, b) => a.year - b.year);

    const versionStats = Object.entries(byVersion).map(([version, total]) => ({
      version,
      total
    })).sort((a, b) => a.version.localeCompare(b.version));

    let luckiestYear: YearStat | null = null;
    let unluckiestYear: YearStat | null = null;

    if (yearlyStats.length > 0) {
      let bestRate = -1;
      let worstRate = 101;
      let bestYear = 0;
      let worstYear = 0;

      yearlyStats.forEach(stat => {
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
      funFacts.push(`${luckiestYear.year} was your luckiest year with a ${luckiestYear.rate.toFixed(1)}% win rate.`);
    }
    if (unluckiestYear !== null) {
      funFacts.push(`${unluckiestYear.year} was your unluckiest year with a ${unluckiestYear.rate.toFixed(1)}% win rate.`);
    }
    if (mostCollectedElement) {
      funFacts.push(`${mostCollectedElement} is your most collected element (${maxCount} characters).`);
    }
    if (doubleDays > 0) {
      funFacts.push(`You obtained two or more limited characters on ${doubleDays} separate day${doubleDays > 1 ? 's' : ''}.`);
    }
    if (longestWinStreak > 0) {
      funFacts.push(`Your longest winning streak lasted ${longestWinStreak} banner${longestWinStreak > 1 ? 's' : ''}.`);
    }
    if (first && latest) {
      funFacts.push(`Your collection spans from Version ${first.version} to ${latest.version}.`);
    }
    funFacts.push(`You have collected characters across ${activeYears} major game version${activeYears > 1 ? 's' : ''}.`);
    if (versionsParticipated > 0) {
      funFacts.push(`You've pulled in ${versionsParticipated} different game versions.`);
    }
    if (longestGap > 0) {
      funFacts.push(`Your longest gap between pulls was ${longestGap} days.`);
    }

    const achievements: Achievement[] = [
      {
        icon: 'mdi:compass',
        title: 'First Steps',
        description: `Obtained your first limited 5★ character${first ? ` (${first.name})` : ''}.`,
        unlocked: total >= 1
      },
      {
        icon: 'mdi:star-four-points',
        title: 'Lucky Streak',
        description: `Won ${Math.min(longestWinStreak, 5)} consecutive 50/50s.`,
        unlocked: longestWinStreak >= 5
      },
      {
        icon: 'mdi:collection',
        title: 'Collector',
        description: `Reached ${total} limited characters.`,
        unlocked: total >= 25
      },
      {
        icon: 'mdi:clock',
        title: 'Veteran Traveler',
        description: `Active since ${first ? `Version ${first.version}` : 'the beginning'}.`,
        unlocked: activeYears >= 3
      },
      {
        icon: 'mdi:snowflake',
        title: 'Cryo Enthusiast',
        description: `${mostCollectedElement} is your most collected element.`,
        unlocked: mostCollectedElement === 'Cryo'
      },
      {
        icon: 'mdi:calendar',
        title: 'Double Acquisition',
        description: `Obtained two characters on the same day.`,
        unlocked: doubleDays > 0
      },
      {
        icon: 'mdi:trophy',
        title: 'Nine-Win Streak',
        description: `Won ${longestWinStreak} consecutive 50/50s.`,
        unlocked: longestWinStreak >= 9
      },
      {
        icon: 'mdi:progress-star',
        title: 'Collection Milestone',
        description: `Reached ${Math.floor(total / 10) * 10} characters.`,
        unlocked: total >= 10
      }
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
      achievements
    };
  }, [characters]);

  const CharacterModal = ({ character, onClose }: { character: WishCharacter; onClose: () => void }) => {
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
                  <span className="wish-modal-detail-value">{formatDate(character.date_obtained)}</span>
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
      <FullscreenLayout>
        <div className="wish-archive-page">
          <div className="wish-loading-state">
            <div className="wish-loading-spinner" />
            <p>Loading your journey</p>
          </div>
        </div>
      </FullscreenLayout>
    );
  }

  // Render Overview Tab
  const renderOverview = () => (
    <section className="wish-overview-tab section-reveal">
      <div className="wish-hero-stats">
        <div className="wish-hero-stat">
          <AnimatedCounter target={stats.total} label="Characters" />
        </div>
        <div className="wish-hero-stat">
          <AnimatedCounter target={Math.round(stats.winRate)} suffix="%" label="Win Rate" />
        </div>
        <div className="wish-hero-stat">
          <AnimatedCounter target={stats.wins} label="Wins" />
        </div>
        <div className="wish-hero-stat">
          <AnimatedCounter target={stats.activeYears} label="Active Years" />
        </div>
      </div>

      <div className="wish-hero-highlights">
        <div className="wish-hero-highlight">
          <Icon icon="mdi:calendar-range" />
          <span>{stats.first?.year || 2022} — {stats.latest?.year || new Date().getFullYear()}</span>
        </div>
        {stats.latest && (
          <div className="wish-hero-highlight">
            <Icon icon="mdi:star" />
            <span>Latest: {stats.latest.name}</span>
          </div>
        )}
        <div className="wish-hero-highlight">
          <Icon icon="mdi:percent" />
          <span>{Math.round(stats.winRate)}% Win Rate</span>
        </div>
        <div className="wish-hero-highlight">
          <Icon icon="mdi:chart-pie" />
          <span>{stats.elementDiversity} Elements</span>
        </div>
      </div>
    </section>
  );

  // Render Analytics Tab
  const renderAnalytics = () => (
    <section className="wish-analytics-tab section-reveal">
      <div className="wish-stats-dashboard">
        <div className="wish-stats-group">
          <h4 className="wish-stats-group-title">Luck</h4>
          <div className="wish-stats-dashboard-grid">
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:target" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{stats.longestWinStreak}</span>
                <span className="wish-stat-premium-label">Longest Win Streak</span>
              </div>
            </div>
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:star-circle" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{stats.fiftyFiftyWins}</span>
                <span className="wish-stat-premium-label">50/50 Wins</span>
              </div>
            </div>
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:chart-arc" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{Math.round(stats.winRate)}%</span>
                <span className="wish-stat-premium-label">Overall Win Rate</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wish-stats-group">
          <h4 className="wish-stats-group-title">Collection</h4>
          <div className="wish-stats-dashboard-grid">
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:crystal-ball" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{stats.mostCollectedElement || '-'}</span>
                <span className="wish-stat-premium-label">Most Collected Element</span>
              </div>
            </div>
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:chart-pie" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{stats.elementDiversity}</span>
                <span className="wish-stat-premium-label">Elements Collected</span>
              </div>
            </div>
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:gamepad-variant" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{stats.versionsParticipated}</span>
                <span className="wish-stat-premium-label">Versions Played</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wish-stats-group">
          <h4 className="wish-stats-group-title">Journey</h4>
          <div className="wish-stats-dashboard-grid">
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:clock-outline" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{Math.round(stats.avgGap)} days</span>
                <span className="wish-stat-premium-label">Avg Between Pulls</span>
              </div>
            </div>
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:calendar" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{stats.busiestYear || '-'}</span>
                <span className="wish-stat-premium-label">Busiest Year</span>
              </div>
            </div>
            <div className="wish-stat-premium">
              <div className="wish-stat-premium-icon">
                <Icon icon="mdi:chart-line" />
              </div>
              <div className="wish-stat-premium-content">
                <span className="wish-stat-premium-value">{stats.doubleDays}</span>
                <span className="wish-stat-premium-label">Double Pull Days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wish-charts-row">
          <div className="wish-chart-card">
            <h3 className="wish-chart-title">Element Distribution</h3>
            <DonutChart data={stats.byElement} />
          </div>
          <div className="wish-chart-card">
            <h3 className="wish-chart-title">Outcome Distribution</h3>
            <DonutChart
              data={{
                Won: stats.wins,
                Lost: stats.losses
              }}
              colors={{
                Won: 'rgba(126, 184, 112, 0.3)',
                Lost: 'rgba(224, 96, 64, 0.3)'
              }}
            />
          </div>
          <div className="wish-chart-card">
            <h3 className="wish-chart-title">Collection Progress</h3>
            <div className="wish-progress-ring">
              <svg viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="rgba(255,255,255,0.02)"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="6"
                  strokeDasharray={`${stats.collectionPercentage * 3.14} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="wish-progress-ring-content">
                <span className="wish-progress-ring-value">{Math.round(stats.collectionPercentage)}%</span>
                <span className="wish-progress-ring-label">Collected</span>
              </div>
            </div>
          </div>
          <div className="wish-chart-card">
            <h3 className="wish-chart-title">Characters by Year</h3>
            <BarChart
              data={stats.yearlyStats.map(stat => ({
                label: stat.year.toString(),
                value: stat.total,
                color: 'rgba(255,255,255,0.04)'
              }))}
              height={150}
            />
          </div>
        </div>

        <div className="wish-yearly-grid">
          {stats.yearlyStats.map(stat => {
            const yearData = stats.byYear[stat.year];
            const trend = stat.rate > (stats.yearlyStats.find(s => s.year === stat.year - 1)?.rate || 0) ? 'up' :
              stat.rate < (stats.yearlyStats.find(s => s.year === stat.year - 1)?.rate || 0) ? 'down' : 'same';
            const isBest = stat.rate === Math.max(...stats.yearlyStats.map(s => s.rate));
            const isWorst = stat.rate === Math.min(...stats.yearlyStats.map(s => s.rate));

            return (
              <div key={stat.year} className="wish-yearly-card">
                <div className="wish-yearly-header">
                  <h3>{stat.year}</h3>
                  <span className={`wish-yearly-trend ${trend}`}>
                    {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
                    {isBest && ' (Best)'}
                    {isWorst && ' (Worst)'}
                  </span>
                </div>
                <div className="wish-yearly-stats">
                  <div className="wish-yearly-stat">
                    <span className="wish-yearly-stat-value">{stat.total}</span>
                    <span className="wish-yearly-stat-label">Characters</span>
                  </div>
                  <div className="wish-yearly-stat">
                    <span className="wish-yearly-stat-value">{stat.wins}</span>
                    <span className="wish-yearly-stat-label">Wins</span>
                  </div>
                  <div className="wish-yearly-stat">
                    <span className="wish-yearly-stat-value">{stat.losses}</span>
                    <span className="wish-yearly-stat-label">Losses</span>
                  </div>
                  <div className="wish-yearly-stat">
                    <span className="wish-yearly-stat-value">{Math.round(stat.rate)}%</span>
                    <span className="wish-yearly-stat-label">Win Rate</span>
                  </div>
                </div>
                {yearData && (
                  <div className="wish-yearly-details">
                    <span>Avg {Math.round(yearData.avgGap)} days between pulls</span>
                    <span>Best streak: {yearData.bestStreak}</span>
                    <span className="wish-yearly-characters">
                      {yearData.characters.slice(0, 3).join(', ')}
                      {yearData.characters.length > 3 && ` +${yearData.characters.length - 3} more`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  // Render Heatmap Tab
  const renderHeatmap = () => (
    <section className="wish-heatmap-tab section-reveal">
      <div className="wish-heatmap-controls">
        <div className="wish-heatmap-year-selector">
          {years.filter(y => y !== 'all').map(year => (
            <button
              key={year}
              className={`wish-heatmap-year-btn ${heatmapYear === Number(year) ? 'active' : ''}`}
              onClick={() => setHeatmapYear(Number(year))}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      <HeatMap
        characters={characters}
        year={heatmapYear}
      />
    </section>
  );

  // Render Fun Facts Tab
  const renderFunFacts = () => (
    <section className="wish-funfacts-tab section-reveal">
      {stats.funFacts.length > 0 && (
        <div className="wish-fun-fact-featured">
          <div className="wish-fun-fact-featured-icon">
            <Icon icon="mdi:sparkle" />
          </div>
          <div className="wish-fun-fact-featured-content">
            <span className="wish-fun-fact-featured-label">Did You Know?</span>
            <p>{stats.funFacts[0]}</p>
          </div>
        </div>
      )}

      <div className="wish-fun-facts-grid">
        {stats.funFacts.slice(1).map((fact, index) => (
          <div key={index} className="wish-fun-fact-premium">
            <span className="wish-fun-fact-premium-icon">
              <Icon icon="mdi:star" />
            </span>
            <span>{fact}</span>
          </div>
        ))}
      </div>
    </section>
  );

  // Render Achievements Tab
  const renderAchievements = () => (
    <section className="wish-achievements-tab section-reveal">
      <div className="wish-achievements-grid">
        {stats.achievements.map((achievement, index) => (
          <div
            key={index}
            className={`wish-achievement-premium ${achievement.unlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="wish-achievement-premium-icon">
              <Icon icon={achievement.icon} />
              {!achievement.unlocked && (
                <div className="wish-achievement-lock">
                  <Icon icon="mdi:lock" />
                </div>
              )}
            </div>
            <div className="wish-achievement-premium-content">
              <h4>{achievement.title}</h4>
              <p>{achievement.description}</p>
            </div>
            <div className="wish-achievement-premium-badge">
              {achievement.unlocked ? '✓' : '?'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // Render Archive Tab
  const renderArchive = () => (
    <section className="wish-archive-tab section-reveal">
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
            <span className="wish-search-icon">
              <Icon icon="mdi:search" />
            </span>
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
            {years.map(year => (
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
            {elements.map(element => (
              <button
                key={element}
                className={`wish-chip ${selectedElement === element ? 'active' : ''}`}
                onClick={() => setSelectedElement(element)}
                style={element !== 'all' ? {
                  borderColor: selectedElement === element ? getElementColor(element) : 'rgba(255,255,255,0.02)'
                } : {}}
              >
                {element === 'all' ? 'All' : element}
              </button>
            ))}
          </div>

          <div className="wish-filter-chips">
            <span className="wish-filter-label">Outcome</span>
            {outcomes.map(outcome => (
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

      <div className="wish-content">
        {filteredCharacters.length === 0 ? (
          <div className="wish-empty">
            <Icon icon="mdi:emoticon-sad-outline" />
            <p>No characters match your current filters.</p>
            <button className="wish-empty-clear" onClick={() => {
              setSelectedYear('all');
              setSelectedElement('all');
              setSelectedOutcome('all');
              setSearchQuery('');
            }}>
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
                      {Math.round((characters.filter(c => c.outcome === 'won').length / characters.length) * 100)}% Win Rate
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
    <FullscreenLayout>
      <div className="wish-archive-page">
        {/* Premium Background */}
        <div className="wish-bg">
          <div className="wish-bg-grid" />
          <div className="wish-bg-vignette" />
          <div className="wish-bg-shapes">
            <div className="shape shape-1" />
            <div className="shape shape-2" />
            <div className="shape shape-3" />
          </div>
        </div>

        {/* Header */}
        <div className="wish-archive-header">
          <button className="wish-back-button" onClick={() => navigate('/archive')}>
            <Icon icon="mdi:arrow-left" />
            Back to Archive
          </button>
          <div className="wish-header-divider" />
          <span className="wish-header-title">Wish Archive</span>
          <div className="wish-header-badge">
            <span className="badge-dot" />
            <span>Collection</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="wish-hero section-reveal">
          <div className="wish-hero-content">
            <div className="wish-hero-badge">
              <span className="badge-icon">
                <Icon icon="mdi:star-four-points" />
              </span>
              Collection
            </div>
            <h1 className="wish-hero-title">Wish Archive</h1>
            <p className="wish-hero-subtitle">
              A personal archive of every limited 5★ character I've obtained in Genshin Impact since 2022.
            </p>
          </div>
          <div className="wish-hero-line" />
        </section>

        {/* Tab Navigation */}
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onSelect={setActiveTab}
        />

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
          <CharacterModal
            character={selectedCharacter}
            onClose={() => setSelectedCharacter(null)}
          />
        )}
      </div>
    </FullscreenLayout>
  );
};

export default WishArchivePage;