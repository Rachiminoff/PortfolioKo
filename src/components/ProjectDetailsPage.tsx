import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { projectsData, Project } from '../types/projects.data';
import '../assets/styles/ProjectDetailsPage.scss';

// ============================================================
// IMAGE GALLERY - PREMIUM
// ============================================================
const ProjectGallery: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
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

    const nextSlide = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrent((prev) => prev === images.length - 1 ? 0 : prev + 1);
        setImageLoaded(false);
    }, [images.length]);

    const prevSlide = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrent((prev) => prev === 0 ? images.length - 1 : prev - 1);
        setImageLoaded(false);
    }, [images.length]);

    // Handle touch swipe
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
        <div 
            className="gallery-wrapper"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className={`gallery-container ${isZoomed ? 'zoomed' : ''}`}>
                <div 
                    className="gallery-main" 
                    onClick={() => setIsZoomed(!isZoomed)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {!imageLoaded && <div className="image-skeleton" />}
                    <img
                        src={images[current]}
                        alt={`${title} - screenshot ${current + 1}`}
                        className={`gallery-image ${imageLoaded ? 'loaded' : ''}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        draggable={false}
                    />
                    <div className="gallery-overlay">
                        <span className="gallery-hint">
                            <Icon icon="mdi:expand" width={16} height={16} />
                            <span className="hint-text">Tap to expand</span>
                        </span>
                    </div>
                    {images.length > 1 && (
                        <>
                            <button className="gallery-nav prev" onClick={prevSlide} aria-label="Previous image">
                                <Icon icon="mdi:chevron-left" width={22} height={22} />
                            </button>
                            <button className="gallery-nav next" onClick={nextSlide} aria-label="Next image">
                                <Icon icon="mdi:chevron-right" width={22} height={22} />
                            </button>
                            <div className="gallery-counter">
                                {current + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>
                {images.length > 1 && (
                    <div className="gallery-thumbnails">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                className={`thumbnail ${idx === current ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrent(idx);
                                    setImageLoaded(false);
                                }}
                                aria-label={`Go to image ${idx + 1}`}
                            >
                                <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" draggable={false} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// TECH CATEGORY
// ============================================================
const TechCategory: React.FC<{ category: string; items: string[] }> = ({ category, items }) => {
    const techIconMap: Record<string, string> = {
        'React': 'mdi:react',
        'TypeScript': 'mdi:language-typescript',
        'JavaScript': 'mdi:language-javascript',
        'Node.js': 'mdi:nodejs',
        'Laravel': 'mdi:laravel',
        'PostgreSQL': 'mdi:database',
        'MySQL': 'mdi:database',
        'Docker': 'mdi:docker',
        'Tailwind CSS': 'mdi:tailwind',
        'Firebase': 'mdi:firebase',
        'WebSocket': 'mdi:api',
        'Vite': 'mdi:lightning-bolt',
        'SCSS': 'mdi:sass',
        'Express': 'mdi:express',
        'MongoDB': 'mdi:database',
        'Redis': 'mdi:database',
        'AWS': 'mdi:aws',
        'Vercel': 'mdi:vercel',
        'Netlify': 'mdi:netlify',
        'PHP': 'mdi:language-php',
        'Python': 'mdi:language-python',
        'Dart': 'mdi:language-dart',
        'Godot': 'mdi:gamepad-variant',
        'GDScript': 'mdi:script',
        'Blender': 'mdi:blender',
        'FlutterFlow': 'mdi:google',
        'Supabase': 'mdi:database',
        'Playwright': 'mdi:playwright',
        'BeautifulSoup': 'mdi:code-json',
        'Inertia.js': 'mdi:react',
        'Zustand': 'mdi:react',
        'PyPDF2': 'mdi:file-pdf-box'
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
    icon, title, description 
}) => (
    <div className="highlight-card">
        <div className="highlight-icon-wrapper">
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
// SECTION TITLE COMPONENT
// ============================================================
const SectionTitle: React.FC<{ number: string; title: string }> = ({ number, title }) => (
    <div className="section-title-wrapper">
        <span className="section-number">{number}</span>
        <h2 className="section-title">{title}</h2>
        <span className="section-accent" />
    </div>
);

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
    const heroRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            const found = projectsData.find(
                p => (p.slug || p.title.toLowerCase().replace(/\s+/g, '-')) === slug
            );
            if (found) {
                setProject(found);
                setLoading(false);
            } else {
                navigate('/projects', { replace: true });
            }
        }
    }, [slug, navigate, mounted]);

    // Handle scroll for sticky back button
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

    if (!mounted || loading) {
        return (
            <div className="project-details-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!project) return null;

    const statusColor = {
        'Active': '#2dd4bf',
        'Completed': '#2dd4bf',
        'In Development': '#2dd4bf',
        'Archived': '#6b7280'
    };

    // Organize tech stack by category
    const techCategories: { [key: string]: string[] } = {
        'Frontend': ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Inertia.js', 'Zustand'],
        'Backend': ['Node.js', 'Express', 'Laravel', 'PHP', 'Python'],
        'Database': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase'],
        'Mobile': ['FlutterFlow', 'Dart'],
        'Game Development': ['Godot', 'GDScript', 'Blender'],
        'DevOps': ['Docker', 'AWS', 'Vercel', 'Netlify'],
        'Tools': ['Playwright', 'BeautifulSoup', 'PyPDF2']
    };

    // Filter tech that exists in project
    const categorizedTech = Object.entries(techCategories).reduce((acc, [category, items]) => {
        const filtered = items.filter(tech => project.tech.includes(tech));
        if (filtered.length > 0) {
            acc[category] = filtered;
        }
        return acc;
    }, {} as { [key: string]: string[] });

    return (
        <div className="project-details-page">
            {/* Back Button - Sticky */}
            <div className={`back-button-container ${showBackButton ? 'visible' : ''}`}>
                <Link to="/projects" className="back-button sticky-back">
                    <Icon icon="mdi:arrow-left" width={18} height={18} />
                    <span>Back to Projects</span>
                </Link>
            </div>

            {/* ========== HERO SECTION ========== */}
            <section className="details-hero" id="hero" ref={heroRef}>
                <Link to="/projects" className="back-button hero-back">
                    <Icon icon="mdi:arrow-left" width={18} height={18} />
                    <span>Back to Projects</span>
                </Link>

                {/* Gallery or Video */}
                {project.images && project.images.length > 0 && (
                    <ProjectGallery images={project.images} title={project.title} />
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
                        ></iframe>
                    </div>
                )}

                <div className="hero-content">
                    {/* Meta Badges */}
                    <div className="hero-meta">
                        <span className="role-badge">{project.role}</span>
                        <span className="status-badge" style={{ 
                            backgroundColor: `${statusColor[project.status as keyof typeof statusColor]}15`,
                            color: statusColor[project.status as keyof typeof statusColor]
                        }}>
                            <span className="status-dot" style={{ backgroundColor: statusColor[project.status as keyof typeof statusColor] }} />
                            {project.status}
                        </span>
                        <span className="duration-badge">
                            <Icon icon="mdi:clock-outline" width={14} height={14} />
                            {project.duration}
                        </span>
                    </div>

                    <h1 className="hero-title">{project.title}</h1>
                    <p className="hero-subtitle">{project.subtitle}</p>
                    <p className="hero-description">{project.description}</p>
                    
                    {/* Action Buttons */}
                    <div className="hero-actions">
                        <a href={project.link} target="_blank" rel="noreferrer" className="btn-primary">
                            <Icon icon="mdi:github" width={18} height={18} />
                            Source Code
                        </a>
                        {project.liveDemo && (
                            <a href={project.liveDemo} target="_blank" rel="noreferrer" className="btn-secondary">
                                <Icon icon="mdi:open-in-new" width={18} height={18} />
                                Live Demo
                            </a>
                        )}
                        {project.itchLink && (
                            <a href={project.itchLink} target="_blank" rel="noreferrer" className="btn-secondary">
                                <Icon icon="mdi:download" width={18} height={18} />
                                Download
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ========== OVERVIEW SECTION ========== */}
            <section className="details-section overview-section" id="overview">
                <div className="section-container">
                    <SectionTitle number="01" title="Overview" />
                    <div className="overview-content">
                        <p className="overview-text">{project.overview || project.description}</p>
                    </div>
                </div>
            </section>

            {/* ========== HIGHLIGHTS SECTION ========== */}
            {project.highlights && project.highlights.length > 0 && (
                <section className="details-section highlights-section" id="highlights">
                    <div className="section-container">
                        <SectionTitle number="02" title="Highlights" />
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
                    </div>
                </section>
            )}

            {/* ========== TECH STACK SECTION ========== */}
            <section className="details-section tech-section" id="tech-stack">
                <div className="section-container">
                    <SectionTitle number="03" title="Tech Stack" />
                    <div className="tech-stack-container">
                        {Object.entries(categorizedTech).map(([category, items]) => (
                            <TechCategory key={category} category={category} items={items} />
                        ))}
                        {Object.keys(categorizedTech).length === 0 && (
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
                </div>
            </section>

            {/* ========== FEATURES SECTION ========== */}
            <section className="details-section features-section" id="features">
                <div className="section-container">
                    <SectionTitle number="04" title="Features" />
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
                </div>
            </section>

            {/* ========== DEVELOPMENT NOTES ========== */}
            {project.devNotes && project.devNotes.length > 0 && (
                <section className="details-section dev-notes-section" id="development">
                    <div className="section-container">
                        <SectionTitle number="05" title="Development Notes" />
                        <div className="dev-notes-content">
                            {project.devNotes.map((note, i) => (
                                <div key={i} className="dev-note">
                                    <Icon icon="mdi:note-text" width={18} height={18} />
                                    <p>{note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ========== ARCHITECTURE ========== */}
            {project.architecture && (
                <section className="details-section architecture-section" id="architecture">
                    <div className="section-container">
                        <SectionTitle number="06" title="Architecture" />
                        <div className="architecture-content">
                            <pre className="architecture-code">
                                <code>{project.architecture}</code>
                            </pre>
                        </div>
                    </div>
                </section>
            )}

            {/* ========== RESOURCES SECTION ========== */}
            <section className="details-section resources-section" id="resources">
                <div className="section-container">
                    <SectionTitle number="07" title="Resources" />
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
                </div>
            </section>

            {/* ========== PREMIUM ENDING / CTA ========== */}
            <section className="details-section cta-section" id="cta">
                <div className="section-container cta-container">
                    <div className="cta-divider" />
                    <div className="cta-content">
                        <h2 className="cta-title">Interested in this project?</h2>
                        <p className="cta-description">
                            Explore the source code, try the live demo, or reach out to discuss how we can build something similar together.
                        </p>
                        <div className="cta-actions">
                            <a href={project.link} target="_blank" rel="noreferrer" className="cta-primary">
                                <Icon icon="mdi:github" width={20} height={20} />
                                View Source
                            </a>
                            <a href="mailto:tdy.alhassan@gmail.com" className="cta-secondary">
                                <Icon icon="mdi:email-outline" width={20} height={20} />
                                Let's Talk
                            </a>
                            <Link to="/projects" className="cta-tertiary">
                                <Icon icon="mdi:arrow-left" width={18} height={18} />
                                All Projects
                            </Link>
                        </div>
                    </div>
                    <div className="cta-divider" />
                </div>
            </section>
        </div>
    );
};

export default ProjectDetailsPage;