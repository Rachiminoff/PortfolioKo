import React from "react";
import '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faRocket } from '@fortawesome/free-solid-svg-icons';
import { faPython } from '@fortawesome/free-brands-svg-icons';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import '../assets/styles/Timeline.scss'

function Timeline() {
  return (
    <div id="history">
      <div className="items-container">
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          marginBottom: '2rem',
          letterSpacing: '-0.02em',
          color: 'white'
        }}>
          My Timeline
        </h1>
        <VerticalTimeline>

          {/* First Python Code */}
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{ 
              background: 'white', 
              color: 'rgb(39, 40, 34)',
              borderRadius: '12px'
            }}
            contentArrowStyle={{ borderRight: '7px solid white' }}
            date="First program"
            dateClassName="custom-date"
            iconStyle={{ 
              background: '#3776AB', 
              color: 'white',
              boxShadow: '0 0 0 4px rgba(55, 118, 171, 0.3)'
            }}
            icon={<FontAwesomeIcon icon={faPython} />}
          >
            <h3 className="vertical-timeline-element-title">
              Wrote my first line of code
            </h3>
            <h4 className="vertical-timeline-element-subtitle">
              Python
            </h4>
            <p>
              <code style={{
                background: '#f0f0f0',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontFamily: 'Courier Prime, monospace',
                fontSize: '0.9rem'
              }}>
                print("hello, world")
              </code>
            </p>
            <p style={{ marginTop: '0.8rem', fontSize: '0.9rem', opacity: 0.8 }}>
              The beginning of my programming journey
            </p>
          </VerticalTimelineElement>

          {/* Computer Science Start */}
          <VerticalTimelineElement
            className="vertical-timeline-element--education"
            contentStyle={{ 
              background: 'white', 
              color: 'rgb(39, 40, 34)',
              borderRadius: '12px'
            }}
            contentArrowStyle={{ borderRight: '7px solid white' }}
            date="2023 - present"
            dateClassName="custom-date"
            iconStyle={{ 
              background: '#5000ca', 
              color: 'white',
              boxShadow: '0 0 0 4px rgba(80, 0, 202, 0.3)'
            }}
            icon={<FontAwesomeIcon icon={faGraduationCap} />}
          >
            <h3 className="vertical-timeline-element-title">
              Started Computer Science
            </h3>
            <h4 className="vertical-timeline-element-subtitle">
              Cavite State University - Main Campus
            </h4>
            <p>
              Currently pursuing a degree in Computer Science. 
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '0.8rem',
              flexWrap: 'wrap'
            }}>
            </div>
          </VerticalTimelineElement>

          {/* Future Timeline Item */}
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{ 
              background: 'white', 
              color: 'rgb(39, 40, 34)',
              borderRadius: '12px',
              opacity: 0.7
            }}
            contentArrowStyle={{ borderRight: '7px solid white' }}
            date="Future"
            dateClassName="custom-date"
            iconStyle={{ 
              background: '#666', 
              color: 'white',
              boxShadow: '0 0 0 4px rgba(102, 102, 102, 0.3)'
            }}
            icon={<FontAwesomeIcon icon={faRocket} />}
          >
            <h3 className="vertical-timeline-element-title">
              What's Next?
            </h3>
            <h4 className="vertical-timeline-element-subtitle">
              Future Goals
            </h4>
            <p>
              Exploring new technologies, building impactful projects, and 
              growing as a developer.
            </p>
          </VerticalTimelineElement>

        </VerticalTimeline>
      </div>
    </div>
  );
}

export default Timeline;