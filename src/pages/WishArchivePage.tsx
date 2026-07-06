import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  byYear: Record<number, YearData>;
  byElement: Record<string, number>;
  first: WishCharacter | null;
  latest: WishCharacter | null;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  luckiestYear: YearStat | null;
  unluckiestYear: YearStat | null;
  mostCollectedElement: string;
  leastCollectedElement: string;
  byVersion: Record<string, number>;
  busiestVersion: string;
  busiestYear: number;
  activeYears: number;
  avgGap: number;
  longestGap: number;
  shortestGap: number;
  doubleDays: number;
  fiftyFiftyWins: number;
  guaranteedChars: number;
  collectionPercentage: number;
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

// Premium Component: Animated Counter
const AnimatedCounter: React.FC<{ target: number; duration?: number; label?: string; suffix?: string }> = ({ 
  target, 
  duration = 1500, 
  label,
  suffix = ''
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
    <div ref={ref} className="animated-counter">
      <span className="animated-counter-value">{count}{suffix}</span>
      {label && <span className="animated-counter-label">{label}</span>}
    </div>
  );
};

// Premium Component: Donut Chart
const DonutChart: React.FC<{ data: Record<string, number>; colors?: Record<string, string> }> = ({ 
  data, 
  colors 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
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
  }, [hasAnimated]);

  const drawChart = () => {
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
      Cryo: '#7fc4e0'
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

    // Center hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
  };

  return (
    <div ref={ref} className="donut-chart">
      <canvas ref={canvasRef} />
    </div>
  );
};

// Components
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
      className="wish-card premium-card"
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
        <div className="wish-card-glow" style={{ background: `radial-gradient(circle, ${elementColor}44, transparent 70%)` }} />
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
  const [viewMode, setViewMode] = useState<'timeline' | 'gallery'>('timeline');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'version'>('date');
  const [selectedCharacter, setSelectedCharacter] = useState<WishCharacter | null>(null);

  // Fetch characters
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

  // Get unique years, elements
  const years = useMemo(() => {
    const yearSet = new Set(characters.map(c => c.year));
    return ['all', ...Array.from(yearSet).sort((a, b) => b - a).map(String)];
  }, [characters]);

  const elements = useMemo(() => {
    const elementSet = new Set(characters.map(c => c.element));
    return ['all', ...Array.from(elementSet)];
  }, [characters]);

  const outcomes = ['all', 'won', 'lost'];

  // Filter and sort characters
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

  // Group by year for timeline
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

  // Statistics
  const stats: Stats = useMemo(() => {
    const total = characters.length;
    const wins = characters.filter(c => c.outcome === 'won').length;
    const losses = characters.filter(c => c.outcome === 'lost').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    
    const byYear: Record<number, YearData> = {};
    characters.forEach(c => {
      if (!byYear[c.year]) {
        byYear[c.year] = { total: 0, wins: 0, losses: 0 };
      }
      byYear[c.year].total++;
      if (c.outcome === 'won') byYear[c.year].wins++;
      else byYear[c.year].losses++;
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

    const yearStats: Array<{year: number; rate: number}> = [];
    Object.entries(byYear).forEach(([year, data]) => {
      const rate = data.total > 0 ? (data.wins / data.total) * 100 : 0;
      yearStats.push({ year: Number(year), rate });
    });

    let luckiestYear: YearStat | null = null;
    let unluckiestYear: YearStat | null = null;
    
    if (yearStats.length > 0) {
      let bestRate = -1;
      let worstRate = 101;
      let bestYear = 0;
      let worstYear = 0;
      
      yearStats.forEach(stat => {
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

    const funFacts: string[] = [];
    if (luckiestYear !== null) {
      funFacts.push(`${luckiestYear.year} was your luckiest year with a ${luckiestYear.rate.toFixed(1)}% win rate.`);
    }
    if (unluckiestYear !== null) {
      funFacts.push(`${unluckiestYear.year} was your unluckiest year with a ${unluckiestYear.rate.toFixed(1)}% win rate.`);
    }
    if (mostCollectedElement) {
      funFacts.push(`${mostCollectedElement} is your most collected element.`);
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
      }
    ];

    return {
      total,
      wins,
      losses,
      winRate,
      byYear,
      byElement,
      first,
      latest,
      currentStreak,
      longestWinStreak,
      longestLoseStreak,
      luckiestYear,
      unluckiestYear,
      mostCollectedElement,
      leastCollectedElement,
      byVersion,
      busiestVersion,
      busiestYear,
      activeYears,
      avgGap,
      longestGap,
      shortestGap,
      doubleDays,
      fiftyFiftyWins,
      guaranteedChars,
      collectionPercentage,
      funFacts,
      achievements
    };
  }, [characters]);

  // Character detail modal
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
      <div className="wish-archive-page">
        <div className="wish-loading-state">
          <div className="wish-loading-spinner" />
          <p>Loading your journey...</p>
        </div>
      </div>
    );
  }

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
              style={{
                '--delay': `${i * 0.3}s`,
                '--x': `${10 + Math.random() * 80}%`,
                '--y': `${10 + Math.random() * 80}%`,
                '--size': `${1 + Math.random() * 3}px`,
                '--duration': `${20 + Math.random() * 30}s`
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="wish-archive-header">
        <button className="wish-back-button" onClick={() => navigate('/')}>
          <Icon icon="mdi:arrow-left" />
          Back to Home
        </button>
      </div>

      {/* Hero Section */}
      <section className="wish-hero">
        <div className="wish-hero-content">
          <div className="wish-hero-badge">✦ Collection</div>
          <h1 className="wish-hero-title">Wish Archive</h1>
          <p className="wish-hero-subtitle">
            A personal archive of every limited 5★ character I've obtained in Genshin Impact since 2022.
          </p>
        </div>

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
      </section>

      {/* Statistics Dashboard */}
      <section className="wish-stats-dashboard">
        <div className="wish-stats-dashboard-grid">
          <div className="wish-stat-premium">
            <div className="wish-stat-premium-icon">🎯</div>
            <div className="wish-stat-premium-content">
              <span className="wish-stat-premium-value">{stats.longestWinStreak}</span>
              <span className="wish-stat-premium-label">Longest Win Streak</span>
            </div>
          </div>
          <div className="wish-stat-premium">
            <div className="wish-stat-premium-icon">💫</div>
            <div className="wish-stat-premium-content">
              <span className="wish-stat-premium-value">{stats.fiftyFiftyWins}</span>
              <span className="wish-stat-premium-label">50/50 Wins</span>
            </div>
          </div>
          <div className="wish-stat-premium">
            <div className="wish-stat-premium-icon">📅</div>
            <div className="wish-stat-premium-content">
              <span className="wish-stat-premium-value">{stats.busiestYear || '-'}</span>
              <span className="wish-stat-premium-label">Busiest Year</span>
            </div>
          </div>
          <div className="wish-stat-premium">
            <div className="wish-stat-premium-icon">🔮</div>
            <div className="wish-stat-premium-content">
              <span className="wish-stat-premium-value">{stats.mostCollectedElement || '-'}</span>
              <span className="wish-stat-premium-label">Most Collected Element</span>
            </div>
          </div>
        </div>

        <div className="wish-charts-row">
          <div className="wish-chart-card">
            <h3 className="wish-chart-title">Element Distribution</h3>
            <DonutChart data={stats.byElement} />
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
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="6"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  strokeDasharray={`${stats.collectionPercentage * 3.14} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7ae0db" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#f9b55d" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="wish-progress-ring-content">
                <span className="wish-progress-ring-value">{Math.round(stats.collectionPercentage)}%</span>
                <span className="wish-progress-ring-label">Collected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fun Facts */}
      <section className="wish-section">
        <h2 className="wish-section-title">✦ Fun Facts</h2>
        <div className="wish-fun-facts-grid">
          {stats.funFacts.map((fact, index) => (
            <div key={index} className="wish-fun-fact-premium">
              <Icon icon="mdi:star" className="wish-fun-fact-premium-icon" />
              <span>{fact}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      {stats.achievements.filter(a => a.unlocked).length > 0 && (
        <section className="wish-section">
          <h2 className="wish-section-title">🏆 Achievements</h2>
          <div className="wish-achievements-grid">
            {stats.achievements.filter(a => a.unlocked).map((achievement, index) => (
              <div key={index} className="wish-achievement-premium">
                <div className="wish-achievement-premium-icon">
                  <Icon icon={achievement.icon} />
                </div>
                <div className="wish-achievement-premium-content">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                </div>
                <div className="wish-achievement-premium-badge">✓</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Controls */}
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
                  borderColor: selectedElement === element ? getElementColor(element) : 'rgba(255,255,255,0.06)'
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

      {/* Content */}
      <div className="wish-content">
        {filteredCharacters.length === 0 ? (
          <div className="wish-empty">
            <Icon icon="mdi:emoticon-sad-outline" />
            <p>No characters found matching your filters.</p>
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
                </div>
                <div className="wish-timeline-entries">
                  {characters.map((character, index) => {
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
                        key={character.id}
                        ref={entryRef}
                        className="wish-timeline-entry-premium"
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => setSelectedCharacter(character)}
                      >
                        <div className="wish-timeline-entry-connector">
                          <div className="wish-timeline-entry-dot" style={{ backgroundColor: elementColor }} />
                          {index < characters.length - 1 && <div className="wish-timeline-entry-line" style={{ borderColor: `${elementColor}33` }} />}
                        </div>
                        <div className="wish-timeline-entry-content">
                          <div className="wish-timeline-entry-header">
                            <div className="wish-timeline-entry-name">
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
                  })}
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

      {/* Character Modal */}
      {selectedCharacter && (
        <CharacterModal 
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
};

export default WishArchivePage;