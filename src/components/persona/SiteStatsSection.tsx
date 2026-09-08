import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import PersonaSectionHeader from './PersonaSectionHeader';

interface SiteStats {
  visitors: number;
  visits: number;
  updatedAt?: string;
}

const SiteStatsSection: React.FC = () => {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        const response = await fetch('/api/site-stats', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        if (active && payload?.data) setStats(payload.data);
      } catch {
        // Stats are non-essential; never let analytics affect the page.
      }
    };

    const onStatsUpdated = (event: Event) => {
      const data = (event as CustomEvent<SiteStats>).detail;
      if (data?.visitors !== undefined && active) setStats(data);
    };

    window.addEventListener('site-stats-updated', onStatsUpdated);
    loadStats();
    const retry = window.setTimeout(loadStats, 500);
    return () => {
      active = false;
      window.clearTimeout(retry);
      window.removeEventListener('site-stats-updated', onStatsUpdated);
    };
  }, []);

  return (
    <section className="persona-site-stats" aria-labelledby="persona-site-stats-title">
      <PersonaSectionHeader
        index="02 / NUMBERS"
        title="SITE STATS"
        note="A SMALL RECORD OF WHO STOPPED BY"
        id="persona-site-stats-title"
      />
      <div className="persona-stats-grid">
        <article className="persona-stat-card persona-stat-card-primary">
          <div className="persona-stat-label"><Icon icon="mdi:account-group-outline" width={19} /> VISITORS</div>
          <strong>{stats ? stats.visitors.toLocaleString() : '—'}</strong>
          <span>UNIQUE BROWSERS</span>
        </article>
        <article className="persona-stat-card">
          <div className="persona-stat-label"><Icon icon="mdi:eye-outline" width={19} /> PAGE VIEWS</div>
          <strong>{stats ? stats.visits.toLocaleString() : '—'}</strong>
          <span>ALL RECORDED VISITS</span>
        </article>
        <div className="persona-stat-copy">
          <span className="persona-index">NO BIG DEAL.</span>
          <p>This is deliberately just a counter. No names, accounts, IP addresses, or detailed browsing profiles are collected.</p>
        </div>
      </div>
    </section>
  );
};

export default SiteStatsSection;
