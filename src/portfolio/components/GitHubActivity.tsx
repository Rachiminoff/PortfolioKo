import React, { useEffect, useMemo, useState } from 'react';
import '../assets/styles/GitHubActivity.scss';

type Contribution = {
  date: string;
  count: number;
  level: number;
};

type ContributionResponse = {
  total?: Record<string, number>;
  contributions: Contribution[];
};

const GITHUB_USERNAME = 'Rachiminoff';
const API_URL = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`;

const formatMonth = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(`${value}T00:00:00`));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));

function GitHubActivity() {
  const [data, setData] = useState<ContributionResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(API_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('GitHub activity request failed');
        return response.json() as Promise<ContributionResponse>;
      })
      .then((payload) => setData(payload))
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') setError(true);
      });

    return () => controller.abort();
  }, []);

  const calendar = useMemo(() => {
    if (!data?.contributions?.length) return [];

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 364);

    const byDate = new Map(data.contributions.map((day) => [day.date, day]));
    const firstDay = new Date(start);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());

    const weeks: Contribution[][] = [];
    let cursor = new Date(firstDay);

    while (cursor <= end || weeks.length < 52) {
      const week: Contribution[] = [];
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(cursor);
        date.setDate(cursor.getDate() + day);
        const key = date.toISOString().slice(0, 10);
        const contribution = byDate.get(key);
        week.push(
          contribution ?? {
            date: key,
            count: 0,
            level: 0,
          },
        );
      }
      weeks.push(week);
      cursor.setDate(cursor.getDate() + 7);
      if (cursor > end && weeks.length >= 52) break;
    }

    return weeks.slice(-53);
  }, [data]);

  const total =
    data?.total?.lastYear ?? data?.contributions?.reduce((sum, day) => sum + day.count, 0) ?? 0;

  return (
    <section
      className="github-activity"
      id="github-activity"
      aria-labelledby="github-activity-title"
    >
      <div className="github-activity__grid" aria-hidden="true" />

      <header className="github-activity__header">
        <div className="github-activity__eyebrow">
          <span>02</span>
          <span>ACTIVITY / GITHUB</span>
          <span className="github-activity__status">
            <i /> LIVE DATA
          </span>
        </div>
        <div className="github-activity__heading-row">
          <div>
            <p className="github-activity__index">GITHUB / 01</p>
            <h2 id="github-activity-title">
              COMMIT
              <br />
              <em>HEAT MAP</em>
            </h2>
          </div>
          <a
            className="github-activity__link"
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>@{GITHUB_USERNAME}</span>
            <b>↗</b>
          </a>
        </div>
      </header>

      <div className="github-activity__panel">
        <div className="github-activity__panel-top">
          <div>
            <span>LAST 12 MONTHS</span>
            <strong>{data ? total.toLocaleString() : '—'}</strong>
            <small>CONTRIBUTIONS</small>
          </div>
          <div className="github-activity__legend" aria-label="Contribution intensity legend">
            <span>LESS</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className={`level-${level}`} />
            ))}
            <span>MORE</span>
          </div>
        </div>

        <div className="github-activity__calendar-wrap">
          {error ? (
            <div className="github-activity__state">GITHUB ACTIVITY TEMPORARILY UNAVAILABLE</div>
          ) : !data ? (
            <div className="github-activity__state">LOADING CONTRIBUTION DATA…</div>
          ) : (
            <div
              className="github-activity__calendar"
              aria-label={`${total} GitHub contributions in the last 12 months`}
            >
              <div className="github-activity__months" aria-hidden="true">
                {calendar.map((week, weekIndex) => {
                  const firstDate = week[0]?.date;
                  const previousDate =
                    weekIndex > 0 ? calendar[weekIndex - 1]?.[0]?.date : undefined;
                  const isNewMonth =
                    Boolean(firstDate) &&
                    (!previousDate ||
                      new Date(`${firstDate}T00:00:00`).getMonth() !==
                        new Date(`${previousDate}T00:00:00`).getMonth());
                  return (
                    <span key={`month-${weekIndex}`} className={isNewMonth ? 'is-visible' : ''}>
                      {isNewMonth ? formatMonth(firstDate) : ''}
                    </span>
                  );
                })}
              </div>
              <div className="github-activity__calendar-body">
                <div className="github-activity__weekdays" aria-hidden="true">
                  <span />
                  <span>MON</span>
                  <span /> <span>WED</span>
                  <span /> <span>FRI</span>
                  <span />
                </div>
                <div className="github-activity__weeks">
                  {calendar.map((week, weekIndex) => (
                    <div className="github-activity__week" key={`${week[0]?.date}-${weekIndex}`}>
                      {week.map((day) => (
                        <span
                          key={day.date}
                          className={`github-day level-${Math.min(day.level, 4)}`}
                          title={`${day.count} contribution${day.count === 1 ? '' : 's'} · ${formatDate(day.date)}`}
                          aria-label={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${formatDate(day.date)}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="github-activity__footer">
          <span>SOURCE / GITHUB CONTRIBUTION CALENDAR</span>
          <span>DATA / {GITHUB_USERNAME.toUpperCase()}</span>
        </footer>
      </div>
    </section>
  );
}

export default GitHubActivity;
