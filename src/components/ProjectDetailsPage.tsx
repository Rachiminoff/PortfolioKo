import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { projectsData, Project } from '../types/projects.data';
import ProjectListModal from './ProjectListModal';
import '../assets/styles/ProjectDetailsPage.scss';

// ============================================================
// TABLE OF CONTENTS
// ============================================================
const TableOfContents: React.FC<{
  sections: Array<{ id: string; label: string; number: string }>;
}> = ({ sections }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-20% 0px -20% 0px' },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="toc-wrapper">
      <nav className="toc-container">
        {sections.map(({ id, label, number }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`toc-item ${activeId === id ? 'active' : ''}`}
            onClick={handleClick(id)}
          >
            <span className="toc-number">{number}</span>
            <span className="toc-label">{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

// ============================================================
// FIGURE / GALLERY
// ============================================================
const ProjectFigure: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setImageLoaded(false);
      }, 5000);
    };

    if (isHovering) {
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      startTimer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovering, images.length]);

  const nextSlide = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      setImageLoaded(false);
    },
    [images.length],
  );

  const prevSlide = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      setImageLoaded(false);
    },
    [images.length],
  );

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && images.length > 1) {
      nextSlide({ stopPropagation: () => {} } as React.MouseEvent);
    }
    if (isRightSwipe && images.length > 1) {
      prevSlide({ stopPropagation: () => {} } as React.MouseEvent);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <figure className="figure-wrapper">
      <div
        className="figure-wrapper"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={`figure-container ${isZoomed ? 'zoomed' : ''}`}>
          <div
            className="figure-main"
            onClick={() => setIsZoomed(!isZoomed)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!imageLoaded && <div className="image-skeleton" />}
            <img
              src={images[current]}
              alt={`${title} - figure ${current + 1}`}
              className={`figure-image ${imageLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              draggable={false}
            />
            <div className="figure-overlay">
              <span className="figure-hint">
                <Icon icon="mdi:expand" width={16} height={16} />
                <span className="hint-text">Expand</span>
              </span>
            </div>
            {images.length > 1 && (
              <>
                <button className="figure-nav prev" onClick={prevSlide} aria-label="Previous">
                  <Icon icon="mdi:chevron-left" width={22} height={22} />
                </button>
                <button className="figure-nav next" onClick={nextSlide} aria-label="Next">
                  <Icon icon="mdi:chevron-right" width={22} height={22} />
                </button>
                <div className="figure-counter">
                  {current + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="figure-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumb ${idx === current ? 'active' : ''}`}
                  onClick={() => {
                    setCurrent(idx);
                    setImageLoaded(false);
                  }}
                  aria-label={`Go to figure ${idx + 1}`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>
        {images.length > 1 && (
          <figcaption className="figure-caption">
            <span className="figure-label">
              Figure {current + 1} / {images.length}
            </span>
            {title} — interface overview
          </figcaption>
        )}
      </div>
    </figure>
  );
};

// ============================================================
// TECH CATEGORY
// ============================================================
const TechCategory: React.FC<{ category: string; items: string[] }> = ({ category, items }) => {
  const techIconMap: Record<string, string> = {
    React: 'mdi:react',
    TypeScript: 'mdi:language-typescript',
    JavaScript: 'mdi:language-javascript',
    'Node.js': 'mdi:nodejs',
    Laravel: 'mdi:laravel',
    PostgreSQL: 'mdi:database',
    MySQL: 'mdi:database',
    Docker: 'mdi:docker',
    'Tailwind CSS': 'mdi:tailwind',
    Firebase: 'mdi:firebase',
    WebSocket: 'mdi:api',
    Vite: 'mdi:lightning-bolt',
    SCSS: 'mdi:sass',
    Express: 'mdi:express',
    MongoDB: 'mdi:database',
    Redis: 'mdi:database',
    AWS: 'mdi:aws',
    Vercel: 'mdi:vercel',
    Netlify: 'mdi:netlify',
    PHP: 'mdi:language-php',
    Python: 'mdi:language-python',
    Dart: 'mdi:language-dart',
    Godot: 'mdi:gamepad-variant',
    GDScript: 'mdi:script',
    Blender: 'mdi:blender',
    FlutterFlow: 'mdi:google',
    Supabase: 'mdi:database',
    Playwright: 'mdi:playwright',
    BeautifulSoup: 'mdi:code-json',
    'Inertia.js': 'mdi:react',
    Zustand: 'mdi:react',
    PyPDF2: 'mdi:file-pdf-box',
    EbookLib: 'mdi:book',
    WeasyPrint: 'mdi:printer',
    Requests: 'mdi:web',
    Flutter: 'mdi:google',
    Expo: 'mdi:google',
    'React Navigation': 'mdi:react',
  };

  return (
    <div className="tech-category">
      <h4 className="tech-category-title">{category}</h4>
      <div className="tech-items">
        {items.map((tech, i) => (
          <span key={i} className="tech-chip">
            <Icon icon={techIconMap[tech] || 'mdi:code-tags'} width={16} height={16} />
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// HIGHLIGHT CARD
// ============================================================
const HighlightCard: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="highlight-card">
    <div className="highlight-icon">
      <Icon icon={icon} width={24} height={24} />
    </div>
    <h4 className="highlight-title">{title}</h4>
    <p className="highlight-description">{description}</p>
  </div>
);

// ============================================================
// FEATURE GROUP
// ============================================================
const FeatureGroup: React.FC<{ title: string; features: string[] }> = ({ title, features }) => (
  <div className="feature-group">
    <h4 className="feature-group-title">{title}</h4>
    <ul className="feature-group-list">
      {features.map((feature, i) => (
        <li key={i}>
          <Icon icon="mdi:check-circle" width={18} height={18} />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

// ============================================================
// DOCUMENTATION CALLOUT
// ============================================================
const DocsCallout: React.FC<{
  type: 'note' | 'tip' | 'impl' | 'future';
  children: React.ReactNode;
}> = ({ type, children }) => {
  const labels = {
    note: 'Note',
    tip: 'Tip',
    impl: 'Implementation Detail',
    future: 'Future Work',
  };

  return (
    <div className={`docs-callout callout-${type}`}>
      <span className="callout-label">{labels[type]}</span>
      <p className="callout-content">{children}</p>
    </div>
  );
};

// ============================================================
// SECTION HEADER
// ============================================================
const SectionHeader: React.FC<{ number: string; title: string }> = ({ number, title }) => (
  <div className="section-header">
    <span className="section-number">{number}</span>
    <h2 className="section-title">{title}</h2>
    <span className="section-divider" />
  </div>
);

// ============================================================
// ARCHITECTURE FLOW
// ============================================================
const ArchitectureFlow: React.FC<{ nodes: string[] }> = ({ nodes }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="architecture-flow" ref={ref}>
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          <div
            className={`arch-node ${i === Math.floor(nodes.length / 2) ? 'arch-highlight' : ''} ${visible ? 'visible' : ''}`}
          >
            {node}
          </div>
          {i < nodes.length - 1 && (
            <div className="arch-arrow">
              <Icon icon="mdi:arrow-down" width={20} height={20} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ============================================================
// UTILITY: Render text with paragraphs
// ============================================================
const renderTextWithParagraphs = (text: string) => {
  if (!text) return null;

  // Split by double newline or newline followed by space (for formatting)
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map((paragraph, index) => {
      // Trim whitespace and check if it's a heading-like line (ends with colon or is short)
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      // If it's a short line ending with colon, treat as a sub-heading
      if (trimmed.length < 60 && trimmed.endsWith(':')) {
        return (
          <p key={index} className="docs-text docs-subheading">
            <strong>{trimmed}</strong>
          </p>
        );
      }

      return (
        <p key={index} className="docs-text">
          {trimmed}
        </p>
      );
    })
    .filter(Boolean);
};

// ============================================================
// UTILITY: Extract architecture flow nodes and description
// ============================================================
const parseArchitecture = (architecture: string) => {
  if (!architecture) return { flowNodes: ['Application', 'Services', 'Database'], description: '' };

  // Split by double newline to separate flow from description
  const parts = architecture.split(/\n\s*\n/);

  // First part might contain the flow diagram (e.g., "Flutter → FlutterFlow → Supabase → Database")
  const firstPart = parts[0] || '';

  // Check if first part contains arrow indicators (→)
  if (firstPart.includes('→')) {
    // Extract flow nodes from the first line
    const flowLine = firstPart.split('\n')[0].trim();
    const nodes = flowLine.split('→').map((node) => node.trim());

    // The rest is the description
    const description =
      parts.slice(1).join('\n\n') || firstPart.split('\n').slice(1).join('\n').trim();

    return { flowNodes: nodes, description };
  }

  // If no arrows, try to extract from architecture text
  const lines = architecture.split('\n').filter((line) => line.trim().length > 0);
  const potentialNodes = lines.slice(0, 6).map((line) => {
    const words = line.split(' ');
    if (words.length > 6) {
      const keyTerms = [
        'Laravel',
        'React',
        'Inertia',
        'Flutter',
        'Supabase',
        'Godot',
        'Python',
        'MySQL',
        'PostgreSQL',
        'MongoDB',
        'Node.js',
        'Express',
        'Docker',
        'AWS',
        'Vercel',
        'Netlify',
        'Playwright',
        'BeautifulSoup',
        'FlutterFlow',
        'GDScript',
        'Blender',
        'PHP',
        'TypeScript',
        'Expo',
        'React Native',
      ];
      for (const term of keyTerms) {
        if (line.includes(term)) {
          return term;
        }
      }
      return words.slice(0, 2).join(' ');
    }
    return line.trim().replace(/[.:]$/, '');
  });

  return {
    flowNodes: potentialNodes.length > 0 ? potentialNodes : ['Application', 'Services', 'Database'],
    description: architecture,
  };
};

// ============================================================
// MAIN PROJECT DETAILS PAGE
// ============================================================
const ProjectDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);

  const tocSections = [
    { id: 'overview', label: 'Overview', number: '01' },
    { id: 'highlights', label: 'Highlights', number: '02' },
    { id: 'tech-stack', label: 'Tech Stack', number: '03' },
    { id: 'features', label: 'Features', number: '04' },
    { id: 'development', label: 'Development', number: '05' },
    { id: 'architecture', label: 'Architecture', number: '06' },
    { id: 'resources', label: 'Resources', number: '07' },
  ];

  useEffect(() => {
    setMounted(true);

    // Add class to body to hide navbar
    document.body.classList.add('hide-navbar');

    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      const found = projectsData.find(
        (p) => (p.slug || p.title.toLowerCase().replace(/\s+/g, '-')) === slug,
      );
      if (found) {
        setProject(found);
        setLoading(false);
      } else {
        navigate('/projects', { replace: true });
      }
    }
  }, [slug, navigate, mounted]);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setShowBackButton(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Find next and previous projects
  const getAdjacentProjects = (currentProject: Project) => {
    const index = projectsData.findIndex((p) => p.id === currentProject.id);
    const prev = index > 0 ? projectsData[index - 1] : null;
    const next = index < projectsData.length - 1 ? projectsData[index + 1] : null;
    return { prev, next };
  };

  if (!mounted || loading) {
    return (
      <div className="project-details-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!project) return null;

  const statusColor = {
    Active: '#2dd4bf',
    Completed: '#2dd4bf',
    'In Development': '#2dd4bf',
    Archived: '#6b7280',
  };

  const techCategories: { [key: string]: string[] } = {
    Frontend: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Inertia.js', 'Zustand'],
    Backend: ['Node.js', 'Express', 'Laravel', 'PHP', 'Python'],
    Database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase'],
    Mobile: ['Flutter', 'Dart', 'FlutterFlow', 'Expo', 'React Native'],
    'Game Development': ['Godot', 'GDScript', 'Blender'],
    DevOps: ['Docker', 'AWS', 'Vercel', 'Netlify'],
    Tools: [
      'Playwright',
      'BeautifulSoup',
      'PyPDF2',
      'EbookLib',
      'WeasyPrint',
      'Requests',
      'React Navigation',
    ],
  };

  const categorizedTech = Object.entries(techCategories).reduce(
    (acc, [category, items]) => {
      const filtered = items.filter((tech) => project.tech.includes(tech));
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as { [key: string]: string[] },
  );

  // Parse architecture for flow nodes and description
  const { flowNodes, description: architectureDescription } = parseArchitecture(
    project.architecture || '',
  );

  const { prev, next } = getAdjacentProjects(project);

  return (
    <div className="project-details-page">
      {/* Table of Contents */}
      <TableOfContents sections={tocSections} />

      {/* Sticky Back Button */}
      <div className={`back-button-container ${showBackButton ? 'visible' : ''}`}>
        <Link to="/projects" className="back-button sticky-back">
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back to Projects</span>
        </Link>
      </div>

      <div className="documentation-layout">
        {/* ========== ARTICLE HEADER ========== */}
        <header className="article-header" ref={heroRef}>
          <Link to="/projects" className="back-button hero-back">
            <Icon icon="mdi:arrow-left" width={18} height={18} />
            <span>Back to Projects</span>
          </Link>

          <div className="article-meta">
            <span className="meta-tag">{project.role}</span>
            <span
              className="meta-tag meta-tag-status"
              style={{
                backgroundColor: `${statusColor[project.status as keyof typeof statusColor]}15`,
                color: statusColor[project.status as keyof typeof statusColor],
              }}
            >
              <span
                className="status-dot"
                style={{ backgroundColor: statusColor[project.status as keyof typeof statusColor] }}
              />
              {project.status}
            </span>
            <span className="meta-tag meta-tag-duration">
              <Icon icon="mdi:clock-outline" width={14} height={14} className="icon-clock" />
              {project.duration}
            </span>
          </div>

          <h1 className="article-title">{project.title}</h1>
          <p className="article-subtitle">{project.subtitle}</p>
          <p className="article-excerpt">{project.description}</p>

          <div className="article-actions">
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="action-link action-primary"
            >
              <Icon icon="mdi:github" width={18} height={18} />
              Source Code
            </a>
            {project.liveDemo && (
              <a
                href={project.liveDemo}
                target="_blank"
                rel="noreferrer"
                className="action-link action-secondary"
              >
                <Icon icon="mdi:open-in-new" width={18} height={18} />
                Live Demo
              </a>
            )}
            {project.itchLink && (
              <a
                href={project.itchLink}
                target="_blank"
                rel="noreferrer"
                className="action-link action-secondary"
              >
                <Icon icon="mdi:download" width={18} height={18} />
                Download
              </a>
            )}
          </div>
        </header>

        {/* ========== FIGURE / GALLERY ========== */}
        {project.images && project.images.length > 0 && (
          <ProjectFigure images={project.images} title={project.title} />
        )}
        {!project.images && project.video && (
          <div className="video-container">
            <iframe
              width="100%"
              height="100%"
              src={project.video}
              title={`${project.title} demo video`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}

        {/* ========== OVERVIEW ========== */}
        <section className="docs-section overview-section" id="overview">
          <SectionHeader number="01" title="Overview" />
          <div className="docs-body">
            {renderTextWithParagraphs(project.overview || project.description)}
          </div>
        </section>

        {/* ========== HIGHLIGHTS ========== */}
        {project.highlights && project.highlights.length > 0 && (
          <section className="docs-section" id="highlights">
            <SectionHeader number="02" title="Highlights" />
            <div className="highlights-grid">
              {project.highlights.map((highlight, idx) => (
                <HighlightCard
                  key={idx}
                  icon={highlight.icon}
                  title={highlight.title}
                  description={highlight.description}
                />
              ))}
            </div>
          </section>
        )}

        {/* ========== TECH STACK ========== */}
        <section className="docs-section" id="tech-stack">
          <SectionHeader number="03" title="Tech Stack" />
          <div className="tech-stack-container">
            {Object.entries(categorizedTech).length > 0 ? (
              Object.entries(categorizedTech).map(([category, items]) => (
                <TechCategory key={category} category={category} items={items} />
              ))
            ) : (
              <div className="tech-stack-grid">
                {project.tech.map((tech, i) => (
                  <span key={i} className="tech-chip">
                    <Icon icon="mdi:code-tags" width={16} height={16} />
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section className="docs-section" id="features">
          <SectionHeader number="04" title="Features" />
          <div className="features-grid">
            <FeatureGroup
              title="Core Features"
              features={project.features.slice(0, Math.ceil(project.features.length / 2))}
            />
            <FeatureGroup
              title="Additional Features"
              features={project.features.slice(Math.ceil(project.features.length / 2))}
            />
          </div>
        </section>

        {/* ========== DEVELOPMENT NOTES ========== */}
        {project.devNotes && project.devNotes.length > 0 && (
          <section className="docs-section" id="development">
            <SectionHeader number="05" title="Development Notes" />
            <div className="docs-body">
              {project.devNotes.map((note, i) => {
                // Determine callout type based on note content
                let type: 'note' | 'tip' | 'impl' | 'future' = 'note';
                if (
                  note.toLowerCase().includes('future') ||
                  note.toLowerCase().includes('iterations') ||
                  note.toLowerCase().includes('improvements')
                ) {
                  type = 'future';
                } else if (
                  note.toLowerCase().includes('implement') ||
                  note.toLowerCase().includes('built') ||
                  note.toLowerCase().includes('selected')
                ) {
                  type = 'impl';
                } else if (
                  note.toLowerCase().includes('tip') ||
                  note.toLowerCase().includes('suggestion')
                ) {
                  type = 'tip';
                }
                return (
                  <DocsCallout key={i} type={type}>
                    {note}
                  </DocsCallout>
                );
              })}
            </div>
          </section>
        )}

        {/* ========== ARCHITECTURE ========== */}
        {project.architecture && (
          <section className="docs-section" id="architecture">
            <SectionHeader number="06" title="Architecture" />
            <div className="docs-body">
              <p className="docs-text">
                The application follows a clear architectural flow with well-defined layers:
              </p>
              <ArchitectureFlow nodes={flowNodes} />
              {architectureDescription && (
                <>
                  <p className="docs-text" style={{ marginTop: 'var(--space-xl)' }}>
                    Each component plays a specific role in the system:
                  </p>
                  {renderTextWithParagraphs(architectureDescription)}
                </>
              )}
            </div>
          </section>
        )}

        {/* ========== RESOURCES ========== */}
        <section className="docs-section" id="resources">
          <SectionHeader number="07" title="Resources" />
          <div className="resources-grid">
            <a href={project.link} target="_blank" rel="noreferrer" className="resource-card">
              <Icon icon="mdi:github" width={22} height={22} />
              <span className="resource-label">GitHub Repository</span>
              <span className="resource-arrow">
                <Icon icon="mdi:arrow-right" width={16} height={16} />
              </span>
            </a>
            {project.liveDemo && (
              <a href={project.liveDemo} target="_blank" rel="noreferrer" className="resource-card">
                <Icon icon="mdi:open-in-new" width={22} height={22} />
                <span className="resource-label">Live Demo</span>
                <span className="resource-arrow">
                  <Icon icon="mdi:arrow-right" width={16} height={16} />
                </span>
              </a>
            )}
            {project.itchLink && (
              <a href={project.itchLink} target="_blank" rel="noreferrer" className="resource-card">
                <Icon icon="mdi:download" width={22} height={22} />
                <span className="resource-label">Download Demo</span>
                <span className="resource-arrow">
                  <Icon icon="mdi:arrow-right" width={16} height={16} />
                </span>
              </a>
            )}
          </div>
        </section>

        {/* ========== ARTICLE NAVIGATION ========== */}
        <nav className="article-navigation">
          <div className="nav-container">
            {prev ? (
              <Link
                to={`/projects/${prev.slug || prev.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="nav-link nav-link-prev"
              >
                <span className="nav-label">
                  <Icon icon="mdi:arrow-left" width={16} height={16} />
                  Previous
                </span>
                <span className="nav-title">{prev.title}</span>
              </Link>
            ) : (
              <div className="nav-placeholder" />
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="nav-link nav-link-all"
              aria-label="Open project list"
            >
              <Icon icon="mdi:grid" width={18} height={18} />
              <span>All Projects</span>
            </button>

            {next ? (
              <Link
                to={`/projects/${next.slug || next.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="nav-link nav-link-next"
              >
                <span className="nav-label">
                  Next
                  <Icon icon="mdi:arrow-right" width={16} height={16} />
                </span>
                <span className="nav-title">{next.title}</span>
              </Link>
            ) : (
              <div className="nav-placeholder" />
            )}
          </div>
        </nav>

        {/* ========== FOOTER ========== */}
        <footer className="docs-footer">
          <div className="footer-content">
            <h2 className="footer-title">Interested in this project?</h2>
            <p className="footer-description">
              Explore the source code, try the live demo, or reach out to discuss how we can build
              something similar together.
            </p>
            <div className="footer-actions">
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="footer-link footer-primary"
              >
                <Icon icon="mdi:github" width={20} height={20} />
                View Source
              </a>
              <a href="mailto:tdy.alhassan@gmail.com" className="footer-link footer-secondary">
                <Icon icon="mdi:email-outline" width={20} height={20} />
                Let's Talk
              </a>
              <button onClick={() => setIsModalOpen(true)} className="footer-link footer-tertiary">
                <Icon icon="mdi:grid" width={18} height={18} />
                All Projects
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Project List Modal */}
      <ProjectListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default ProjectDetailsPage;
