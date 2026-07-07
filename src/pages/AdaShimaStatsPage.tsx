import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../../lib/supabase';
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

// Helper functions
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    fetchVolumes();
  }, []);

  const fetchVolumes = async () => {
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
  };

  const calculateStats = (data: VolumeData[]) => {
    const activeVolumes = data.filter(v => !v.is_upcoming && v.page_count > 0);
    const totalVolumes = data.length;
    const totalChapters = activeVolumes.reduce((sum, v) => sum + v.chapters, 0);
    const totalPages = activeVolumes.reduce((sum, v) => sum + v.page_count, 0);
    const avgPagesPerVolume = Math.round(totalPages / activeVolumes.length);
    const avgChaptersPerVolume = Math.round(totalChapters / activeVolumes.length);

    // Most/Least pages
    let mostPages = activeVolumes.reduce((max, v) => v.page_count > max.page_count ? v : max, activeVolumes[0] || { page_count: 0, title: '' } as VolumeData);
    let leastPages = activeVolumes.reduce((min, v) => v.page_count < min.page_count ? v : min, activeVolumes[0] || { page_count: Infinity, title: '' } as VolumeData);

    // Translation speeds
    const translated = activeVolumes.filter(v => v.jp_en_gap_days > 0);
    let fastest = translated.reduce((min, v) => v.jp_en_gap_days < min.jp_en_gap_days ? v : min, translated[0] || { jp_en_gap_days: Infinity, title: '' } as VolumeData);
    let slowest = translated.reduce((max, v) => v.jp_en_gap_days > max.jp_en_gap_days ? v : max, translated[0] || { jp_en_gap_days: 0, title: '' } as VolumeData);
    const avgTranslationDays = Math.round(translated.reduce((sum, v) => sum + v.jp_en_gap_days, 0) / translated.length);

    // Above/Below average length
    const volumesAboveAvgLength = activeVolumes.filter(v => v.page_count > avgPagesPerVolume).length;
    const volumesBelowAvgLength = activeVolumes.filter(v => v.page_count < avgPagesPerVolume).length;

    // Publication span
    const dates = activeVolumes.map(v => new Date(v.jp_release));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

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
  };

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'translation', label: 'Translation' },
    { id: 'charts', label: 'Charts' },
    { id: 'volumes', label: 'Volumes' },
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

  // Loading state
  if (loading) {
    return (
      <div className="adashima-stats-page loading">
        <div className="stats-loading-state">
          <div className="stats-loading-spinner" />
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  // Get sorted volumes for translation section
  const activeVolumes = volumes.filter(v => v.jp_en_gap_days > 0);
  const sortedVolumes = [...activeVolumes].sort((a, b) => {
    if (sortDelay === 'longest') return b.jp_en_gap_days - a.jp_en_gap_days;
    if (sortDelay === 'shortest') return a.jp_en_gap_days - b.jp_en_gap_days;
    return a.id - b.id;
  });

  const maxDelay = Math.max(...activeVolumes.map(v => v.jp_en_gap_days));
  const maxPages = Math.max(...volumes.filter(v => v.page_count > 0).map(v => v.page_count));
  const maxChapters = Math.max(...volumes.filter(v => v.page_count > 0).map(v => v.chapters));

  // Fun facts
  const funFacts = [
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

  return (
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

      {/* Content */}
      <div className="stats-content">
        {/* HERO SECTION */}
        <div ref={(el) => (sectionRefs.current.overview = el)} data-section="overview">
          <section className="hero-section section-reveal">
            <div className="hero-content">
              <div className="hero-badge">✦ Statistics</div>
              <h1 className="hero-title">Adachi & Shimamura</h1>
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
        <div ref={(el) => (sectionRefs.current.dashboard = el)} data-section="dashboard">
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
        <div ref={(el) => (sectionRefs.current.timeline = el)} data-section="timeline">
          <section className="timeline-section section-reveal">
            <div className="section-header">
              <h2 className="section-title">Release Timeline</h2>
              <p className="section-subtitle">Every volume as a milestone</p>
            </div>

            <div className="timeline-container">
              {volumes.filter(v => !v.is_upcoming).map((volume, index) => (
                <div key={volume.id} className="timeline-item stagger-card">
                  <div className="timeline-item-connector">
                    <div
                      className="timeline-item-dot"
                      style={{
                        backgroundColor: volume.is_short_story ? '#8b5cf6' : '#6366f1',
                      }}
                    />
                    {index < volumes.filter(v => !v.is_upcoming).length - 1 && (
                      <div className="timeline-item-line" />
                    )}
                  </div>

                  <div className="timeline-item-content">
                    <div className="timeline-item-header">
                      <div className="timeline-item-title">
                        <h3>{volume.title}</h3>
                        {volume.is_special && (
                          <span className="timeline-item-badge special">✦ Special</span>
                        )}
                        {volume.is_short_story && (
                          <span className="timeline-item-badge short">📖 Short Story</span>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* TRANSLATION DELAY SECTION */}
        <div ref={(el) => (sectionRefs.current.translation = el)} data-section="translation">
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
                const percentage = (volume.jp_en_gap_days / maxDelay) * 100;
                const isFast = volume.jp_en_gap_days < 100;
                const isSlow = volume.jp_en_gap_days > 1000;

                return (
                  <div key={volume.id} className="translation-item stagger-card">
                    <div className="translation-item-info">
                      <span className="translation-item-title">
                        {volume.title}
                        {volume.is_special && <span className="badge-special">✦</span>}
                        {volume.is_short_story && <span className="badge-short">📖</span>}
                      </span>
                      <span className="translation-item-days">
                        {volume.jp_en_gap_days} days
                        {isFast && <span className="badge-fast">⚡ Fast</span>}
                        {isSlow && <span className="badge-slow">🐢 Slow</span>}
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

        {/* CHARTS SECTION */}
        <div ref={(el) => (sectionRefs.current.charts = el)} data-section="charts">
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
                    const percentage = (volume.page_count / maxPages) * 100;
                    return (
                      <div key={volume.id} className="chart-bar-group">
                        <div className="chart-bar-wrapper">
                          <div
                            className="chart-bar"
                            style={{
                              height: `${percentage}%`,
                              background: volume.is_short_story
                                ? 'linear-gradient(180deg, #8b5cf6, #6366f1)'
                                : 'linear-gradient(180deg, #6366f1, #4f46e5)',
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
              </div>

              {/* Chapters per Volume */}
              <div className="chart-card stagger-card">
                <h3 className="chart-title">Chapters per Volume</h3>
                <div className="chart-bars">
                  {volumes.filter(v => v.page_count > 0).map((volume) => {
                    const percentage = (volume.chapters / maxChapters) * 100;
                    return (
                      <div key={volume.id} className="chart-bar-group">
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
              </div>

              {/* Translation Delay Chart */}
              <div className="chart-card chart-card-full stagger-card">
                <h3 className="chart-title">Translation Delay (Days)</h3>
                <div className="chart-bars chart-bars-horizontal">
                  {volumes.filter(v => v.jp_en_gap_days > 0).slice(0, 15).map((volume) => {
                    const percentage = (volume.jp_en_gap_days / maxDelay) * 100;
                    const isFast = volume.jp_en_gap_days < 100;
                    const isSlow = volume.jp_en_gap_days > 1000;

                    return (
                      <div key={volume.id} className="chart-bar-group chart-bar-group-horizontal">
                        <span className="chart-bar-label chart-bar-label-horizontal">
                          {volume.volume_number}
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
                        <span className="chart-bar-value">{volume.jp_en_gap_days}d</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* VOLUMES EXPLORER SECTION */}
        <div ref={(el) => (sectionRefs.current.volumes = el)} data-section="volumes">
          <section className="volumes-section section-reveal">
            <div className="section-header">
              <h2 className="section-title">Volume Explorer</h2>
              <p className="section-subtitle">Explore each volume in detail</p>
            </div>

            <div className="volumes-grid">
              {volumes.map((volume) => {
                const isExpanded = expandedVolume === volume.id;
                const elementColor = volume.is_short_story ? '#8b5cf6' : '#6366f1';

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
                        {volume.is_special && <span className="volume-badge special">✦</span>}
                        {volume.is_short_story && <span className="volume-badge short">📖</span>}
                        {volume.is_upcoming && <span className="volume-badge upcoming">🔜</span>}
                        <span className="volume-card-pages">{volume.page_count} pages</span>
                        <Icon
                          icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                          className="volume-card-chevron"
                        />
                      </div>
                    </div>

                    <div className={`volume-card-body ${isExpanded ? 'expanded' : ''}`}>
                      <div className="volume-card-details">
                        <div className="volume-card-detail">
                          <span className="volume-card-detail-label">Chapters</span>
                          <span className="volume-card-detail-value">{volume.chapters}</span>
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
                          </div>
                        )}
                        <div className="volume-card-detail">
                          <span className="volume-card-detail-label">Volume Weight</span>
                          <span className="volume-card-detail-value">{volume.volume_weight}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* FUN FACTS SECTION */}
        <div ref={(el) => (sectionRefs.current.funfacts = el)} data-section="funfacts">
          <section className="funfacts-section section-reveal">
            <div className="section-header">
              <h2 className="section-title">Fun Facts</h2>
              <p className="section-subtitle">Interesting insights about the series</p>
            </div>

            <div className="funfacts-grid">
              {funFacts.map((fact, index) => (
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
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="stats-footer">
        <p>Adachi & Shimamura Statistics · Built with ❤️</p>
        <p className="stats-footer-sub">Data sourced from the light novel series</p>
      </div>
    </div>
  );
};

export default AdaShimaStatsPage;