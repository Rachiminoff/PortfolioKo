import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faRocket } from '@fortawesome/free-solid-svg-icons';
import { faPython } from '@fortawesome/free-brands-svg-icons';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import '../assets/styles/Timeline.scss';

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
          } else {
            if (activeIndex === index) {
              element.classList.remove('active');
            }
          }
        });
      },
      { 
        threshold: 0.25, 
        rootMargin: '0px 0px -30px 0px'
      }
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

  return (
    <div id="history" ref={timelineRef} className="timeline-section">
      <div className="timeline-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-header-content">
            <span className="section-label">JOURNEY</span>
            <h1 className="section-title">Timeline</h1>
            <p className="section-subtitle">Key milestones and achievements throughout my development career</p>
          </div>
        </div>

        <div className="timeline-wrapper">
          {/* Progress fill indicator */}
          <div className="timeline-progress-track">
            <div ref={progressRef} className="timeline-progress-fill"></div>
          </div>

          <VerticalTimeline lineColor="rgba(255,255,255,0.04)">
            
            {/* First Python Code - Milestone 1 */}
            <VerticalTimelineElement
              className="vertical-timeline-element--work milestone-card milestone-completed"
              contentStyle={{ 
                background: '#0F0F0F',
                color: '#F5F5F5',
                borderRadius: '0',
                border: '0.5px solid rgba(255,255,255,0.06)',
                boxShadow: 'none',
                padding: '1.5rem 1.8rem',
              }}
              contentArrowStyle={{ 
                borderRight: '7px solid #0F0F0F',
              }}
              date="2022"
              dateClassName="custom-date"
              iconStyle={{ 
                background: '#1A1A1A',
                color: '#F5F5F5',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.06)',
              }}
              icon={<FontAwesomeIcon icon={faPython} />}
            >
              <div className="milestone-content">
                <div className="milestone-header">
                  <div className="milestone-title-group">
                    <h3 className="milestone-title">First Line of Code</h3>
                    <span className="milestone-year">2022</span>
                  </div>
                  <span className="milestone-status">BEGINNING</span>
                </div>
                
                <h4 className="milestone-subtitle">Python</h4>
                
                {/* Terminal Window */}
                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="terminal-controls">
                      <span className="terminal-dot terminal-dot-red"></span>
                      <span className="terminal-dot terminal-dot-yellow"></span>
                      <span className="terminal-dot terminal-dot-green"></span>
                    </div>
                    <span className="terminal-title">python</span>
                  </div>
                  <div className="terminal-body">
                    <code className="terminal-code">
                      <span className="terminal-prompt">❯</span>
                      <span className="terminal-command">print</span>
                      <span className="terminal-punctuation">(</span>
                      <span className="terminal-string">"hello, world"</span>
                      <span className="terminal-punctuation">)</span>
                      <span className="terminal-cursor"></span>
                    </code>
                  </div>
                </div>
                
                <p className="milestone-description">
                  The beginning of my programming journey — writing my first Python script and discovering the joy of coding.
                </p>
              </div>
            </VerticalTimelineElement>

            {/* Computer Science Start - Milestone 2 */}
            <VerticalTimelineElement
              className="vertical-timeline-element--education milestone-card milestone-completed milestone-emphasized"
              contentStyle={{ 
                background: '#0F0F0F',
                color: '#F5F5F5',
                borderRadius: '0',
                border: '0.5px solid rgba(59, 233, 229, 0.08)',
                boxShadow: 'none',
                padding: '1.5rem 1.8rem',
              }}
              contentArrowStyle={{ 
                borderRight: '7px solid #0F0F0F',
              }}
              date="2023"
              dateClassName="custom-date"
              iconStyle={{ 
                background: '#1A1A1A',
                color: '#F5F5F5',
                boxShadow: '0 0 0 2px rgba(59, 233, 229, 0.06)',
                border: '0.5px solid rgba(59, 233, 229, 0.08)',
              }}
              icon={<FontAwesomeIcon icon={faGraduationCap} />}
            >
              <div className="milestone-content">
                <div className="milestone-header">
                  <div className="milestone-title-group">
                    <h3 className="milestone-title">Started Computer Science</h3>
                    <span className="milestone-year">2023</span>
                  </div>
                  <span className="milestone-status milestone-status-current">CURRENT</span>
                </div>
                
                <h4 className="milestone-subtitle">Cavite State University — Main Campus</h4>
                
                <p className="milestone-description">
                  Currently pursuing a Bachelor's degree in Computer Science.
                </p>
              </div>
            </VerticalTimelineElement>

            {/* Future - Milestone 3 */}
            <VerticalTimelineElement
              className="vertical-timeline-element--work milestone-card milestone-future"
              contentStyle={{ 
                background: '#0A0A0A',
                color: '#F5F5F5',
                borderRadius: '0',
                border: '0.5px dashed rgba(255,255,255,0.04)',
                boxShadow: 'none',
                padding: '1.5rem 1.8rem',
                opacity: 0.6,
              }}
              contentArrowStyle={{ 
                borderRight: '7px solid #0A0A0A',
              }}
              date="Future"
              dateClassName="custom-date"
              iconStyle={{ 
                background: '#1A1A1A',
                color: '#F5F5F5',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.03)',
                opacity: 0.4,
              }}
              icon={<FontAwesomeIcon icon={faRocket} />}
            >
              <div className="milestone-content">
                <div className="milestone-header">
                  <div className="milestone-title-group">
                    <h3 className="milestone-title">What's Next?</h3>
                    <span className="milestone-year">Future</span>
                  </div>
                  <span className="milestone-status milestone-status-future">UPCOMING</span>
                </div>
                
                <h4 className="milestone-subtitle">Future Goals &amp; Aspirations</h4>
                
                <p className="milestone-description">
                  Exploring emerging technologies, building impactful open-source projects, and 
                  continuously growing as a developer. The journey continues...
                </p>
              </div>
            </VerticalTimelineElement>

          </VerticalTimeline>
        </div>
      </div>
    </div>
  );
}

export default Timeline;