// Project.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { projectsData, Project as ProjectType } from "../types/projects.data";
import '../assets/styles/Project.scss';

// Using Iconify instead of React Icons
const ItchIcon = React.memo(() => <Icon icon="simple-icons:itchdotio" width={18} height={18} />);
const GitHubIcon = React.memo(() => <Icon icon="mdi:github" width={18} height={18} />);

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
    const [imageLoaded, setImageLoaded] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-play slideshow
    useEffect(() => {
        if (images.length <= 1) return;
        
        const startTimer = () => {
            timerRef.current = setInterval(() => {
                setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                setImageLoaded(false);
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

    const nextSlide = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrent((prev) => prev === images.length - 1 ? 0 : prev + 1);
        setImageLoaded(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                setImageLoaded(false);
            }, 4000);
        }
    }, [images.length]);

    const prevSlide = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrent((prev) => prev === 0 ? images.length - 1 : prev - 1);
        setImageLoaded(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                setImageLoaded(false);
            }, 4000);
        }
    }, [images.length]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                const mockEvent = {
                    preventDefault: () => {},
                    stopPropagation: () => {}
                } as React.MouseEvent<HTMLButtonElement>;
                prevSlide(mockEvent);
            } else if (e.key === 'ArrowRight') {
                const mockEvent = {
                    preventDefault: () => {},
                    stopPropagation: () => {}
                } as React.MouseEvent<HTMLButtonElement>;
                nextSlide(mockEvent);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

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
                {!imageLoaded && <div className="image-skeleton" />}
                <img
                    src={images[current]}
                    className={`slider-image ${imageLoaded ? 'loaded' : ''}`}
                    alt={`${title} - screenshot ${current + 1}`}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
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
                    <div className="slide-dots">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCurrent(idx);
                                    setImageLoaded(false);
                                }}
                                className={`slide-dot ${idx === current ? 'active' : ''}`}
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
   PROJECT CARD COMPONENT
========================= */

type ProjectCardProps = {
    project: ProjectType;
    isExpanded: boolean;
    onToggle: () => void;
    index: number;
};

function ProjectCard({ project, isExpanded, onToggle, index }: ProjectCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);

    // Intersection Observer for scroll animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Dynamic height calculation for smooth expand
    useEffect(() => {
        if (isExpanded && detailsRef.current) {
            setContentHeight(detailsRef.current.scrollHeight);
            // Check if content is scrollable
            setTimeout(() => {
                if (detailsRef.current) {
                    const { scrollHeight, clientHeight } = detailsRef.current;
                    setShowScrollHint(scrollHeight > clientHeight + 50);
                }
            }, 100);
        } else {
            setContentHeight(0);
            setShowScrollHint(false);
        }
    }, [isExpanded, project.id]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
        }
    };

    return (
        <div 
            ref={cardRef}
            className={`project-card ${isExpanded ? 'expanded' : ''} ${project.featured ? 'featured' : ''} ${isVisible ? 'visible' : ''}`}
            style={{ transitionDelay: `${index * 0.1}s` }}
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
                        <h3 className={project.featured ? 'featured-title' : ''}>
                            {project.title}
                        </h3>
                        <p className="project-subtitle">{project.subtitle}</p>
                    </div>
                </div>
                <div className="project-header-right">
                    <div className="project-stats">
                        <span className="stat-chip">
                            <span className="stat-number">{project.features.length}</span>
                            <span className="stat-label">features</span>
                        </span>
                        <span className="stat-chip">
                            <span className="stat-number">{project.tech.length}</span>
                            <span className="stat-label">tech</span>
                        </span>
                    </div>
                    <div className="tech-pills">
                        {project.tech.slice(0, 2).map((tech, i) => (
                            <span key={i} className="tech-pill">{tech}</span>
                        ))}
                        {project.tech.length > 2 && (
                            <span className="tech-pill more" aria-label={`+${project.tech.length - 2} more technologies`}>
                                +{project.tech.length - 2}
                            </span>
                        )}
                    </div>
                    <span className={`role-badge ${project.roleClass}`}>
                        {project.role}
                    </span>
                    <ExpandIcon expanded={isExpanded} />
                </div>
            </div>

            <div 
                className="project-details-wrapper"
                style={{ 
                    maxHeight: isExpanded ? contentHeight : 0,
                    opacity: isExpanded ? 1 : 0
                }}
            >
                {/* Scrollable content container */}
                <div className="project-details-scroll" ref={detailsRef}>
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
                                        <Icon icon="mdi:open-in-new" width={14} height={14} />
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

                {/* Scroll hint overlay - positioned absolutely relative to the wrapper */}
                {showScrollHint && (
                    <div className="scroll-hint-overlay">
                        <span>Scroll for more</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M7 13l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================
   MAIN COMPONENT
========================= */

function Projects() {
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
                <p className="projects-subtitle">Click on any project to learn more</p>
                <div className="header-decoration">
                    <div className="decoration-line"></div>
                    <span className="decoration-dot"></span>
                    <div className="decoration-line"></div>
                </div>
            </div>

            <div className="projects-list">
                {projectsData.map((project, index) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        isExpanded={expandedId === project.id}
                        onToggle={() => toggleProject(project.id)}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

export default Projects;