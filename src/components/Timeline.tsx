import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faRocket } from '@fortawesome/free-solid-svg-icons';
import { faPython } from '@fortawesome/free-brands-svg-icons';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import '../assets/styles/Timeline.scss';
import timelineData from '../types/timelineData.json';

const iconMap = {
  python: faPython,
  graduation: faGraduationCap,
  rocket: faRocket,
};

const statusClassMap = {
  current: 'milestone-status-current',
  future: 'milestone-status-future',
  default: '',
};

function Timeline() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const index = parseInt(element.dataset.index || '0');

          if (entry.isIntersecting) {
            setActiveIndex(index);

            const icon = element.querySelector('.vertical-timeline-element-icon');
            const card = element.querySelector('.vertical-timeline-element-content');

            element.classList.add('visible');

            if (icon) {
              setTimeout(() => {
                icon.classList.add('icon-visible');
              }, 200);
            }

            if (card) {
              setTimeout(() => {
                card.classList.add('card-visible');
              }, 400);
            }
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -30px 0px',
      },
    );

    const elements = document.querySelectorAll('.vertical-timeline-element');
    elements.forEach((el, index) => {
      (el as HTMLElement).dataset.index = String(index);
      observer.observe(el);
    });

    const handleScroll = () => {
      if (!progressRef.current) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;

      progressRef.current.style.height = `${Math.min(progress, 100)}%`;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeIndex]);

  const renderTerminal = (terminal: any) => {
    if (!terminal) return null;

    return (
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-controls">
            <span className="terminal-dot terminal-dot-red"></span>
            <span className="terminal-dot terminal-dot-yellow"></span>
            <span className="terminal-dot terminal-dot-green"></span>
          </div>
          <span className="terminal-title">{terminal.title}</span>
        </div>
        <div className="terminal-body">
          <code className="terminal-code">
            {terminal.code.map((segment: any, index: number) => (
              <span key={index} className={`terminal-${segment.type}`}>
                {segment.value}
              </span>
            ))}
            <span className="terminal-cursor"></span>
          </code>
        </div>
      </div>
    );
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || faRocket;
  };

  const getStatusClass = (status: string) => {
    const type = status.toLowerCase();
    return statusClassMap[type as keyof typeof statusClassMap] || '';
  };

  return (
    <div id="history" ref={timelineRef} className="timeline-section">
      <div className="timeline-container">
        <div className="section-header">
          <div className="section-header-content">
            <span className="section-label">JOURNEY</span>
            <h1 className="section-title">Timeline</h1>
            <p className="section-subtitle">
              Key milestones and achievements throughout my development career
            </p>
          </div>
        </div>

        <div className="timeline-wrapper">
          <div className="timeline-progress-track">
            <div ref={progressRef} className="timeline-progress-fill"></div>
          </div>

          <VerticalTimeline lineColor="rgba(255,255,255,0.04)">
            {timelineData.milestones.map((milestone) => (
              <VerticalTimelineElement
                key={milestone.id}
                className="vertical-timeline-element--work milestone-card"
                contentStyle={{
                  background: '#181818',
                  color: '#f5f5f5',
                  borderRadius: '0',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'none',
                  padding: '1.8rem 2rem',
                }}
                contentArrowStyle={{
                  borderRight: '7px solid #181818',
                }}
                date={milestone.year}
                dateClassName="custom-date"
                iconStyle={{
                  background: '#222222',
                  color: '#f5f5f5',
                  boxShadow: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                icon={<FontAwesomeIcon icon={getIcon(milestone.icon)} />}
              >
                <div className="milestone-content">
                  <div className="milestone-header">
                    <div className="milestone-title-group">
                      <h3 className="milestone-title">{milestone.title}</h3>
                      <span className="milestone-year">{milestone.year}</span>
                    </div>
                    <span className={`milestone-status ${getStatusClass(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>

                  <h4 className="milestone-subtitle">{milestone.subtitle}</h4>

                  {renderTerminal(milestone.terminal)}

                  <p className="milestone-description">{milestone.description}</p>
                </div>
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
