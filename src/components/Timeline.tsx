import React, { useEffect, useRef, useState } from "react";
import '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faRocket } from '@fortawesome/free-solid-svg-icons';
import { faPython } from '@fortawesome/free-brands-svg-icons';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import '../assets/styles/Timeline.scss'

function Timeline() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intersection Observer for scroll-triggered animations with viewport awareness
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const index = parseInt(element.dataset.index || '0');
          
          if (entry.isIntersecting) {
            // Set active milestone
            setActiveIndex(index);
            
            // Stagger animations: line fills first, then icon, then card
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
            // Remove active state when scrolled away
            if (activeIndex === index) {
              // Keep visible class but remove active glow
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

    // Observe all timeline elements
    const elements = document.querySelectorAll('.vertical-timeline-element');
    elements.forEach((el, index) => {
      (el as HTMLElement).dataset.index = String(index);
      observer.observe(el);
    });

    // Update progress bar on scroll
    const handleScroll = () => {
      if (!progressRef.current) return;
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      
      progressRef.current.style.height = `${Math.min(progress, 100)}%`;
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeIndex]);

  return (
    <div id="history" ref={timelineRef} className="timeline-section">
      {/* Background glow effects */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>
      <div className="noise-overlay"></div>

      <div className="timeline-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-header-content">
            <span className="section-label">Journey</span>
            <h1 className="section-title">
              Timeline
            </h1>
            <p className="section-subtitle">
              Key milestones and achievements throughout my development career
            </p>
          </div>
        </div>

        <div className="timeline-wrapper">
          {/* Progress fill indicator */}
          <div className="timeline-progress-track">
            <div ref={progressRef} className="timeline-progress-fill"></div>
          </div>

          <VerticalTimeline lineColor="rgba(80, 0, 202, 0.08)">
            
            {/* First Python Code - Milestone 1 */}
            <VerticalTimelineElement
              className="vertical-timeline-element--work milestone-card milestone-completed"
              contentStyle={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
                backdropFilter: 'blur(24px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
                color: 'rgb(39, 40, 34)',
                borderRadius: '16px 16px 16px 4px',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.02), 0 1px 4px rgba(0,0,0,0.01), inset 0 1px 0 rgba(255,255,255,0.9)',
                padding: '1.5rem 1.8rem',
                position: 'relative',
              }}
              contentArrowStyle={{ 
                borderRight: '7px solid rgba(255,255,255,0.8)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))'
              }}
              date="2022"
              dateClassName="custom-date premium-date"
              iconStyle={{ 
                background: 'linear-gradient(135deg, #3776AB 0%, #2a5f8a 100%)',
                color: 'white',
                boxShadow: '0 0 0 4px rgba(55,118,171,0.12), 0 0 0 8px rgba(55,118,171,0.04), 0 4px 16px rgba(55,118,171,0.08)',
              }}
              icon={<FontAwesomeIcon icon={faPython} />}
            >
              <div className="milestone-content">
                <div className="milestone-header">
                  <div className="milestone-title-group">
                    <h3 className="milestone-title">First Line of Code</h3>
                    <span className="milestone-year">2022</span>
                  </div>
                  <span className="milestone-status">Beginning</span>
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
              <div className="milestone-glow"></div>
            </VerticalTimelineElement>

            {/* Computer Science Start - Milestone 2 */}
            <VerticalTimelineElement
              className="vertical-timeline-element--education milestone-card milestone-completed milestone-emphasized"
              contentStyle={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
                backdropFilter: 'blur(24px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
                color: 'rgb(39, 40, 34)',
                borderRadius: '16px 16px 16px 4px',
                border: '1px solid rgba(80,0,202,0.12)',
                boxShadow: '0 4px 32px rgba(80,0,202,0.04), 0 1px 4px rgba(0,0,0,0.01), inset 0 1px 0 rgba(255,255,255,0.9)',
                padding: '1.5rem 1.8rem',
                position: 'relative',
              }}
              contentArrowStyle={{ 
                borderRight: '7px solid rgba(255,255,255,0.85)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))'
              }}
              date="2023"
              dateClassName="custom-date premium-date"
              iconStyle={{ 
                background: 'linear-gradient(135deg, #5000ca 0%, #3a0094 100%)',
                color: 'white',
                boxShadow: '0 0 0 4px rgba(80,0,202,0.12), 0 0 0 8px rgba(80,0,202,0.04), 0 4px 16px rgba(80,0,202,0.08)',
                width: '52px',
                height: '52px',
              }}
              icon={<FontAwesomeIcon icon={faGraduationCap} />}
            >
              <div className="milestone-content">
                <div className="milestone-header">
                  <div className="milestone-title-group">
                    <h3 className="milestone-title">Started Computer Science</h3>
                    <span className="milestone-year">2023</span>
                  </div>
                  <span className="milestone-status milestone-status-current">Current</span>
                </div>
                
                <h4 className="milestone-subtitle">Cavite State University — Main Campus</h4>
                
                <p className="milestone-description">
                  Currently pursuing a Bachelor's degree in Computer Science.
                </p>
              </div>
              <div className="milestone-glow"></div>
            </VerticalTimelineElement>

            {/* Future - Milestone 3 */}
            <VerticalTimelineElement
              className="vertical-timeline-element--work milestone-card milestone-future"
              contentStyle={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 100%)',
                backdropFilter: 'blur(20px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                color: 'rgb(39, 40, 34)',
                borderRadius: '16px 16px 16px 4px',
                border: '1.5px dashed rgba(136,136,136,0.2)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.01), 0 1px 4px rgba(0,0,0,0.005), inset 0 1px 0 rgba(255,255,255,0.5)',
                padding: '1.5rem 1.8rem',
                position: 'relative',
              }}
              contentArrowStyle={{ 
                borderRight: '7px solid rgba(255,255,255,0.4)',
              }}
              date="Future"
              dateClassName="custom-date premium-date"
              iconStyle={{ 
                background: 'linear-gradient(135deg, #888 0%, #666 100%)',
                color: 'white',
                boxShadow: '0 0 0 4px rgba(136,136,136,0.08), 0 0 0 8px rgba(136,136,136,0.02), 0 4px 16px rgba(136,136,136,0.04)',
              }}
              icon={<FontAwesomeIcon icon={faRocket} />}
            >
              <div className="milestone-content">
                <div className="milestone-header">
                  <div className="milestone-title-group">
                    <h3 className="milestone-title">What's Next?</h3>
                    <span className="milestone-year">Future</span>
                  </div>
                  <span className="milestone-status milestone-status-future">Upcoming</span>
                </div>
                
                <h4 className="milestone-subtitle">Future Goals &amp; Aspirations</h4>
                
                <p className="milestone-description">
                  Exploring emerging technologies, building impactful open-source projects, and 
                  continuously growing as a developer. The journey continues...
                </p>
              </div>
              <div className="milestone-glow"></div>
            </VerticalTimelineElement>

          </VerticalTimeline>
        </div>
      </div>
    </div>
  );
}

export default Timeline;