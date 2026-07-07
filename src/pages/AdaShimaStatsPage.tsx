import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';
import FullscreenLayout from '../layouts/FullscreenLayout';
import './styles/AdaShimaStatsPage.scss';

// Types
interface VolumeData {
  id: number;
  title: string;
  volume_number: string;
  chapters: number;
  page_count: number;
  page_range: string;
  jp_release: string;
  en_completion: string | null;
  jp_en_gap_days: number;
  jp_release_gap: string;
  tl_release_gap: string;
  volume_weight: number;
  is_special: boolean;
  is_short_story: boolean;
  is_upcoming: boolean;
  created_at?: string;
}

interface Achievement {
  icon: string;
  title: string;
  value: string;
  volume: string;
  description: string;
  color: string;
}

interface FunFact {
  icon: string;
  label: string;
  value: string;
  description?: string;
}

// Helper functions
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getVolumeLabel = (volume: VolumeData): string => {
  return `#${volume.volume_number} ${volume.title}`;
};

// Animated Counter Component
const AnimatedCounter: React.FC<{ target: number; label: string; suffix?: string }> = ({
  target,
  label,
  suffix = '',
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let start = 0;
            const duration = 2000;
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
  }, [target]);

  return (
    <div ref={ref} className="hero-stat">
      <span className="hero-stat-value">{count}{suffix}</span>
      <span className="hero-stat-label">{label}</span>
    </div>
  );
};

// Main Component
const AdaShimaStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [volumes, setVolumes] = useState<VolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedVolume, setExpandedVolume] = useState<number | null>(null);
  const [sortDelay, setSortDelay] = useState<'default' | 'longest' | 'shortest'>('default');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'main' | 'short' | 'special' | 'upcoming'>('all');

  // Compare state
  const [compareVolume1, setCompareVolume1] = useState<number | null>(null);
  const [compareVolume2, setCompareVolume2] = useState<number | null>(null);

  // Achievement Easter Egg state
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [easterEggMessage, setEasterEggMessage] = useState('');

  const [statsSummary, setStatsSummary] = useState({
    totalVolumes: 0,
    totalChapters: 0,
    totalPages: 0,
    avgPagesPerVolume: 0,
    avgChaptersPerVolume: 0,
    mostPagesVolume: '',
    mostPagesCount: 0,
    leastPagesVolume: '',
    leastPagesCount: 0,
    fastestTranslationDays: 0,
    fastestTranslationVolume: '',
    slowestTranslationDays: 0,
    slowestTranslationVolume: '',
    avgTranslationDays: 0,
    volumesAboveAvgLength: 0,
    volumesBelowAvgLength: 0,
    publicationStart: '',
    publicationEnd: '',
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [funFacts, setFunFacts] = useState<FunFact[]>([]);
  const [publicationGaps, setPublicationGaps] = useState<{ from: string; to: string; days: number }[]>([]);
  const [gapStats, setGapStats] = useState({ avg: 0, longest: 0, shortest: 0, longestVolume: '', shortestVolume: '' });

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const calculateStats = useCallback((data: VolumeData[]) => {
    const activeVolumes = data.filter(v => !v.is_upcoming && v.page_count > 0);
    const totalVolumes = data.length;
    const totalChapters = activeVolumes.reduce((sum, v) => sum + v.chapters, 0);
    const totalPages = activeVolumes.reduce((sum, v) => sum + v.page_count, 0);
    const avgPagesPerVolume = Math.round(totalPages / activeVolumes.length);
    const avgChaptersPerVolume = Math.round(totalChapters / activeVolumes.length);

    let mostPages = activeVolumes.reduce((max, v) => v.page_count > max.page_count ? v : max, activeVolumes[0] || { page_count: 0, title: '' } as VolumeData);
    let leastPages = activeVolumes.reduce((min, v) => v.page_count < min.page_count ? v : min, activeVolumes[0] || { page_count: Infinity, title: '' } as VolumeData);

    const translated = activeVolumes.filter(v => v.jp_en_gap_days > 0);
    let fastest = translated.reduce((min, v) => v.jp_en_gap_days < min.jp_en_gap_days ? v : min, translated[0] || { jp_en_gap_days: Infinity, title: '' } as VolumeData);
    let slowest = translated.reduce((max, v) => v.jp_en_gap_days > max.jp_en_gap_days ? v : max, translated[0] || { jp_en_gap_days: 0, title: '' } as VolumeData);
    const avgTranslationDays = Math.round(translated.reduce((sum, v) => sum + v.jp_en_gap_days, 0) / translated.length);

    const volumesAboveAvgLength = activeVolumes.filter(v => v.page_count > avgPagesPerVolume).length;
    const volumesBelowAvgLength = activeVolumes.filter(v => v.page_count < avgPagesPerVolume).length;

    const dates = activeVolumes.map(v => new Date(v.jp_release));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Calculate publication gaps
    const sortedByDate = [...activeVolumes].sort((a, b) => 
      new Date(a.jp_release).getTime() - new Date(b.jp_release).getTime()
    );
    const gaps: { from: string; to: string; days: number }[] = [];
    for (let i = 1; i < sortedByDate.length; i++) {
      const prev = new Date(sortedByDate[i - 1].jp_release);
      const curr = new Date(sortedByDate[i].jp_release);
      const days = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      gaps.push({
        from: sortedByDate[i - 1].volume_number,
        to: sortedByDate[i].volume_number,
        days
      });
    }

    const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((sum, g) => sum + g.days, 0) / gaps.length) : 0;
    const longestGap = gaps.length > 0 ? Math.max(...gaps.map(g => g.days)) : 0;
    const shortestGap = gaps.length > 0 ? Math.min(...gaps.map(g => g.days)) : 0;
    const longestGapEntry = gaps.find(g => g.days === longestGap);
    const shortestGapEntry = gaps.find(g => g.days === shortestGap);

    setGapStats({
      avg: avgGap,
      longest: longestGap,
      shortest: shortestGap,
      longestVolume: longestGapEntry ? `${longestGapEntry.from} → ${longestGapEntry.to}` : '',
      shortestVolume: shortestGapEntry ? `${shortestGapEntry.from} → ${shortestGapEntry.to}` : '',
    });
    setPublicationGaps(gaps);

    setStatsSummary({
      totalVolumes,
      totalChapters,
      totalPages,
      avgPagesPerVolume,
      avgChaptersPerVolume,
      mostPagesVolume: mostPages.title || '',
      mostPagesCount: mostPages.page_count || 0,
      leastPagesVolume: leastPages.title || '',
      leastPagesCount: leastPages.page_count || 0,
      fastestTranslationDays: fastest.jp_en_gap_days || 0,
      fastestTranslationVolume: fastest.title || '',
      slowestTranslationDays: slowest.jp_en_gap_days || 0,
      slowestTranslationVolume: slowest.title || '',
      avgTranslationDays,
      volumesAboveAvgLength,
      volumesBelowAvgLength,
      publicationStart: minDate.getFullYear().toString(),
      publicationEnd: maxDate.getFullYear().toString(),
    });

    // Calculate achievements
    const sortedByPages = [...activeVolumes].sort((a, b) => b.page_count - a.page_count);
    const sortedByChapters = [...activeVolumes].sort((a, b) => b.chapters - a.chapters);
    const sortedByDelay = [...translated].sort((a, b) => a.jp_en_gap_days - b.jp_en_gap_days);

    const achievementList: Achievement[] = [
      {
        icon: 'mdi:book-open-variant',
        title: 'Largest Volume',
        value: `${mostPages.page_count} pages`,
        volume: mostPages.title,
        description: `The largest volume in the series`,
        color: '#f9b55d',
      },
      {
        icon: 'mdi:book-open-variant',
        title: 'Smallest Volume',
        value: `${leastPages.page_count} pages`,
        volume: leastPages.title,
        description: `The smallest volume in the series`,
        color: '#7fc4e0',
      },
      {
        icon: 'mdi:rocket-launch',
        title: 'Fastest Translation',
        value: `${fastest.jp_en_gap_days} days`,
        volume: fastest.title,
        description: `Quickest English translation`,
        color: '#7eb870',
      },
      {
        icon: 'mdi:turtle',
        title: 'Slowest Translation',
        value: `${slowest.jp_en_gap_days} days`,
        volume: slowest.title,
        description: `Longest English translation wait`,
        color: '#e06040',
      },
      {
        icon: 'mdi:format-list-numbered',
        title: 'Most Chapters',
        value: `${sortedByChapters[0]?.chapters || 0} chapters`,
        volume: sortedByChapters[0]?.title || '',
        description: `Highest chapter count`,
        color: '#6366f1',
      },
      {
        icon: 'mdi:calendar-range',
        title: 'Longest Publication Gap',
        value: `${longestGap} days`,
        volume: longestGapEntry ? `${longestGapEntry.from} → ${longestGapEntry.to}` : '',
        description: `Longest wait between volumes`,
        color: '#e06040',
      },
      {
        icon: 'mdi:calendar-clock',
        title: 'Shortest Publication Gap',
        value: `${shortestGap} days`,
        volume: shortestGapEntry ? `${shortestGapEntry.from} → ${shortestGapEntry.to}` : '',
        description: `Shortest wait between volumes`,
        color: '#7eb870',
      },
    ];
    setAchievements(achievementList);

    // Calculate fun facts
    const funFactList: FunFact[] = [
      {
        icon: 'mdi:percent',
        label: 'Collection Progress',
        value: `${Math.round((activeVolumes.length / data.length) * 100)}%`,
        description: `${activeVolumes.length} of ${data.length} volumes released`,
      },
      {
        icon: 'mdi:clock-outline',
        label: 'Average Translation Delay',
        value: `${avgTranslationDays} days`,
        description: `Across ${translated.length} volumes`,
      },
      {
        icon: 'mdi:calendar-range',
        label: 'Total Publication Span',
        value: `${minDate.getFullYear()} — ${maxDate.getFullYear()}`,
        description: `${maxDate.getFullYear() - minDate.getFullYear() + 1} years`,
      },
      {
        icon: 'mdi:chart-arc',
        label: 'Average Release Interval',
        value: `${avgGap} days`,
        description: `Between Japanese releases`,
      },
      {
        icon: 'mdi:arrow-up-bold',
        label: 'Largest Page Increase',
        value: (() => {
          let maxIncrease = 0;
          let maxIncreaseVol = '';
          for (let i = 1; i < sortedByDate.length; i++) {
            const diff = sortedByDate[i].page_count - sortedByDate[i - 1].page_count;
            if (diff > maxIncrease) {
              maxIncrease = diff;
              maxIncreaseVol = sortedByDate[i].title;
            }
          }
          return `${maxIncrease} pages (${maxIncreaseVol})`;
        })(),
        description: 'Biggest jump in page count',
      },
      {
        icon: 'mdi:format-list-numbered',
        label: 'Volumes Above Average',
        value: `${volumesAboveAvgLength} volumes`,
        description: `Out of ${activeVolumes.length} released volumes`,
      },
    ];
    setFunFacts(funFactList);

  }, []);

  const fetchVolumes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('adashima_volumes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching Adashima volumes:', error);
    } else if (data) {
      setVolumes(data);
      calculateStats(data);
    }
    setLoading(false);
  }, [calculateStats]);

  useEffect(() => {
    fetchVolumes();
  }, [fetchVolumes]);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'translation', label: 'Translation' },
    { id: 'charts', label: 'Charts' },
    { id: 'compare', label: 'Compare' },
    { id: 'volumes', label: 'Volumes' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'funfacts', label: 'Fun Facts' },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-50px 0px -50px 0px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isLoaded, volumes]);

  // Filtered volumes for Volume Explorer
  const filteredVolumes = useMemo(() => {
    let filtered = [...volumes];
    
    // Apply type filter
    if (filterType === 'main') {
      filtered = filtered.filter(v => !v.is_short_story && !v.is_special && !v.is_upcoming);
    } else if (filterType === 'short') {
      filtered = filtered.filter(v => v.is_short_story);
    } else if (filterType === 'special') {
      filtered = filtered.filter(v => v.is_special);
    } else if (filterType === 'upcoming') {
      filtered = filtered.filter(v => v.is_upcoming);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.volume_number.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [volumes, filterType, searchQuery]);

  // Get max values for progress bars
  const maxPages = Math.max(...volumes.filter(v => v.page_count > 0).map(v => v.page_count));
  const maxDelay = Math.max(...volumes.filter(v => v.jp_en_gap_days > 0).map(v => v.jp_en_gap_days));

  // Rank calculations
  const getRank = (volume: VolumeData, metric: 'pages' | 'chapters' | 'delay'): string => {
    const activeVolumes = volumes.filter(v => !v.is_upcoming && v.page_count > 0);
    if (metric === 'pages') {
      const sorted = [...activeVolumes].sort((a, b) => b.page_count - a.page_count);
      const rank = sorted.findIndex(v => v.id === volume.id) + 1;
      if (rank === 1) return '#1 Longest';
      if (rank === 2) return '#2 Longest';
      if (rank === 3) return '#3 Longest';
      if (rank === sorted.length) return 'Shortest';
      return `#${rank}`;
    } else if (metric === 'chapters') {
      const sorted = [...activeVolumes].sort((a, b) => b.chapters - a.chapters);
      const rank = sorted.findIndex(v => v.id === volume.id) + 1;
      if (rank === 1) return '#1 Most Chapters';
      if (rank === 2) return '#2 Most Chapters';
      if (rank === 3) return '#3 Most Chapters';
      return `#${rank}`;
    } else if (metric === 'delay') {
      const translated = activeVolumes.filter(v => v.jp_en_gap_days > 0);
      const sorted = [...translated].sort((a, b) => a.jp_en_gap_days - b.jp_en_gap_days);
      const rank = sorted.findIndex(v => v.id === volume.id) + 1;
      if (rank === 1) return 'Fastest';
      if (rank === sorted.length) return 'Slowest';
      return `#${rank}`;
    }
    return '';
  };

  // Percentile calculation
  const getPercentile = (volume: VolumeData, metric: 'pages' | 'chapters'): number => {
    const activeVolumes = volumes.filter(v => !v.is_upcoming && v.page_count > 0);
    const values = activeVolumes.map(v => metric === 'pages' ? v.page_count : v.chapters);
    const sorted = [...values].sort((a, b) => a - b);
    const value = metric === 'pages' ? volume.page_count : volume.chapters;
    const index = sorted.indexOf(value);
    return Math.round(((index + 1) / sorted.length) * 100);
  };

  // Easter egg handler
  const handleEasterEggClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      setEasterEggMessage('You found a secret! Adachi and Shimamura approve!');
      setShowEasterEgg(true);
      setTimeout(() => {
        setShowEasterEgg(false);
        setClickCount(0);
      }, 3000);
    } else if (newCount > 5) {
      setClickCount(0);
    }
  };

  // Loading state
  if (loading) {
    return (
      <FullscreenLayout>
        <div className="adashima-stats-page loading">
          <div className="stats-loading-state">
            <div className="stats-loading-spinner" />
            <p>Loading statistics...</p>
          </div>
        </div>
      </FullscreenLayout>
    );
  }

  // Get sorted volumes for translation section
  const activeVolumes = volumes.filter(v => v.jp_en_gap_days > 0);
  const sortedVolumes = [...activeVolumes].sort((a, b) => {
    if (sortDelay === 'longest') return b.jp_en_gap_days - a.jp_en_gap_days;
    if (sortDelay === 'shortest') return a.jp_en_gap_days - b.jp_en_gap_days;
    return a.id - b.id;
  });

  const maxDelayValue = Math.max(...activeVolumes.map(v => v.jp_en_gap_days));
  const maxPagesValue = Math.max(...volumes.filter(v => v.page_count > 0).map(v => v.page_count));
  const maxChaptersValue = Math.max(...volumes.filter(v => v.page_count > 0).map(v => v.chapters));

  // Static fun facts for display (combined with dynamic ones)
  const staticFunFacts = [
    {
      icon: 'mdi:book-open-variant',
      title: 'Largest Volume',
      value: `${statsSummary.mostPagesCount} pages`,
      description: statsSummary.mostPagesVolume,
      color: '#f9b55d',
    },
    {
      icon: 'mdi:book-open-variant',
      title: 'Smallest Volume',
      value: `${statsSummary.leastPagesCount} pages`,
      description: statsSummary.leastPagesVolume,
      color: '#7fc4e0',
    },
    {
      icon: 'mdi:rocket-launch',
      title: 'Fastest Translation',
      value: `${statsSummary.fastestTranslationDays} days`,
      description: statsSummary.fastestTranslationVolume,
      color: '#7eb870',
    },
    {
      icon: 'mdi:turtle',
      title: 'Slowest Translation',
      value: `${statsSummary.slowestTranslationDays} days`,
      description: statsSummary.slowestTranslationVolume,
      color: '#e06040',
    },
    {
      icon: 'mdi:format-list-numbered',
      title: 'Average Chapters',
      value: `${statsSummary.avgChaptersPerVolume} chapters`,
      description: 'Per volume',
      color: '#6366f1',
    },
    {
      icon: 'mdi:calendar-range',
      title: 'Publication Span',
      value: `${statsSummary.publicationStart} — ${statsSummary.publicationEnd}`,
      description: `${parseInt(statsSummary.publicationEnd) - parseInt(statsSummary.publicationStart) + 1} years`,
      color: '#8b5cf6',
    },
  ];

  // Chart data calculations
  const cumulativePages = useMemo(() => {
    const sorted = [...volumes].filter(v => !v.is_upcoming && v.page_count > 0)
      .sort((a, b) => new Date(a.jp_release).getTime() - new Date(b.jp_release).getTime());
    let runningTotal = 0;
    return sorted.map(v => {
      runningTotal += v.page_count;
      return { volume: v.volume_number, pages: runningTotal };
    });
  }, [volumes]);

  const delayTrendData = useMemo(() => {
    return [...volumes]
      .filter(v => !v.is_upcoming && v.jp_en_gap_days > 0)
      .sort((a, b) => new Date(a.jp_release).getTime() - new Date(b.jp_release).getTime())
      .map(v => ({
        volume: v.volume_number,
        delay: v.jp_en_gap_days,
        title: v.title,
      }));
  }, [volumes]);

  const scatterData = useMemo(() => {
    return volumes
      .filter(v => !v.is_upcoming && v.page_count > 0 && v.jp_en_gap_days > 0)
      .map(v => ({
        pages: v.page_count,
        delay: v.jp_en_gap_days,
        title: v.title,
        volume: v.volume_number,
      }));
  }, [volumes]);

  const categoryBreakdown = useMemo(() => {
    const main = volumes.filter(v => !v.is_short_story && !v.is_special && !v.is_upcoming).length;
    const short = volumes.filter(v => v.is_short_story).length;
    const special = volumes.filter(v => v.is_special).length;
    const upcoming = volumes.filter(v => v.is_upcoming).length;
    return { main, short, special, upcoming };
  }, [volumes]);

  // Comparison logic
  const compareVol1 = volumes.find(v => v.id === compareVolume1);
  const compareVol2 = volumes.find(v => v.id === compareVolume2);

  return (
    <FullscreenLayout>
      <div className={`adashima-stats-page ${isLoaded ? 'loaded' : ''}`}>
        {/* Background Effects */}
        <div className="stats-bg">
          <div className="stats-bg-gradient" />
          <div className="stats-bg-particles">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="stats-bg-particle"
                style={{
                  '--delay': `${i * 0.3}s`,
                  '--x': `${10 + Math.random() * 80}%`,
                  '--y': `${10 + Math.random() * 80}%`,
                  '--size': `${1 + Math.random() * 3}px`,
                  '--duration': `${20 + Math.random() * 30}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="stats-header">
          <button className="stats-back-button" onClick={() => navigate('/archive')}>
            <Icon icon="mdi:arrow-left" />
            Back to Archive
          </button>
        </div>

        {/* Navigation */}
        <nav className="stats-nav">
          <div className="stats-nav-inner">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`stats-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => scrollToSection(section.id)}
              >
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Easter Egg */}
        {showEasterEgg && (
          <div className="easter-egg-popup">
            <Icon icon="mdi:star" />
            <span>{easterEggMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="stats-content">
          {/* HERO SECTION */}
          <div ref={(el) => { sectionRefs.current.overview = el; }} data-section="overview">
            <section className="hero-section section-reveal" onClick={handleEasterEggClick}>
              <div className="hero-content">
                <div className="hero-badge">Statistics</div>
                <h1 className="hero-title">Adachi and Shimamura</h1>
                <p className="hero-subtitle">
                  An interactive statistics archive exploring the publication history,
                  translation timeline, and structure of the entire series.
                </p>

                <div className="hero-stats-grid">
                  <AnimatedCounter target={statsSummary.totalVolumes} label="Total Volumes" />
                  <AnimatedCounter target={statsSummary.totalChapters} label="Total Chapters" />
                  <AnimatedCounter target={statsSummary.totalPages} label="Total Pages" />
                  <AnimatedCounter
                    target={parseInt(statsSummary.publicationEnd) - parseInt(statsSummary.publicationStart) + 1}
                    label="Years Active"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* DASHBOARD SECTION */}
          <div ref={(el) => { sectionRefs.current.dashboard = el; }} data-section="dashboard">
            <section className="dashboard-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Overview Dashboard</h2>
                <p className="section-subtitle">Key statistics at a glance</p>
              </div>

              <div className="dashboard-grid">
                {[
                  {
                    icon: 'mdi:book-open-variant',
                    title: 'Average Pages',
                    value: `${statsSummary.avgPagesPerVolume} pages`,
                    description: 'Per volume',
                    color: '#6366f1',
                  },
                  {
                    icon: 'mdi:format-list-numbered',
                    title: 'Average Chapters',
                    value: `${statsSummary.avgChaptersPerVolume} chapters`,
                    description: 'Per volume',
                    color: '#8b5cf6',
                  },
                  {
                    icon: 'mdi:rocket-launch',
                    title: 'Fastest Translation',
                    value: `${statsSummary.fastestTranslationDays} days`,
                    description: statsSummary.fastestTranslationVolume,
                    color: '#7eb870',
                  },
                  {
                    icon: 'mdi:turtle',
                    title: 'Slowest Translation',
                    value: `${statsSummary.slowestTranslationDays} days`,
                    description: statsSummary.slowestTranslationVolume,
                    color: '#e06040',
                  },
                  {
                    icon: 'mdi:arrow-up-bold',
                    title: 'Largest Volume',
                    value: `${statsSummary.mostPagesCount} pages`,
                    description: statsSummary.mostPagesVolume,
                    color: '#f9b55d',
                  },
                  {
                    icon: 'mdi:arrow-down-bold',
                    title: 'Smallest Volume',
                    value: `${statsSummary.leastPagesCount} pages`,
                    description: statsSummary.leastPagesVolume,
                    color: '#7fc4e0',
                  },
                  {
                    icon: 'mdi:chart-line',
                    title: 'Average Translation Delay',
                    value: `${statsSummary.avgTranslationDays} days`,
                    description: 'Across all translated volumes',
                    color: '#818cf8',
                  },
                  {
                    icon: 'mdi:calendar-range',
                    title: 'Volumes Above Average',
                    value: `${statsSummary.volumesAboveAvgLength} volumes`,
                    description: `Out of ${volumes.filter(v => !v.is_upcoming && v.page_count > 0).length} released`,
                    color: '#a78bfa',
                  },
                ].map((card, index) => (
                  <div
                    key={index}
                    className="dashboard-card stagger-card"
                    style={{ '--card-color': card.color } as React.CSSProperties}
                  >
                    <div className="dashboard-card-icon">
                      <Icon icon={card.icon} />
                    </div>
                    <div className="dashboard-card-content">
                      <span className="dashboard-card-value">{card.value}</span>
                      <span className="dashboard-card-title">{card.title}</span>
                      <span className="dashboard-card-description">{card.description}</span>
                    </div>
                    <div className="dashboard-card-glow" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* TIMELINE SECTION */}
          <div ref={(el) => { sectionRefs.current.timeline = el; }} data-section="timeline">
            <section className="timeline-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Release Timeline</h2>
                <p className="section-subtitle">Every volume as a milestone</p>
              </div>

              <div className="timeline-container">
                {volumes.filter(v => !v.is_upcoming).map((volume, index, arr) => {
                  const isFirst = index === 0;
                  const isLast = index === arr.length - 1;
                  const gap = index > 0 ? Math.floor(
                    (new Date(volume.jp_release).getTime() - new Date(arr[index - 1].jp_release).getTime()) / 
                    (1000 * 60 * 60 * 24)
                  ) : 0;

                  return (
                    <div key={volume.id} className="timeline-item stagger-card">
                      <div className="timeline-item-connector">
                        <div
                          className={`timeline-item-dot ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''}`}
                          style={{
                            backgroundColor: volume.is_short_story ? '#8b5cf6' : 
                                           volume.is_special ? '#f9b55d' : '#6366f1',
                          }}
                        />
                        {index < arr.length - 1 && (
                          <div className="timeline-item-line" />
                        )}
                      </div>

                      <div className="timeline-item-content">
                        <div className="timeline-item-header">
                          <div className="timeline-item-title">
                            <h3>{volume.title}</h3>
                            {volume.is_special && (
                              <span className="timeline-item-badge special">Special</span>
                            )}
                            {volume.is_short_story && (
                              <span className="timeline-item-badge short">Short Story</span>
                            )}
                            {isFirst && (
                              <span className="timeline-item-badge milestone">First</span>
                            )}
                            {isLast && (
                              <span className="timeline-item-badge milestone">Latest</span>
                            )}
                          </div>
                          <span className="timeline-item-number">
                            #{volume.volume_number}
                          </span>
                        </div>

                        <div className="timeline-item-details">
                          <div className="timeline-item-detail">
                            <Icon icon="mdi:calendar" />
                            <span>JP: {formatDate(volume.jp_release)}</span>
                          </div>
                          {volume.en_completion && (
                            <div className="timeline-item-detail">
                              <Icon icon="mdi:calendar-check" />
                              <span>EN: {formatDate(volume.en_completion)}</span>
                            </div>
                          )}
                          <div className="timeline-item-detail">
                            <Icon icon="mdi:pages" />
                            <span>{volume.page_count} pages</span>
                          </div>
                          <div className="timeline-item-detail">
                            <Icon icon="mdi:format-list-numbered" />
                            <span>{volume.chapters} chapters</span>
                          </div>
                          {volume.jp_en_gap_days > 0 && (
                            <div className="timeline-item-detail">
                              <Icon icon="mdi:clock-outline" />
                              <span>{volume.jp_en_gap_days} days delay</span>
                            </div>
                          )}
                          {gap > 0 && index > 0 && (
                            <div className="timeline-item-detail gap">
                              <Icon icon="mdi:arrow-right" />
                              <span>{gap} days since previous</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Publication Gap Summary */}
              <div className="gap-summary">
                <div className="gap-stat">
                  <span className="gap-stat-value">{gapStats.avg} days</span>
                  <span className="gap-stat-label">Average Release Interval</span>
                </div>
                <div className="gap-stat">
                  <span className="gap-stat-value">{gapStats.longest} days</span>
                  <span className="gap-stat-label">Longest Gap</span>
                  <span className="gap-stat-desc">{gapStats.longestVolume}</span>
                </div>
                <div className="gap-stat">
                  <span className="gap-stat-value">{gapStats.shortest} days</span>
                  <span className="gap-stat-label">Shortest Gap</span>
                  <span className="gap-stat-desc">{gapStats.shortestVolume}</span>
                </div>
              </div>
            </section>
          </div>

          {/* TRANSLATION DELAY SECTION */}
          <div ref={(el) => { sectionRefs.current.translation = el; }} data-section="translation">
            <section className="translation-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Translation Delay</h2>
                <p className="section-subtitle">Time between JP release and EN completion</p>
              </div>

              <div className="translation-controls">
                <div className="translation-sort">
                  <span className="translation-sort-label">Sort by:</span>
                  <button
                    className={`translation-sort-btn ${sortDelay === 'default' ? 'active' : ''}`}
                    onClick={() => setSortDelay('default')}
                  >
                    Release Order
                  </button>
                  <button
                    className={`translation-sort-btn ${sortDelay === 'longest' ? 'active' : ''}`}
                    onClick={() => setSortDelay('longest')}
                  >
                    Longest Delay
                  </button>
                  <button
                    className={`translation-sort-btn ${sortDelay === 'shortest' ? 'active' : ''}`}
                    onClick={() => setSortDelay('shortest')}
                  >
                    Shortest Delay
                  </button>
                </div>
              </div>

              <div className="translation-list">
                {sortedVolumes.map((volume) => {
                  const percentage = (volume.jp_en_gap_days / maxDelayValue) * 100;
                  const isFast = volume.jp_en_gap_days < 100;
                  const isSlow = volume.jp_en_gap_days > 1000;
                  const rank = getRank(volume, 'delay');

                  return (
                    <div key={volume.id} className="translation-item stagger-card">
                      <div className="translation-item-info">
                        <span className="translation-item-title">
                          {volume.title}
                          {volume.is_special && <span className="badge-special">Special</span>}
                          {volume.is_short_story && <span className="badge-short">Short Story</span>}
                          {rank && <span className="badge-rank">{rank}</span>}
                        </span>
                        <span className="translation-item-days">
                          {volume.jp_en_gap_days} days
                          {isFast && <span className="badge-fast">Fast</span>}
                          {isSlow && <span className="badge-slow">Slow</span>}
                        </span>
                      </div>

                      <div className="translation-item-bar">
                        <div
                          className="translation-item-progress"
                          style={{
                            width: `${percentage}%`,
                            background: isFast
                              ? 'linear-gradient(90deg, #7eb870, #8b5cf6)'
                              : isSlow
                              ? 'linear-gradient(90deg, #e06040, #f9b55d)'
                              : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          }}
                        />
                      </div>

                      <div className="translation-item-dates">
                        <span>JP: {formatDate(volume.jp_release)}</span>
                        <span>→ {volume.en_completion ? formatDate(volume.en_completion) : 'Pending'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* CHARTS SECTION - Enhanced */}
          <div ref={(el) => { sectionRefs.current.charts = el; }} data-section="charts">
            <section className="charts-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Charts</h2>
                <p className="section-subtitle">Visualizing the series structure</p>
              </div>

              <div className="charts-grid">
                {/* Pages per Volume */}
                <div className="chart-card stagger-card">
                  <h3 className="chart-title">Pages per Volume</h3>
                  <div className="chart-bars">
                    {volumes.filter(v => v.page_count > 0).map((volume) => {
                      const percentage = (volume.page_count / maxPagesValue) * 100;
                      const rank = getRank(volume, 'pages');
                      return (
                        <div key={volume.id} className="chart-bar-group" title={`${volume.title}: ${volume.page_count} pages`}>
                          <div className="chart-bar-wrapper">
                            <div
                              className="chart-bar"
                              style={{
                                height: `${percentage}%`,
                                background: volume.is_short_story
                                  ? 'linear-gradient(180deg, #8b5cf6, #6366f1)'
                                  : volume.is_special
                                  ? 'linear-gradient(180deg, #f9b55d, #e06040)'
                                  : 'linear-gradient(180deg, #6366f1, #4f46e5)',
                              }}
                            />
                          </div>
                          <span className="chart-bar-label">
                            {volume.volume_number}
                          </span>
                          {rank && rank.startsWith('#1') && (
                            <span className="chart-bar-rank">🏆</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="chart-tooltip-hint">Hover bars for details</div>
                </div>

                {/* Chapters per Volume */}
                <div className="chart-card stagger-card">
                  <h3 className="chart-title">Chapters per Volume</h3>
                  <div className="chart-bars">
                    {volumes.filter(v => v.page_count > 0).map((volume) => {
                      const percentage = (volume.chapters / maxChaptersValue) * 100;
                      return (
                        <div key={volume.id} className="chart-bar-group" title={`${volume.title}: ${volume.chapters} chapters`}>
                          <div className="chart-bar-wrapper">
                            <div
                              className="chart-bar"
                              style={{
                                height: `${percentage}%`,
                                background: volume.is_short_story
                                  ? 'linear-gradient(180deg, #a78bfa, #8b5cf6)'
                                  : 'linear-gradient(180deg, #818cf8, #6366f1)',
                              }}
                            />
                          </div>
                          <span className="chart-bar-label">
                            {volume.volume_number}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="chart-tooltip-hint">Hover bars for details</div>
                </div>

                {/* Cumulative Pages */}
                <div className="chart-card stagger-card">
                  <h3 className="chart-title">Cumulative Pages</h3>
                  <div className="chart-bars chart-bars-cumulative">
                    {cumulativePages.map((item, index) => {
                      const maxCumulative = cumulativePages[cumulativePages.length - 1]?.pages || 1;
                      const percentage = (item.pages / maxCumulative) * 100;
                      return (
                        <div key={index} className="chart-bar-group" title={`Volume ${item.volume}: ${item.pages} total pages`}>
                          <div className="chart-bar-wrapper">
                            <div
                              className="chart-bar chart-bar-cumulative"
                              style={{
                                height: `${percentage}%`,
                                background: `linear-gradient(180deg, #818cf8, #4f46e5)`,
                              }}
                            />
                          </div>
                          <span className="chart-bar-label">
                            {item.volume}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="chart-tooltip-hint">Running total of pages</div>
                </div>

                {/* Translation Delay Trend */}
                <div className="chart-card stagger-card">
                  <h3 className="chart-title">Translation Delay Trend</h3>
                  <div className="chart-bars chart-bars-horizontal">
                    {delayTrendData.map((item, index) => {
                      const maxTrendDelay = Math.max(...delayTrendData.map(d => d.delay));
                      const percentage = (item.delay / maxTrendDelay) * 100;
                      const isFast = item.delay < 100;
                      const isSlow = item.delay > 1000;
                      return (
                        <div key={index} className="chart-bar-group chart-bar-group-horizontal" title={`${item.title}: ${item.delay} days`}>
                          <span className="chart-bar-label chart-bar-label-horizontal">
                            {item.volume}
                          </span>
                          <div className="chart-bar-wrapper chart-bar-wrapper-horizontal">
                            <div
                              className="chart-bar chart-bar-horizontal"
                              style={{
                                width: `${percentage}%`,
                                background: isFast
                                  ? 'linear-gradient(90deg, #7eb870, #8b5cf6)'
                                  : isSlow
                                  ? 'linear-gradient(90deg, #e06040, #f9b55d)'
                                  : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                              }}
                            />
                          </div>
                          <span className="chart-bar-value">{item.delay}d</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="chart-tooltip-hint">Translation delay over time</div>
                </div>

                {/* Scatter Plot: Pages vs Translation Delay */}
                <div className="chart-card chart-card-full stagger-card">
                  <h3 className="chart-title">Pages vs Translation Delay</h3>
                  <div className="scatter-plot">
                    {scatterData.map((item, index) => {
                      const maxScatterPages = Math.max(...scatterData.map(d => d.pages));
                      const maxScatterDelay = Math.max(...scatterData.map(d => d.delay));
                      const xPercent = (item.pages / maxScatterPages) * 100;
                      const yPercent = (item.delay / maxScatterDelay) * 100;
                      return (
                        <div
                          key={index}
                          className="scatter-point"
                          style={{
                            left: `${xPercent}%`,
                            bottom: `${yPercent}%`,
                            backgroundColor: item.delay < 100 ? '#7eb870' : item.delay > 1000 ? '#e06040' : '#6366f1',
                          }}
                          title={`${item.title}: ${item.pages} pages, ${item.delay} days delay`}
                        />
                      );
                    })}
                    <div className="scatter-labels">
                      <span>Fewer Pages</span>
                      <span>More Pages</span>
                      <span className="scatter-label-y">Shorter Delay</span>
                      <span className="scatter-label-y-bottom">Longer Delay</span>
                    </div>
                  </div>
                  <div className="chart-tooltip-hint">Hover points for details</div>
                </div>

                {/* Category Breakdown */}
                <div className="chart-card stagger-card">
                  <h3 className="chart-title">Category Breakdown</h3>
                  <div className="category-breakdown">
                    <div className="category-item">
                      <div className="category-label">
                        <span className="category-dot" style={{ backgroundColor: '#6366f1' }} />
                        <span>Main Volumes</span>
                      </div>
                      <div className="category-bar">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${(categoryBreakdown.main / volumes.length) * 100}%`,
                            backgroundColor: '#6366f1',
                          }}
                        />
                      </div>
                      <span className="category-count">{categoryBreakdown.main}</span>
                    </div>
                    <div className="category-item">
                      <div className="category-label">
                        <span className="category-dot" style={{ backgroundColor: '#8b5cf6' }} />
                        <span>Short Stories</span>
                      </div>
                      <div className="category-bar">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${(categoryBreakdown.short / volumes.length) * 100}%`,
                            backgroundColor: '#8b5cf6',
                          }}
                        />
                      </div>
                      <span className="category-count">{categoryBreakdown.short}</span>
                    </div>
                    <div className="category-item">
                      <div className="category-label">
                        <span className="category-dot" style={{ backgroundColor: '#f9b55d' }} />
                        <span>Specials</span>
                      </div>
                      <div className="category-bar">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${(categoryBreakdown.special / volumes.length) * 100}%`,
                            backgroundColor: '#f9b55d',
                          }}
                        />
                      </div>
                      <span className="category-count">{categoryBreakdown.special}</span>
                    </div>
                    <div className="category-item">
                      <div className="category-label">
                        <span className="category-dot" style={{ backgroundColor: '#7fc4e0' }} />
                        <span>Upcoming</span>
                      </div>
                      <div className="category-bar">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${(categoryBreakdown.upcoming / volumes.length) * 100}%`,
                            backgroundColor: '#7fc4e0',
                          }}
                        />
                      </div>
                      <span className="category-count">{categoryBreakdown.upcoming}</span>
                    </div>
                  </div>
                </div>

                {/* Publication Gap Visualization */}
                <div className="chart-card chart-card-full stagger-card">
                  <h3 className="chart-title">Publication Gap Analysis</h3>
                  <div className="gap-visualization">
                    {publicationGaps.map((gap, index) => {
                      const maxGap = Math.max(...publicationGaps.map(g => g.days));
                      const percentage = (gap.days / maxGap) * 100;
                      const isLong = gap.days > gapStats.avg * 1.5;
                      const isShort = gap.days < gapStats.avg * 0.5;
                      return (
                        <div key={index} className="gap-item" title={`${gap.from} → ${gap.to}: ${gap.days} days`}>
                          <span className="gap-label">{gap.from} → {gap.to}</span>
                          <div className="gap-bar-wrapper">
                            <div
                              className={`gap-bar ${isLong ? 'long' : ''} ${isShort ? 'short' : ''}`}
                              style={{
                                width: `${Math.max(percentage, 2)}%`,
                                backgroundColor: isLong ? '#e06040' : isShort ? '#7eb870' : '#6366f1',
                              }}
                            />
                          </div>
                          <span className="gap-days">{gap.days}d</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="gap-summary-mini">
                    <span>Average: {gapStats.avg}d</span>
                    <span>Longest: {gapStats.longest}d</span>
                    <span>Shortest: {gapStats.shortest}d</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* COMPARE VOLUMES SECTION */}
          <div ref={(el) => { sectionRefs.current.compare = el; }} data-section="compare">
            <section className="compare-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Compare Volumes</h2>
                <p className="section-subtitle">Side-by-side comparison of any two volumes</p>
              </div>

              <div className="compare-controls">
                <div className="compare-select">
                  <label>Volume 1</label>
                  <select
                    value={compareVolume1 || ''}
                    onChange={(e) => setCompareVolume1(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select Volume</option>
                    {volumes.filter(v => v.id !== compareVolume2).map(v => (
                      <option key={v.id} value={v.id}>
                        #{v.volume_number} - {v.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="compare-select">
                  <label>Volume 2</label>
                  <select
                    value={compareVolume2 || ''}
                    onChange={(e) => setCompareVolume2(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select Volume</option>
                    {volumes.filter(v => v.id !== compareVolume1).map(v => (
                      <option key={v.id} value={v.id}>
                        #{v.volume_number} - {v.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {compareVol1 && compareVol2 ? (
                <div className="compare-results">
                  <div className="compare-card">
                    <h3>{compareVol1.title}</h3>
                    <div className="compare-stats">
                      <div className="compare-stat">
                        <span className="compare-stat-label">Pages</span>
                        <span className={`compare-stat-value ${compareVol1.page_count > compareVol2.page_count ? 'winner' : compareVol1.page_count < compareVol2.page_count ? 'loser' : ''}`}>
                          {compareVol1.page_count}
                        </span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">Chapters</span>
                        <span className={`compare-stat-value ${compareVol1.chapters > compareVol2.chapters ? 'winner' : compareVol1.chapters < compareVol2.chapters ? 'loser' : ''}`}>
                          {compareVol1.chapters}
                        </span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">JP Release</span>
                        <span className="compare-stat-value">{formatDate(compareVol1.jp_release)}</span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">EN Completion</span>
                        <span className="compare-stat-value">{compareVol1.en_completion ? formatDate(compareVol1.en_completion) : '—'}</span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">Translation Delay</span>
                        <span className={`compare-stat-value ${compareVol1.jp_en_gap_days < compareVol2.jp_en_gap_days ? 'winner' : compareVol1.jp_en_gap_days > compareVol2.jp_en_gap_days ? 'loser' : ''}`}>
                          {compareVol1.jp_en_gap_days} days
                        </span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">Volume Weight</span>
                        <span className="compare-stat-value">{compareVol1.volume_weight}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="compare-vs">VS</div>

                  <div className="compare-card">
                    <h3>{compareVol2.title}</h3>
                    <div className="compare-stats">
                      <div className="compare-stat">
                        <span className="compare-stat-label">Pages</span>
                        <span className={`compare-stat-value ${compareVol2.page_count > compareVol1.page_count ? 'winner' : compareVol2.page_count < compareVol1.page_count ? 'loser' : ''}`}>
                          {compareVol2.page_count}
                        </span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">Chapters</span>
                        <span className={`compare-stat-value ${compareVol2.chapters > compareVol1.chapters ? 'winner' : compareVol2.chapters < compareVol1.chapters ? 'loser' : ''}`}>
                          {compareVol2.chapters}
                        </span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">JP Release</span>
                        <span className="compare-stat-value">{formatDate(compareVol2.jp_release)}</span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">EN Completion</span>
                        <span className="compare-stat-value">{compareVol2.en_completion ? formatDate(compareVol2.en_completion) : '—'}</span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">Translation Delay</span>
                        <span className={`compare-stat-value ${compareVol2.jp_en_gap_days < compareVol1.jp_en_gap_days ? 'winner' : compareVol2.jp_en_gap_days > compareVol1.jp_en_gap_days ? 'loser' : ''}`}>
                          {compareVol2.jp_en_gap_days} days
                        </span>
                      </div>
                      <div className="compare-stat">
                        <span className="compare-stat-label">Volume Weight</span>
                        <span className="compare-stat-value">{compareVol2.volume_weight}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="compare-placeholder">
                  <Icon icon="mdi:swap-horizontal" />
                  <p>Select two volumes to compare</p>
                </div>
              )}
            </section>
          </div>

          {/* VOLUMES EXPLORER SECTION - Enhanced */}
          <div ref={(el) => { sectionRefs.current.volumes = el; }} data-section="volumes">
            <section className="volumes-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Volume Explorer</h2>
                <p className="section-subtitle">Explore each volume in detail</p>
              </div>

              {/* Search and Filters */}
              <div className="volume-controls">
                <div className="volume-search">
                  <Icon icon="mdi:search" className="volume-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by title or volume number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="volume-search-input"
                  />
                  {searchQuery && (
                    <button className="volume-search-clear" onClick={() => setSearchQuery('')}>
                      <Icon icon="mdi:close" />
                    </button>
                  )}
                </div>

                <div className="volume-filters">
                  <button
                    className={`volume-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterType('all')}
                  >
                    All
                  </button>
                  <button
                    className={`volume-filter-btn ${filterType === 'main' ? 'active' : ''}`}
                    onClick={() => setFilterType('main')}
                  >
                    Main
                  </button>
                  <button
                    className={`volume-filter-btn ${filterType === 'short' ? 'active' : ''}`}
                    onClick={() => setFilterType('short')}
                  >
                    Short Stories
                  </button>
                  <button
                    className={`volume-filter-btn ${filterType === 'special' ? 'active' : ''}`}
                    onClick={() => setFilterType('special')}
                  >
                    Specials
                  </button>
                  <button
                    className={`volume-filter-btn ${filterType === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setFilterType('upcoming')}
                  >
                    Upcoming
                  </button>
                </div>

                <div className="volume-count">
                  {filteredVolumes.length} volume{filteredVolumes.length !== 1 ? 's' : ''} found
                </div>
              </div>

              <div className="volumes-grid">
                {filteredVolumes.map((volume) => {
                  const isExpanded = expandedVolume === volume.id;
                  const elementColor = volume.is_short_story ? '#8b5cf6' : volume.is_special ? '#f9b55d' : '#6366f1';
                  const pagePercentile = getPercentile(volume, 'pages');
                  const pageRank = getRank(volume, 'pages');
                  const chapterRank = getRank(volume, 'chapters');
                  const delayRank = getRank(volume, 'delay');

                  return (
                    <div
                      key={volume.id}
                      className={`volume-card stagger-card ${isExpanded ? 'expanded' : ''}`}
                      style={{ '--card-accent': elementColor } as React.CSSProperties}
                    >
                      <div
                        className="volume-card-header"
                        onClick={() => setExpandedVolume(isExpanded ? null : volume.id)}
                      >
                        <div className="volume-card-title">
                          <span className="volume-card-number">
                            #{volume.volume_number}
                          </span>
                          <h3>{volume.title}</h3>
                        </div>
                        <div className="volume-card-meta">
                          {volume.is_special && <span className="volume-badge special">Special</span>}
                          {volume.is_short_story && <span className="volume-badge short">Short Story</span>}
                          {volume.is_upcoming && <span className="volume-badge upcoming">Upcoming</span>}
                          {pageRank && (pageRank === '#1 Longest' || pageRank === '#2 Longest' || pageRank === '#3 Longest') && (
                            <span className="volume-badge rank">{pageRank}</span>
                          )}
                          {delayRank === 'Fastest' && <span className="volume-badge rank">Fastest TL</span>}
                          {delayRank === 'Slowest' && <span className="volume-badge rank">Slowest TL</span>}
                          <span className="volume-card-pages">{volume.page_count} pages</span>
                          <Icon
                            icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                            className="volume-card-chevron"
                          />
                        </div>
                      </div>

                      <div className={`volume-card-body ${isExpanded ? 'expanded' : ''}`}>
                        {/* Progress Bars */}
                        <div className="volume-card-progress">
                          <div className="volume-progress-item">
                            <span className="volume-progress-label">Page Count</span>
                            <div className="volume-progress-bar">
                              <div
                                className="volume-progress-fill"
                                style={{
                                  width: `${(volume.page_count / maxPagesValue) * 100}%`,
                                  backgroundColor: elementColor,
                                }}
                              />
                            </div>
                            <span className="volume-progress-value">{volume.page_count} / {maxPagesValue}</span>
                          </div>
                          {volume.jp_en_gap_days > 0 && (
                            <div className="volume-progress-item">
                              <span className="volume-progress-label">Translation Delay</span>
                              <div className="volume-progress-bar">
                                <div
                                  className="volume-progress-fill"
                                  style={{
                                    width: `${(volume.jp_en_gap_days / maxDelayValue) * 100}%`,
                                    backgroundColor: volume.jp_en_gap_days < 100 ? '#7eb870' : volume.jp_en_gap_days > 1000 ? '#e06040' : '#6366f1',
                                  }}
                                />
                              </div>
                              <span className="volume-progress-value">{volume.jp_en_gap_days}d</span>
                            </div>
                          )}
                          <div className="volume-progress-item">
                            <span className="volume-progress-label">Percentile</span>
                            <div className="volume-progress-bar">
                              <div
                                className="volume-progress-fill"
                                style={{
                                  width: `${pagePercentile}%`,
                                  backgroundColor: '#8b5cf6',
                                }}
                              />
                            </div>
                            <span className="volume-progress-value">{pagePercentile}%</span>
                          </div>
                        </div>

                        <div className="volume-card-details">
                          <div className="volume-card-detail">
                            <span className="volume-card-detail-label">Chapters</span>
                            <span className="volume-card-detail-value">{volume.chapters}</span>
                            {chapterRank && <span className="volume-card-rank">{chapterRank}</span>}
                          </div>
                          <div className="volume-card-detail">
                            <span className="volume-card-detail-label">Page Range</span>
                            <span className="volume-card-detail-value">{volume.page_range || '—'}</span>
                          </div>
                          <div className="volume-card-detail">
                            <span className="volume-card-detail-label">JP Release</span>
                            <span className="volume-card-detail-value">{formatDate(volume.jp_release)}</span>
                          </div>
                          {volume.en_completion && (
                            <div className="volume-card-detail">
                              <span className="volume-card-detail-label">EN Release</span>
                              <span className="volume-card-detail-value">{formatDate(volume.en_completion)}</span>
                            </div>
                          )}
                          {volume.jp_en_gap_days > 0 && (
                            <div className="volume-card-detail">
                              <span className="volume-card-detail-label">Translation Delay</span>
                              <span className="volume-card-detail-value">{volume.jp_en_gap_days} days</span>
                              {delayRank && <span className="volume-card-rank">{delayRank}</span>}
                            </div>
                          )}
                          <div className="volume-card-detail">
                            <span className="volume-card-detail-label">Volume Weight</span>
                            <span className="volume-card-detail-value">{volume.volume_weight}%</span>
                          </div>
                          <div className="volume-card-detail">
                            <span className="volume-card-detail-label">Page Contribution</span>
                            <span className="volume-card-detail-value">
                              {statsSummary.totalPages > 0 ? ((volume.page_count / statsSummary.totalPages) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ACHIEVEMENTS SECTION */}
          <div ref={(el) => { sectionRefs.current.achievements = el; }} data-section="achievements">
            <section className="achievements-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Series Achievements</h2>
                <p className="section-subtitle">Notable records and milestones</p>
              </div>

              <div className="achievements-grid">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="achievement-card stagger-card"
                    style={{ '--achievement-color': achievement.color } as React.CSSProperties}
                  >
                    <div className="achievement-card-icon">
                      <Icon icon={achievement.icon} />
                    </div>
                    <div className="achievement-card-content">
                      <span className="achievement-card-title">{achievement.title}</span>
                      <span className="achievement-card-value">{achievement.value}</span>
                      <span className="achievement-card-volume">{achievement.volume}</span>
                      <span className="achievement-card-description">{achievement.description}</span>
                    </div>
                    <div className="achievement-card-glow" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* FUN FACTS SECTION - Enhanced */}
          <div ref={(el) => { sectionRefs.current.funfacts = el; }} data-section="funfacts">
            <section className="funfacts-section section-reveal">
              <div className="section-header">
                <h2 className="section-title">Fun Facts</h2>
                <p className="section-subtitle">Interesting insights about the series</p>
              </div>

              <div className="funfacts-grid">
                {staticFunFacts.map((fact, index) => (
                  <div
                    key={index}
                    className="funfact-card stagger-card"
                    style={{ '--fact-color': fact.color } as React.CSSProperties}
                  >
                    <div className="funfact-card-icon">
                      <Icon icon={fact.icon} />
                    </div>
                    <div className="funfact-card-content">
                      <span className="funfact-card-value">{fact.value}</span>
                      <span className="funfact-card-title">{fact.title}</span>
                      <span className="funfact-card-description">{fact.description}</span>
                    </div>
                    <div className="funfact-card-glow" />
                  </div>
                ))}
              </div>

              {/* Dynamic Fun Facts */}
              <div className="funfacts-dynamic">
                <h3 className="funfacts-dynamic-title">Dynamic Insights</h3>
                <div className="funfacts-dynamic-grid">
                  {funFacts.map((fact, index) => (
                    <div key={index} className="funfact-dynamic stagger-card">
                      <Icon icon={fact.icon} />
                      <div>
                        <span className="funfact-dynamic-value">{fact.value}</span>
                        <span className="funfact-dynamic-label">{fact.label}</span>
                        {fact.description && (
                          <span className="funfact-dynamic-desc">{fact.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="stats-footer">
          <p>Adachi and Shimamura Statistics · Built with care</p>
          <p className="stats-footer-sub">Data sourced from the light novel series</p>
        </div>
      </div>
    </FullscreenLayout>
  );
};

export default AdaShimaStatsPage;