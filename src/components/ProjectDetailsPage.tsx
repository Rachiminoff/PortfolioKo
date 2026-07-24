import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { projectsData, Project } from '../types/projects.data';
import '../assets/styles/ProjectDetailsPage.scss';

// Image Gallery Component with improved interactions
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

    return (
        <div 
            className="gallery-wrapper"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className={`gallery-container ${isZoomed ? 'zoomed' : ''}`}>
                <div className="gallery-main" onClick={() => setIsZoomed(!isZoomed)}>
                    {!imageLoaded && <div className="image-skeleton" />}
                    <img
                        src={images[current]}
                        alt={`${title} - screenshot ${current + 1}`}
                        className={`gallery-image ${imageLoaded ? 'loaded' : ''}`}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                    />
                    <div className="gallery-overlay">
                        <span className="gallery-hint">
                            <Icon icon="mdi:expand" width={20} height={20} />
                            Click to expand
                        </span>
                    </div>
                    {images.length > 1 && (
                        <>
                            <button className="gallery-nav prev" onClick={prevSlide} aria-label="Previous image">
                                <Icon icon="mdi:chevron-left" width={24} height={24} />
                            </button>
                            <button className="gallery-nav next" onClick={nextSlide} aria-label="Next image">
                                <Icon icon="mdi:chevron-right" width={24} height={24} />
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
                                <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Tech Stack Category Component
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

// Highlight Card Component
const HighlightCard: React.FC<{ icon: string; title: string; description: string }> = ({ 
    icon, title, description 
}) => (
    <div className="highlight-card">
        <div className="highlight-icon-wrapper">
            <Icon icon={icon} width={28} height={28} />
        </div>
        <h4 className="highlight-title">{title}</h4>
        <p className="highlight-description">{description}</p>
    </div>
);

// Feature Group Component
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

// Main Project Details Page
const ProjectDetailsPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showBackButton, setShowBackButton] = useState(false);
    const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
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
        'Active': '#22c55e',
        'Completed': '#3b82f6',
        'In Development': '#eab308',
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

    // Set ref callback
    const setSectionRef = (id: string) => (el: HTMLDivElement | null) => {
        sectionRefs.current[id] = el;
    };

    return (
        <div className="project-details-page">
            {/* Back Button - Sticky */}
            <div className={`back-button-container ${showBackButton ? 'visible' : ''}`}>
                <Link to="/projects" className="back-button sticky-back">
                    <Icon icon="mdi:arrow-left" width={20} height={20} />
                    <span>Back to Projects</span>
                </Link>
            </div>

            {/* Hero Section */}
            <section className="details-hero" id="hero" ref={heroRef}>
                {/* Regular Back Button (visible at top) */}
                <Link to="/projects" className="back-button hero-back">
                    <Icon icon="mdi:arrow-left" width={20} height={20} />
                    <span>Back to Projects</span>
                </Link>

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

            {/* Overview Section */}
            <section 
                className="details-section overview-section" 
                id="overview"
                ref={setSectionRef('overview')}
            >
                <div className="section-container">
                    <h2 className="section-title">Overview</h2>
                    <div className="overview-content">
                        <p className="overview-text">{project.overview || project.description}</p>
                    </div>
                </div>
            </section>

            {/* Highlights Section */}
            {project.highlights && project.highlights.length > 0 && (
                <section 
                    className="details-section highlights-section"
                    id="highlights"
                    ref={setSectionRef('highlights')}
                >
                    <div className="section-container">
                        <h2 className="section-title">Highlights</h2>
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

            {/* Tech Stack Section */}
            <section 
                className="details-section tech-section"
                id="tech-stack"
                ref={setSectionRef('tech-stack')}
            >
                <div className="section-container">
                    <h2 className="section-title">Tech Stack</h2>
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

            {/* Features Section */}
            <section 
                className="details-section features-section"
                id="features"
                ref={setSectionRef('features')}
            >
                <div className="section-container">
                    <h2 className="section-title">Features</h2>
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

            {/* Development Notes */}
            {project.devNotes && project.devNotes.length > 0 && (
                <section 
                    className="details-section dev-notes-section"
                    id="development"
                    ref={setSectionRef('development')}
                >
                    <div className="section-container">
                        <h2 className="section-title">Development Notes</h2>
                        <div className="dev-notes-content">
                            {project.devNotes.map((note, i) => (
                                <div key={i} className="dev-note">
                                    <Icon icon="mdi:note-text" width={20} height={20} />
                                    <p>{note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Architecture (if available) */}
            {project.architecture && (
                <section 
                    className="details-section architecture-section"
                    id="architecture"
                    ref={setSectionRef('architecture')}
                >
                    <div className="section-container">
                        <h2 className="section-title">Architecture</h2>
                        <div className="architecture-content">
                            <pre className="architecture-code">
                                <code>{project.architecture}</code>
                            </pre>
                        </div>
                    </div>
                </section>
            )}

            {/* Resources Section */}
            <section className="details-section resources-section" id="resources">
                <div className="section-container">
                    <h2 className="section-title">Resources</h2>
                    <div className="resources-grid">
                        <a href={project.link} target="_blank" rel="noreferrer" className="resource-card">
                            <Icon icon="mdi:github" width={24} height={24} />
                            <span className="resource-label">GitHub Repository</span>
                            <span className="resource-arrow">
                                <Icon icon="mdi:arrow-right" width={16} height={16} />
                            </span>
                        </a>
                        {project.liveDemo && (
                            <a href={project.liveDemo} target="_blank" rel="noreferrer" className="resource-card">
                                <Icon icon="mdi:open-in-new" width={24} height={24} />
                                <span className="resource-label">Live Demo</span>
                                <span className="resource-arrow">
                                    <Icon icon="mdi:arrow-right" width={16} height={16} />
                                </span>
                            </a>
                        )}
                        {project.itchLink && (
                            <a href={project.itchLink} target="_blank" rel="noreferrer" className="resource-card">
                                <Icon icon="mdi:download" width={24} height={24} />
                                <span className="resource-label">Download Demo</span>
                                <span className="resource-arrow">
                                    <Icon icon="mdi:arrow-right" width={16} height={16} />
                                </span>
                            </a>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProjectDetailsPage;