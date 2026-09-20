import React, { useState, useRef, MouseEvent } from 'react';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';

import '../assets/styles/Expertise.scss';

interface Tech {
  name: string;
  icon: string;
  color: string;
  category: string;
  description: string;
}

const categoryColors: Record<string, string> = {
  Frontend: '#61DAFB',
  Backend: '#FF2D20',
  'Game Dev': '#478CBF',
  Automation: '#3776AB',
  Tools: '#F05032',
  AI: '#8B5CF6',
};

const techStack: Tech[] = [
  // Frontend & Mobile
  {
    name: 'React',
    icon: 'logos:react',
    color: '#61DAFB',
    category: 'Frontend',
    description: 'Building interactive UIs with hooks and context',
  },
  {
    name: 'TypeScript',
    icon: 'logos:typescript-icon',
    color: '#3178C6',
    category: 'Frontend',
    description: 'Type-safe JavaScript for scalable applications',
  },
  {
    name: 'Tailwind CSS',
    icon: 'logos:tailwindcss-icon',
    color: '#06B6D4',
    category: 'Frontend',
    description: 'Utility-first CSS framework for rapid UI development',
  },
  {
    name: 'React Native',
    icon: 'logos:react',
    color: '#61DAFB',
    category: 'Frontend',
    description: 'Cross-platform mobile development',
  },
  {
    name: 'FlutterFlow',
    icon: 'logos:flutter',
    color: '#02569B',
    category: 'Frontend',
    description: 'Low-code Flutter development',
  },
  {
    name: 'HTML5',
    icon: 'logos:html-5',
    color: '#E34F26',
    category: 'Frontend',
    description: 'Semantic markup and web standards',
  },
  {
    name: 'CSS3',
    icon: 'logos:css-3',
    color: '#1572B6',
    category: 'Frontend',
    description: 'Modern styling and animations',
  },
  {
    name: 'JavaScript',
    icon: 'logos:javascript',
    color: '#F7DF1E',
    category: 'Frontend',
    description: 'Core web development language',
  },

  // Backend & Database
  {
    name: 'Laravel',
    icon: 'logos:laravel',
    color: '#FF2D20',
    category: 'Backend',
    description: 'PHP framework for building modern web applications',
  },
  {
    name: 'PHP',
    icon: 'logos:php',
    color: '#777BB4',
    category: 'Backend',
    description: 'Server-side scripting language',
  },
  {
    name: 'Node.js',
    icon: 'logos:nodejs',
    color: '#339933',
    category: 'Backend',
    description: 'JavaScript runtime for server-side applications',
  },
  {
    name: 'PostgreSQL',
    icon: 'logos:postgresql',
    color: '#4169E1',
    category: 'Backend',
    description: 'Advanced relational database management',
  },
  {
    name: 'Supabase',
    icon: 'logos:supabase-icon',
    color: '#3ECF8E',
    category: 'Backend',
    description: 'PostgreSQL with real-time capabilities',
  },
  {
    name: 'SQLite',
    icon: 'logos:sqlite',
    color: '#003B57',
    category: 'Backend',
    description: 'Lightweight embedded database',
  },
  {
    name: 'MySQL',
    icon: 'logos:mysql',
    color: '#4479A1',
    category: 'Backend',
    description: 'Relational database management',
  },

  // Game Development
  {
    name: 'Godot',
    icon: 'logos:godot-icon',
    color: '#478CBF',
    category: 'Game Dev',
    description: 'Open-source game engine',
  },
  {
    name: 'GDScript',
    icon: 'logos:godot-icon',
    color: '#478CBF',
    category: 'Game Dev',
    description: 'Python-like game scripting',
  },
  {
    name: 'Blender',
    icon: 'logos:blender',
    color: '#F5792A',
    category: 'Game Dev',
    description: '3D modeling and animation',
  },

  // Automation & Scripting
  {
    name: 'Python',
    icon: 'logos:python',
    color: '#3776AB',
    category: 'Automation',
    description: 'Versatile scripting and automation',
  },
  {
    name: 'Playwright',
    icon: 'logos:playwright',
    color: '#2EAD33',
    category: 'Automation',
    description: 'Automated browser testing',
  },
  {
    name: 'BeautifulSoup',
    icon: 'logos:python',
    color: '#4B8BBE',
    category: 'Automation',
    description: 'Web scraping and parsing',
  },

  // Tools
  {
    name: 'Vite',
    icon: 'logos:vitejs',
    color: '#646CFF',
    category: 'Tools',
    description: 'Next-generation frontend build tool',
  },
  {
    name: 'VS Code',
    icon: 'logos:visual-studio-code',
    color: '#007ACC',
    category: 'Tools',
    description: 'Lightweight but powerful source code editor',
  },
  {
    name: 'Git',
    icon: 'logos:git-icon',
    color: '#F05032',
    category: 'Tools',
    description: 'Version control system',
  },
  {
    name: 'GitHub',
    icon: 'mdi:github',
    color: '#FFFFFF',
    category: 'Tools',
    description: 'Collaborative development platform',
  },
  {
    name: 'Dart',
    icon: 'logos:dart',
    color: '#00B4AB',
    category: 'Tools',
    description: 'Optimized for UI development',
  },
  {
    name: 'Flutter',
    icon: 'logos:flutter',
    color: '#02569B',
    category: 'Tools',
    description: 'Cross-platform UI framework',
  },
  {
    name: 'Pandoc',
    icon: 'logos:pandoc',
    color: '#2C3E50',
    category: 'Tools',
    description: 'Universal document converter',
  },
  {
    name: 'Vercel',
    icon: 'simple-icons:vercel',
    color: '#FFFFFF',
    category: 'Tools',
    description: 'Deployment and hosting platform',
  },

  // AI & LLMs
  {
    name: 'AI & LLMs',
    icon: 'mdi:brain',
    color: '#8B5CF6',
    category: 'AI',
    description: 'Working with language models and AI tools',
  },
  {
    name: 'Prompt Engineering',
    icon: 'mdi:robot-outline',
    color: '#8B5CF6',
    category: 'AI',
    description: 'Crafting structured prompts for LLMs',
  },
];

const categories = [
  { name: 'Frontend', color: '#35C2FF', code: '01' },
  { name: 'Backend', color: '#F04438', code: '02' },
  { name: 'Game Dev', color: '#F2C94C', code: '03' },
  { name: 'Automation', color: '#4D8DFF', code: '04' },
  { name: 'Tools', color: '#FF7A45', code: '05' },
  { name: 'AI', color: '#A66BFF', code: '06' },
];

function Expertise() {
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null);
  const [hoveredTech, setHoveredTech] = useState<Tech | null>(null);
  const { ref, inView } = useInView({ threshold: 0.08, triggerOnce: true });

  const handleTechClick = (tech: Tech) => {
    setSelectedTech((current) => (current?.name === tech.name ? null : tech));
  };

  const rows = [
    techStack.filter((_, index) => index % 2 === 0),
    techStack.filter((_, index) => index % 2 !== 0),
  ];

  return (
    <section
      className={`expertise-container ${inView ? 'visible' : ''}`}
      id="expertise"
      ref={ref}
      aria-labelledby="expertise-title"
    >
      <header className="expertise-header">
        <div className="expertise-kicker-row">
          <span className="header-tag">SECTION 03 / EXPERTISE</span>
          <span className="header-index">TECH / INDEX</span>
        </div>

        <div className="expertise-title-grid">
          <div>
            <p className="expertise-overline">TOOLS / SYSTEMS / STACK</p>
            <h1 id="expertise-title">Expertise</h1>
            <p className="expertise-subtitle">
              A moving index of the technologies I use to design, build, automate, and ship.
            </p>
          </div>
        </div>

        <div className="expertise-rule" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>

      <div className="expertise-scroll-label">
        <span>TECHNOLOGY INDEX</span>
        <span>CONTINUOUS / 02 ROWS</span>
      </div>

      <div className="expertise-marquee" aria-label="Technology index">
        {rows.map((row, rowIndex) => {
          const repeated = [...row, ...row];
          return (
            <div className={`expertise-track ${rowIndex === 1 ? 'is-reverse' : ''}`} key={rowIndex}>
              {repeated.map((tech, index) => {
                const category = categories.find((item) => item.name === tech.category);
                const selected = selectedTech?.name === tech.name;
                const isMonochrome = tech.icon.includes('github') || tech.icon.includes('vercel');
                return (
                  <button
                    type="button"
                    key={`${tech.name}-${index}`}
                    className={`tech-item ${selected ? 'is-selected' : ''}`}
                    style={{ '--tech-color': category?.color || tech.color } as React.CSSProperties}
                    onClick={() => handleTechClick(tech)}
                    onMouseEnter={() => setHoveredTech(tech)}
                    onMouseLeave={() => setHoveredTech(null)}
                    onFocus={() => setHoveredTech(tech)}
                    onBlur={() => setHoveredTech(null)}
                    aria-expanded={selected}
                    aria-label={`${tech.name}: ${tech.description}`}
                  >
                    <span className="tech-icon-wrapper">
                      <Icon
                        icon={tech.icon}
                        className={`tech-icon ${isMonochrome ? 'is-monochrome' : ''}`}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="tech-copy">
                      <span className="tech-name">{tech.name}</span>
                      <span className="tech-category">{tech.category}</span>
                    </span>
                    <span className="tech-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div
        className={`expertise-context ${hoveredTech || selectedTech ? 'is-visible' : ''}`}
        aria-live="polite"
      >
        {(hoveredTech || selectedTech) && (
          <>
            <span className="context-label">{(hoveredTech || selectedTech)?.category}</span>
            <strong>{(hoveredTech || selectedTech)?.name}</strong>
            <span className="context-description">
              {(hoveredTech || selectedTech)?.description}
            </span>
          </>
        )}
      </div>

      <footer className="expertise-footer">
        <div className="legend">
          {categories.map((category) => (
            <span className="legend-item" key={category.name}>
              <i style={{ backgroundColor: category.color }} />
              {category.name}
            </span>
          ))}
        </div>
      </footer>
    </section>
  );
}

export default Expertise;
