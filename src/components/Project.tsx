import React, { useState, useEffect, useRef } from "react";

import uniq00 from '../assets/images/uq0.jpg';
import uniq01 from '../assets/images/uq1.jpg';
import uniq02 from '../assets/images/uq2.jpg';
import uniq03 from '../assets/images/uq3.jpg';

import wais00 from '../assets/images/ww0.jpg';
import wais01 from '../assets/images/ww1.jpg';
import wais02 from '../assets/images/ww2.jpg';
import wais03 from '../assets/images/ww3.jpg';

import '../assets/styles/Project.scss';

// Memoized icon components for better performance
const ItchIcon = React.memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.5 8 C5 8 4 9.5 4 11v2 c0 2 1.2 3 2.6 3 c1 1 2.2 1 3-.5l.4-.7h4l.4.7 c.8 1.5 2 1.5 3 .5 C19 16 20 15 20 13v-2 c0-1.5-1-3-2.5-3 H6.5z"/>
        <rect x="9" y="9" width="6" height="2" rx="0.5" />
        <circle cx="9" cy="13" r="1.1" />
        <circle cx="15" cy="13" r="1.1" />
        <circle cx="17" cy="11.5" r="0.6" />
        <circle cx="18" cy="12.8" r="0.6" />
        <circle cx="17" cy="14.1" r="0.6" />
        <circle cx="16" cy="12.8" r="0.6" />
    </svg>
));

const GitHubIcon = React.memo(() => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .5C5.7.5.8 5.6.8 12c0 5.1 3.3 9.5 7.9 11 .6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.8 2.1 2.8 2.1.6 0 1.1-.2 1.4-.4.1-.8.4-1.4.8-1.7-2.5-.3-5.1-1.3-5.1-5.8 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.3.9-.2 1.9-.3 2.9-.3s2 .1 2.9.3c2.3-1.6 3.3-1.3 3.3-1.3.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.3 0 4.5-2.6 5.5-5.1 5.8.4.4.9 1.2.9 2.4v3.6c0 .3.2.7.8.6 4.6-1.5 7.9-5.9 7.9-11C23.2 5.6 18.3.5 12 .5z"/>
    </svg>
));

const ExpandIcon = React.memo(({ expanded }: { expanded: boolean }) => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: expanded ? '#7c5cff' : 'rgba(255,255,255,0.5)'
        }}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
));

/* =========================
   IMAGE SLIDER
========================= */

type ImageSliderProps = {
    images: string[];
    link: string;
    title: string;
};

function ImageSlider({ images, link, title }: ImageSliderProps) {
    const [current, setCurrent] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-play slideshow
    useEffect(() => {
        if (images.length <= 1) return;
        
        const startTimer = () => {
            timerRef.current = setInterval(() => {
                setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }, 4000);
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

    const nextSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrent((prev) => prev === images.length - 1 ? 0 : prev + 1);
        // Reset timer on manual interaction
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }, 4000);
        }
    };

    const prevSlide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrent((prev) => prev === 0 ? images.length - 1 : prev - 1);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }, 4000);
        }
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                prevSlide(e as unknown as React.MouseEvent<HTMLButtonElement>);
            } else if (e.key === 'ArrowRight') {
                nextSlide(e as unknown as React.MouseEvent<HTMLButtonElement>);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [current]);

    return (
        <div 
            className="slider-container"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <a 
                href={link} 
                target="_blank" 
                rel="noreferrer"
                className="slider-image-wrapper"
                aria-label={`View ${title} project`}
            >
                <img
                    src={images[current]}
                    className="slider-image"
                    alt={`${title} - screenshot ${current + 1}`}
                    loading="lazy"
                />
                <div className="slider-overlay">
                    <span>View Project →</span>
                </div>
            </a>

            {images.length > 1 && (
                <>
                    <button 
                        className="nav-btn left" 
                        onClick={prevSlide} 
                        aria-label="Previous slide"
                    >
                        ‹
                    </button>
                    <button 
                        className="nav-btn right" 
                        onClick={nextSlide} 
                        aria-label="Next slide"
                    >
                        ›
                    </button>
                    <div className="slide-counter">
                        {current + 1} / {images.length}
                    </div>
                    
                    {/* Progress dots */}
                    <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '6px',
                        zIndex: 5,
                    }}>
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCurrent(idx);
                                }}
                                style={{
                                    width: idx === current ? '20px' : '8px',
                                    height: '4px',
                                    borderRadius: '2px',
                                    border: 'none',
                                    background: idx === current 
                                        ? 'rgba(124, 92, 255, 0.8)' 
                                        : 'rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    padding: 0,
                                }}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/* =========================
   PROJECT DATA
========================= */

const projects = [
    {
        id: 1,
        title: "UniQuest",
        subtitle: "Gamified productivity platform for university students.",
        role: "Lead Developer",
        roleClass: "lead" as const,
        featured: true,
        link: "https://github.com/Skabeez/UniQuest",
        images: [uniq00, uniq01, uniq02, uniq03],
        description: "Designed to make university life feel less overwhelming through progression systems, missions, and campus-focused utilities with real-time synchronization across devices.",
        features: [
            "Task & mission system",
            "Real-time synchronization",
            "Cross-platform mobile support",
            "Campus-focused utilities"
        ],
        tech: ["FlutterFlow", "Dart", "Supabase"]
    },
    {
        id: 2,
        title: "Webnovel Extractor",
        subtitle: "Automated pipeline for extracting and cleaning web novel content.",
        role: "Sole Developer",
        roleClass: "lead" as const,
        featured: false,
        link: "https://github.com/Rachiminoff/Webnovel-Extractor",
        video: "https://www.youtube.com/embed/Zclw7GV7w7I",
        description: "Built to parse inconsistent site structures, clean malformed HTML, and generate readable chapter outputs at scale using Python automation tools.",
        features: [
            "Dynamic content scraping",
            "Malformed HTML cleanup",
            "Automated extraction workflow",
            "Readable text formatting"
        ],
        tech: ["Python", "Playwright", "BeautifulSoup"]
    },
    {
        id: 3,
        title: "FREE FREE FREE",
        subtitle: "Psychological desktop simulation game set inside a fictional 2005 OS.",
        role: "Co-Developer",
        roleClass: "co" as const,
        featured: true,
        link: "https://github.com/Rachiminoff/FREEFREEFREE",
        itchLink: "https://daeowob.itch.io/free-free-free",
        video: "https://www.youtube.com/embed/CAeP5QStOrE?si=M8axOWtdfKER_7OF",
        description: "Players investigate a fake GTA IV leak that installs a self-aware quarantine program, gradually turning the computer itself into part of the narrative experience.",
        features: [
            "Narrative-driven gameplay",
            "Interactive desktop simulation",
            "2D and 3D gameplay",
            "Atmospheric systems",
            "AI-driven enemy behavior"
        ],
        tech: ["Godot", "GDScript", "Blender"]
    },
    {
        id: 4,
        title: "Wais Wallet",
        subtitle: "Collaborative finance and wallet management platform.",
        role: "Co-Developer",
        roleClass: "co" as const,
        featured: false,
        link: "https://github.com/Rachiminoff/Wais_Wallet",
        liveDemo: "https://wais-wallet.vercel.app",
        images: [wais00, wais01, wais02, wais03],
        description: "Focused on responsive UI, reusable frontend architecture, and intuitive financial workflows with a clean and accessible user experience.",
        features: [
            "Responsive UI system",
            "Reusable React components",
            "Frontend architecture",
            "User-centered workflows"
        ],
        tech: ["TypeScript", "React", "Frontend"]
    }
];

/* =========================
   PROJECT CARD COMPONENT
========================= */

type ProjectCardProps = {
    project: typeof projects[0];
    isExpanded: boolean;
    onToggle: () => void;
};

function ProjectCard({ project, isExpanded, onToggle }: ProjectCardProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
        }
    };

    return (
        <div 
            className={`project-card ${isExpanded ? 'expanded' : ''} ${project.featured ? 'featured' : ''}`}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-expanded={isExpanded}
        >
            <div className="project-header-compact" onClick={onToggle}>
                <div className="project-header-left">
                    {project.featured && (
                        <span className="featured-badge-compact" aria-hidden="true">
                            ⭐
                        </span>
                    )}
                    <div className="project-title-group">
                        <h3>{project.title}</h3>
                        <p className="project-subtitle">{project.subtitle}</p>
                    </div>
                </div>
                <div className="project-header-right">
                    <div className="tech-pills">
                        {project.tech.slice(0, 3).map((tech, i) => (
                            <span key={i} className="tech-pill">{tech}</span>
                        ))}
                        {project.tech.length > 3 && (
                            <span className="tech-pill more" aria-label={`+${project.tech.length - 3} more technologies`}>
                                +{project.tech.length - 3}
                            </span>
                        )}
                    </div>
                    <span className={`role-badge ${project.roleClass}`}>
                        {project.role}
                    </span>
                    <ExpandIcon expanded={isExpanded} />
                </div>
            </div>

            <div className={`project-details ${isExpanded ? 'open' : ''}`}>
                <div className="project-details-inner">
                    <div className="project-media">
                        {project.images ? (
                            <ImageSlider
                                images={project.images}
                                link={project.link}
                                title={project.title}
                            />
                        ) : (
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
                    </div>

                    <div className="project-content-expanded">
                        <p className="project-description">
                            {project.description}
                        </p>

                        <div className="project-section">
                            <h4>Key Features</h4>
                            <ul className="feature-list">
                                {project.features.map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="project-section">
                            <h4>Tech Stack</h4>
                            <div className="tech-tags">
                                {project.tech.map((tech, i) => (
                                    <span key={i}>{tech}</span>
                                ))}
                            </div>
                        </div>

                        <div className="project-links">
                            <a
                                href={project.link}
                                target="_blank"
                                rel="noreferrer"
                                className="github-link"
                                aria-label={`View ${project.title} on GitHub`}
                            >
                                <GitHubIcon />
                                <span>View Project</span>
                            </a>

                            {project.liveDemo && (
                                <a
                                    href={project.liveDemo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="demo-link"
                                    aria-label={`View ${project.title} live demo`}
                                >
                                    <span>Live Demo</span>
                                </a>
                            )}

                            {project.itchLink && (
                                <a
                                    href={project.itchLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="itch-link"
                                    aria-label={`Download ${project.title} from itch.io`}
                                >
                                    <ItchIcon />
                                    <span>Download Demo</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   MAIN COMPONENT
========================= */

function Project() {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleProject = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!mounted) return null;

    return (
        <div className="projects-container" id="projects">
            <div className="projects-header">
                <h1>Recent Projects</h1>
                <p className="projects-subtitle">Click or press Enter on any project to learn more</p>
            </div>

            <div className="projects-list">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        isExpanded={expandedId === project.id}
                        onToggle={() => toggleProject(project.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default Project;