import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faGraduationCap, faRocket } from '@fortawesome/free-solid-svg-icons';
import { faPython } from '@fortawesome/free-brands-svg-icons';
import '../assets/styles/Timeline.scss';
import timelineData from '../data/timelineData.json';

const iconMap = {
  python: faPython,
  graduation: faGraduationCap,
  briefcase: faBriefcase,
  rocket: faRocket,
};

const statusClassMap = {
  current: 'milestone-status-current',
  completed: 'milestone-status-completed',
  beginning: 'milestone-status-beginning',
  future: 'milestone-status-future',
  upcoming: 'milestone-status-future',
  default: '',
};

function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>('.milestone-card'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.classList.add('visible');
          element.querySelector('.milestone-marker')?.classList.add('icon-visible');
          element.querySelector('.milestone-card-inner')?.classList.add('card-visible');
          observer.unobserve(element);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );

    elements.forEach((element, index) => {
      element.style.setProperty('--item-index', String(index));
      observer.observe(element);
    });

    const updateProgress = () => {
      if (!progressRef.current) return;
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight;
      const start = viewport * 0.72;
      const end = rect.height - viewport * 0.28;
      const travelled = Math.min(Math.max(start - rect.top, 0), Math.max(end, 1));
      const progress = Math.min(Math.max((travelled / Math.max(end, 1)) * 100, 0), 100);
      progressRef.current.style.height = `${progress}%`;
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  const getIcon = (iconName: string) => iconMap[iconName as keyof typeof iconMap] || faRocket;

  const getStatusClass = (status: string) =>
    statusClassMap[status.toLowerCase() as keyof typeof statusClassMap] || '';

  const renderTerminal = (terminal: any) => {
    if (!terminal) return null;

    return (
      <div className="timeline-code-strip" aria-label={`${terminal.title} code example`}>
        <div className="timeline-code-label">
          <span className="timeline-code-mark" />
          <span>{terminal.title}</span>
        </div>
        <code className="timeline-code">
          {terminal.code.map((segment: any, index: number) => (
            <span key={index} className={`timeline-code-${segment.type}`}>
              {segment.value}
            </span>
          ))}
          <span className="timeline-code-cursor" aria-hidden="true" />
        </code>
      </div>
    );
  };

  return (
    <section
      id="history"
      ref={timelineRef}
      className="timeline-section"
      aria-labelledby="history-title"
    >
      <div className="timeline-container">
        <header className="timeline-intro section-header">
          <div className="section-header__number">04</div>
          <div className="section-header__label">JOURNEY</div>
          <div className="section-header__rule" aria-hidden="true" />
          <div className="section-header__meta">JOURNEY / 2022—PRESENT</div>
          <div className="section-header__status">
            {String(timelineData.milestones.length).padStart(2, '0')} EVENTS
          </div>
          <div className="section-header__title-group">
            <h2 id="history-title" className="section-title">
              Timeline
            </h2>
            <p className="section-subtitle">
              A compact record of the milestones, work, and experiments that shaped my development
              path.
            </p>
          </div>
        </header>

        <div className="timeline-wrapper">
          <div className="timeline-rail" aria-hidden="true">
            <div className="timeline-rail-track" />
            <div ref={progressRef} className="timeline-rail-progress" />
          </div>

          <div className="timeline-list">
            {timelineData.milestones.map((milestone, index) => (
              <article key={milestone.id} className={`milestone-card milestone-card-${index % 3}`}>
                <div className="milestone-marker" aria-hidden="true">
                  <FontAwesomeIcon icon={getIcon(milestone.icon)} />
                </div>

                <div className="milestone-card-inner">
                  <div className="milestone-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="milestone-year-block">
                    <span className="milestone-year">{milestone.year}</span>
                    <span className="milestone-rule" />
                  </div>

                  <div className="milestone-content">
                    <div className="milestone-header">
                      <div className="milestone-heading">
                        <span className="milestone-kicker">MILESTONE</span>
                        <h3 className="milestone-title">{milestone.title}</h3>
                      </div>
                      <span className={`milestone-status ${getStatusClass(milestone.status)}`}>
                        {milestone.status}
                      </span>
                    </div>

                    <h4 className="milestone-subtitle">{milestone.subtitle}</h4>
                    {renderTerminal(milestone.terminal)}
                    <p className="milestone-description">{milestone.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <footer className="timeline-footer">
          <span>END OF CURRENT RECORD</span>
          <span className="timeline-footer-line" />
          <span>MORE TO COME</span>
        </footer>
      </div>
    </section>
  );
}

export default Timeline;
