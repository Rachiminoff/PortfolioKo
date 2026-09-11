import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { projectsData, Project } from '../data/projects.data';
import '../assets/styles/ProjectListModal.scss';

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectListModal: React.FC<ProjectListModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projectsData);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter projects based on search term
  useEffect(() => {
    const filtered = projectsData.filter(
      (project) =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tech.some((tech) => tech.toLowerCase().includes(searchTerm.toLowerCase())),
    );
    setFilteredProjects(filtered);
    setSelectedIndex(filtered.length > 0 ? 0 : -1);
  }, [searchTerm]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredProjects.length - 1 ? prev + 1 : prev));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }

      if (e.key === 'Enter' && selectedIndex >= 0 && filteredProjects[selectedIndex]) {
        const project = filteredProjects[selectedIndex];
        const slug = project.slug || project.title.toLowerCase().replace(/\s+/g, '-');
        onClose();
        // Navigate will happen via Link click
        window.location.href = `/projects/${slug}`;
      }

      if (e.key === 'Tab') {
        // Close modal on tab if no items selected
        if (selectedIndex === -1) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredProjects, selectedIndex, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.modal-project-item');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#2dd4bf';
      case 'Completed':
        return '#2dd4bf';
      case 'In Development':
        return '#fbbf24';
      case 'Archived':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        {/* Terminal Header */}
        <div className="modal-header">
          <div className="modal-header-controls">
            <button
              className="modal-control-btn modal-control-close"
              onClick={onClose}
              aria-label="Close"
            />
            <button
              className="modal-control-btn modal-control-minimize"
              onClick={onClose}
              aria-label="Minimize"
            />
            <button
              className="modal-control-btn modal-control-maximize"
              onClick={onClose}
              aria-label="Maximize"
            />
          </div>
          <span className="modal-header-title">projects — bash — 80×24</span>
          <div className="modal-header-spacer" />
        </div>

        {/* Terminal Body */}
        <div className="modal-body">
          {/* Prompt Line */}
          <div className="modal-prompt-line">
            <span className="modal-prompt">❯</span>
            <span className="modal-prompt-path">~/projects</span>
            <span className="modal-prompt-cursor">$</span>
            <span className="modal-prompt-text">ls -la</span>
          </div>

          {/* Search Input */}
          <div className="modal-search-line">
            <span className="modal-prompt">❯</span>
            <span className="modal-prompt-path">~/projects</span>
            <span className="modal-prompt-cursor">$</span>
            <span className="modal-search-label">filter</span>
            <input
              ref={inputRef}
              type="text"
              className="modal-search-input"
              placeholder="Filter projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filter projects"
            />
          </div>

          {/* Results Count */}
          <div className="modal-results-count">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
            {searchTerm && ` matching "${searchTerm}"`}
          </div>

          {/* Project List */}
          <div className="modal-project-list" ref={listRef}>
            {filteredProjects.map((project, index) => {
              const slug = project.slug || project.title.toLowerCase().replace(/\s+/g, '-');
              const isSelected = index === selectedIndex;
              const statusColor = getStatusColor(project.status);

              return (
                <Link
                  key={project.id}
                  to={`/projects/${slug}`}
                  className={`modal-project-item ${isSelected ? 'selected' : ''}`}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="modal-project-item-content">
                    <div className="modal-project-item-left">
                      <span className="modal-project-item-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="modal-project-item-title">{project.title}</span>
                    </div>
                    <div className="modal-project-item-right">
                      <span className="modal-project-item-status" style={{ color: statusColor }}>
                        <span
                          className="modal-project-item-status-dot"
                          style={{ backgroundColor: statusColor }}
                        />
                        {project.status}
                      </span>
                      <span className="modal-project-item-tech">
                        {project.tech.slice(0, 3).join(' · ')}
                        {project.tech.length > 3 && ` · +${project.tech.length - 3}`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="modal-empty-state">
                <Icon icon="mdi:file-search" width={32} height={32} />
                <span>No projects found</span>
                <span className="modal-empty-hint">Try a different search term</span>
              </div>
            )}
          </div>

          {/* Footer Commands */}
          <div className="modal-footer">
            <div className="modal-footer-commands">
              <span className="modal-footer-command">
                <kbd>↑</kbd> <kbd>↓</kbd> navigate
              </span>
              <span className="modal-footer-command">
                <kbd>Enter</kbd> select
              </span>
              <span className="modal-footer-command">
                <kbd>Esc</kbd> close
              </span>
            </div>
            <span className="modal-footer-count">
              {filteredProjects.length} / {projectsData.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectListModal;
