import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { projectsData, Project as ProjectType } from '../types/projects.data';
import '../assets/styles/Project.scss';

/* =========================
   COLOR VARIANTS FOR CARDS
========================= */
const colorVariants = ['blue', 'purple', 'teal', 'rose', 'amber', 'emerald', 'indigo', 'slate'];

const getColorVariant = (index: number): string => {
  return colorVariants[index % colorVariants.length];
};

/* =========================
   PROJECT CARD COMPONENT 
========================= */

type ProjectCardProps = {
  project: ProjectType;
  index: number;
  isFeatured?: boolean;
};

function ProjectCard({ project, index, isFeatured = false }: ProjectCardProps) {
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
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' },
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

  const displayTech = project.tech.slice(0, 5);
  const remainingTech = project.tech.length - 5;

  // Get color variant for this card
  const colorVariant = getColorVariant(index);

  // Determine card class based on featured status and color
  const cardClass = `project-card ${isFeatured ? 'project-card-featured' : ''} project-card-color-${colorVariant} ${isVisible ? 'visible' : ''}`;

  return (
    <div
      ref={cardRef}
      className={cardClass}
      style={{ transitionDelay: `${index * 0.04}s` }}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${project.title} case study`}
    >
      <div className="project-card-content">
        <span className="project-number">{String(index + 1).padStart(2, '0')}</span>

        <div className="project-title-wrapper">
          <h3 className="project-title">{project.title}</h3>
          <div className="arrow-icon-wrapper">
            <Icon icon="mdi:arrow-right" className="arrow-icon" width={20} height={20} />
          </div>
        </div>

        <p className="project-subtitle">{project.subtitle}</p>

        {/* Metadata */}
        <div className="project-meta">
          <span className="project-meta-item">{project.role}</span>
          <span className="project-meta-item">
            <span className="meta-dot">·</span>
            {project.duration}
          </span>
          <span className="project-meta-item">
            <span className="meta-dot">·</span>
            {project.status}
          </span>
          {project.featured && (
            <span className="project-meta-item">
              <span className="meta-dot">·</span>
              Featured
            </span>
          )}
        </div>

        {/* Tech tags */}
        <div className="tech-tags">
          {displayTech.map((tech, i) => (
            <span key={i} className="tech-tag">
              {tech}
            </span>
          ))}
          {remainingTech > 0 && <span className="tech-tag more">+{remainingTech}</span>}
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

  // Featured projects: first two are featured (or you can customize)
  const featuredProjects = projectsData.filter((p) => p.featured);
  const regularProjects = projectsData.filter((p) => !p.featured);

  // Order: featured projects first, then regular
  const orderedProjects = [...featuredProjects, ...regularProjects];

  return (
    <div className="projects-container" id="projects">
      <div className="projects-header">
        <span className="header-tag">Portfolio</span>
        <h1>Selected Work</h1>
        <p className="projects-subtitle">
          A curated collection of software engineering projects, technical explorations, and
          documentation detailing my approach to building reliable, maintainable applications.
        </p>
      </div>

      <div className="projects-grid">
        {orderedProjects.map((project, index) => {
          // First two projects are featured (or only the first if there's only one featured)
          const isFeatured = index < 2 && project.featured;
          return (
            <ProjectCard key={project.id} project={project} index={index} isFeatured={isFeatured} />
          );
        })}
      </div>
    </div>
  );
}

export default Projects;
