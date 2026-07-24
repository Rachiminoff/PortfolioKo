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
            { threshold: 0.1 }
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

    return (
        <div 
            ref={cardRef}
            className={`project-card ${isVisible ? 'visible' : ''}`}
            style={{ transitionDelay: `${index * 0.05}s` }}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View ${project.title} case study`}
        >
            <div className="project-card-content">
                <div className="project-card-header">
                    <h3 className="project-title">{project.title}</h3>
                    <Icon icon="mdi:arrow-right" className="arrow-icon" width={18} height={18} />
                </div>
                <p className="project-subtitle">{project.subtitle}</p>
                
                {/* Tech tags - Minimal chips */}
                <div className="tech-tags">
                    {project.tech.slice(0, 4).map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                    ))}
                    {project.tech.length > 4 && (
                        <span className="tech-tag more">+{project.tech.length - 4}</span>
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
                <span className="header-tag">PROJECTS</span>
                <h1>Selected Work</h1>
                <p className="projects-subtitle">Click on any project to explore the case study</p>
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