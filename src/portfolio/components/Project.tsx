import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { projectsData, Project as ProjectType } from '../data/projects.data';
import '../assets/styles/Project.scss';

const colorVariants = ['red', 'blue', 'yellow', 'cream', 'green', 'violet'];
const PROJECTS_PER_PAGE = 6;

const getColorVariant = (index: number): string => colorVariants[index % colorVariants.length];

type ProjectCardProps = {
  project: ProjectType;
  index: number;
  absoluteIndex: number;
  isFeatured?: boolean;
};

function ProjectCard({ project, index, absoluteIndex, isFeatured = false }: ProjectCardProps) {
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
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCardClick = () => navigate(`/projects/${project.slug}`);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const displayTech = project.tech.slice(0, 4);
  const remainingTech = project.tech.length - displayTech.length;
  const colorVariant = getColorVariant(absoluteIndex);

  return (
    <article
      ref={cardRef}
      className={`project-card project-card-color-${colorVariant} ${isFeatured ? 'project-card-featured' : ''} ${isVisible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 45}ms` }}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${project.title} case study`}
    >
      <div className="project-card-index">{String(absoluteIndex + 1).padStart(2, '0')}</div>
      <div className="project-card-art" aria-hidden="true">
        <span className="art-circle" />
        <span className="art-square" />
        <span className="art-bar" />
      </div>

      <div className="project-card-content">
        <div className="project-title-row">
          <div>
            <span className="project-kicker">{project.category || 'PROJECT'}</span>
            <h3 className="project-title">{project.title}</h3>
          </div>
          <span className="project-arrow" aria-hidden="true">
            <Icon icon="mdi:arrow-top-right" width={22} height={22} />
          </span>
        </div>

        <p className="project-subtitle">{project.subtitle}</p>

        <div className="project-meta" aria-label="Project metadata">
          <span>{project.role}</span>
          <span>{project.duration}</span>
          <span className="project-status">{project.status}</span>
        </div>

        <div className="tech-tags" aria-label="Technologies">
          {displayTech.map((tech) => (
            <span key={tech} className="tech-tag">
              {tech}
            </span>
          ))}
          {remainingTech > 0 && <span className="tech-tag more">+{remainingTech}</span>}
        </div>
      </div>

      <div className="project-card-footer">
        <span>CASE STUDY</span>
        <span aria-hidden="true">↗</span>
      </div>
    </article>
  );
}

function Projects() {
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setMounted(true), []);

  const orderedProjects = useMemo(() => {
    const featured = projectsData.filter((project) => project.featured);
    const regular = projectsData.filter((project) => !project.featured);
    return [...featured, ...regular];
  }, []);

  const totalPages = Math.max(1, Math.ceil(orderedProjects.length / PROJECTS_PER_PAGE));
  const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
  const visibleProjects = orderedProjects.slice(startIndex, startIndex + PROJECTS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const changePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!mounted) return null;

  return (
    <section className="projects-container" id="projects" aria-labelledby="projects-title">
      <header className="projects-header section-header">
        <div className="section-header__number">05</div>
        <div className="section-header__label">SELECTED WORK</div>
        <div className="section-header__rule" aria-hidden="true" />
        <div className="section-header__meta">
          WORK / {String(orderedProjects.length).padStart(2, '0')}
        </div>
        <div className="section-header__status">
          PAGE {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
        </div>
        <div className="section-header__title-group">
          <h1 id="projects-title">
            Selected Work<span className="heading-dot">.</span>
          </h1>
          <p className="projects-subtitle">
            A working archive of software, systems, and experiments — built through iteration,
            debugging, and practical problem solving.
          </p>
        </div>
      </header>

      <div className="projects-toolbar">
        <span>
          <b>{String(startIndex + 1).padStart(2, '0')}</b>—
          <b>
            {String(Math.min(startIndex + visibleProjects.length, orderedProjects.length)).padStart(
              2,
              '0',
            )}
          </b>{' '}
          OF {String(orderedProjects.length).padStart(2, '0')}
        </span>
        <span className="toolbar-rule" />
        <span>SELECTED PROJECTS</span>
      </div>

      <div className="projects-grid" key={currentPage}>
        {visibleProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            absoluteIndex={startIndex + index}
            isFeatured={project.featured}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="projects-pagination" aria-label="Project pagination">
          <button
            type="button"
            className="pagination-arrow"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous projects"
          >
            <Icon icon="mdi:arrow-left" width={20} />
          </button>

          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                onClick={() => changePage(page)}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {String(page).padStart(2, '0')}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="pagination-arrow"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next projects"
          >
            <Icon icon="mdi:arrow-right" width={20} />
          </button>
        </nav>
      )}
    </section>
  );
}

export default Projects;
