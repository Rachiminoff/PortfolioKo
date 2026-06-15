import React from "react";
import '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { faPython } from '@fortawesome/free-brands-svg-icons'; // ✅ add this
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import '../assets/styles/Timeline.scss'

function Timeline() {
  return (
    <div id="history">
      <div className="items-container">
        <h1>Timeline</h1>
        <VerticalTimeline>

          {/* First Python Code */}
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            contentStyle={{ background: 'white', color: 'rgb(39, 40, 34)' }}
            contentArrowStyle={{ borderRight: '7px solid white' }}
            date="First program"
            iconStyle={{ background: '#3776AB', color: 'white' }}
            icon={<FontAwesomeIcon icon={faPython} />}
          >
            <h3 className="vertical-timeline-element-title">
              Wrote my first line of code
            </h3>
            <h4 className="vertical-timeline-element-subtitle">
              Python
            </h4>
            <p>
              <code>print("hello, world")</code>
            </p>
          </VerticalTimelineElement>

          {/* Computer Science Start */}
          <VerticalTimelineElement
            className="vertical-timeline-element--education"
            contentStyle={{ background: 'white', color: 'rgb(39, 40, 34)' }}
            contentArrowStyle={{ borderRight: '7px solid white' }}
            date="2023 - present"
            iconStyle={{ background: '#5000ca', color: 'white' }}
            icon={<FontAwesomeIcon icon={faGraduationCap} />}
          >
            <h3 className="vertical-timeline-element-title">Started Computer Science</h3>
            <h4 className="vertical-timeline-element-subtitle">Cavite State University - Main Campus</h4>
            <p>
              Currently pursuing a degree in Computer Science. Focused on software development, tooling, and practical projects.
            </p>
          </VerticalTimelineElement>

        </VerticalTimeline>
      </div>
    </div>
  );
}

export default Timeline;