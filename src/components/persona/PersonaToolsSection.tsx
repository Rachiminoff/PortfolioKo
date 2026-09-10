import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import PersonaSectionHeader from './PersonaSectionHeader';

const PersonaToolsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="persona-tools" id="common-tools" aria-labelledby="persona-tools-title">
      <PersonaSectionHeader
        index="05 / COMMON TOOLS"
        title="COMMON TOOLS"
        note="OTHER ARCHIVE CORNERS I KEEP AROUND"
        id="persona-tools-title"
      />

      <div className="persona-tools-grid">
        <button
          type="button"
          className="persona-tool-card"
          onClick={() => navigate('/wish-archive?tab=analytics')}
          aria-label="Open Wish Stats"
        >
          <span className="persona-tool-icon" aria-hidden="true">
            <Icon icon="mdi:archive-star-outline" width={38} height={38} />
          </span>
          <span className="persona-tool-copy">
            <span className="persona-meta">ARCHIVE TOOL</span>
            <strong>Wish Stats</strong>
            <small>Track pulls, luck, characters, and collection statistics.</small>
          </span>
          <Icon className="persona-tool-arrow" icon="mdi:arrow-top-right" width={22} />
        </button>
      </div>
    </section>
  );
};

export default PersonaToolsSection;
