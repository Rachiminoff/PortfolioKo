import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { projectsData, Project as ProjectType } from "../types/projects.data";
import '../assets/styles/Project.scss';

/* =========================
   PROJECT CARD COMPONENT 
========================= */

type ProjectCardProps = {
    project: ProjectType;
    index: number;
};

function ProjectCard({ project, index }: ProjectCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleCardClick = () => {
        const slug = project.title.toLowerCase().replace(/\s+/g, '-');
        navigate(`/projects/${slug}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
        }
    };

    const displayTech = project.tech.slice(0, 4);
    const remainingTech = project.tech.length - 4;

    return (
        <div 
            ref={cardRef}
            className={`project-card ${isVisible ? 'visible' : ''}`}
            style={{ transitionDelay: `${index * 0.04}s` }}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View ${project.title} case study`}
        >
            <div className="project-card-content">
                <div className="project-card-header">
                    <div className="project-title-wrapper">
                        <span className="project-number">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="project-title">{project.title}</h3>
                    </div>
                    <div className="arrow-icon-wrapper">
                        <Icon 
                            icon="mdi:arrow-right" 
                            className="arrow-icon" 
                            width={20} 
                            height={20} 
                        />
                    </div>
                </div>
                
                <p className="project-subtitle">{project.subtitle}</p>
                
                {/* Tech tags */}
                <div className="tech-tags">
                    {displayTech.map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                    ))}
                    {remainingTech > 0 && (
                        <span className="tech-tag more">+{remainingTech}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* =========================
   MAIN COMPONENT
========================= */

function Projects() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="projects-container" id="projects">
            <div className="projects-header">
                <span className="header-tag">PORTFOLIO</span>
                <h1>Selected Work</h1>
                <p className="projects-subtitle">
                    Explore my latest projects and case studies
                </p>
            </div>

            <div className="projects-grid">
                {projectsData.map((project, index) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}

export default Projects;