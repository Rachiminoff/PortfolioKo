import React, { useState, useRef, MouseEvent } from "react";
import { Icon } from "@iconify/react";
import { useInView } from "react-intersection-observer";

import "../assets/styles/Expertise.scss";

interface Tech {
  name: string;
  icon: string;
  color: string;
  category: string;
  proficiency: number;
  featured: boolean;
  description: string;
}

const techStack: Tech[] = [
  // Frontend & Mobile
  {
    name: "React",
    icon: "logos:react",
    color: "#61DAFB",
    category: "Frontend",
    proficiency: 95,
    featured: true,
    description: "Building interactive UIs with hooks and context"
  },
  {
    name: "TypeScript",
    icon: "logos:typescript-icon",
    color: "#3178C6",
    category: "Frontend",
    proficiency: 90,
    featured: true,
    description: "Type-safe JavaScript for scalable applications"
  },
  {
    name: "React Native",
    icon: "logos:react",
    color: "#61DAFB",
    category: "Frontend",
    proficiency: 85,
    featured: false,
    description: "Cross-platform mobile development"
  },
  {
    name: "FlutterFlow",
    icon: "logos:flutter",
    color: "#02569B",
    category: "Frontend",
    proficiency: 75,
    featured: false,
    description: "Low-code Flutter development"
  },

  // Backend & Database
  {
    name: "Supabase",
    icon: "logos:supabase-icon",
    color: "#3ECF8E",
    category: "Backend",
    proficiency: 88,
    featured: true,
    description: "PostgreSQL with real-time capabilities"
  },
  {
    name: "SQLite",
    icon: "logos:sqlite",
    color: "#003B57",
    category: "Backend",
    proficiency: 80,
    featured: false,
    description: "Lightweight embedded database"
  },
  {
    name: "MySQL",
    icon: "logos:mysql",
    color: "#4479A1",
    category: "Backend",
    proficiency: 85,
    featured: false,
    description: "Relational database management"
  },
  {
    name: "PHP",
    icon: "logos:php",
    color: "#777BB4",
    category: "Backend",
    proficiency: 70,
    featured: false,
    description: "Server-side scripting"
  },

  // Game Development
  {
    name: "Godot",
    icon: "logos:godot-icon",
    color: "#478CBF",
    category: "Game Dev",
    proficiency: 85,
    featured: true,
    description: "Open-source game engine"
  },
  {
    name: "GDScript",
    icon: "logos:godot-icon",
    color: "#478CBF",
    category: "Game Dev",
    proficiency: 80,
    featured: false,
    description: "Python-like game scripting"
  },
  {
    name: "Blender",
    icon: "logos:blender",
    color: "#F5792A",
    category: "Game Dev",
    proficiency: 70,
    featured: false,
    description: "3D modeling and animation"
  },

  // Automation & Scripting
  {
    name: "Python",
    icon: "logos:python",
    color: "#3776AB",
    category: "Automation",
    proficiency: 90,
    featured: true,
    description: "Versatile scripting and automation"
  },
  {
    name: "Playwright",
    icon: "logos:playwright",
    color: "#2EAD33",
    category: "Automation",
    proficiency: 75,
    featured: false,
    description: "Automated browser testing"
  },
  {
    name: "BeautifulSoup",
    icon: "logos:python",
    color: "#4B8BBE",
    category: "Automation",
    proficiency: 70,
    featured: false,
    description: "Web scraping and parsing"
  },

  // Tools
  {
    name: "Git",
    icon: "logos:git-icon",
    color: "#F05032",
    category: "Tools",
    proficiency: 95,
    featured: true,
    description: "Version control system"
  },
  {
    name: "GitHub",
    icon: "logos:github-icon",
    color: "#FFFFFF",
    category: "Tools",
    proficiency: 90,
    featured: false,
    description: "Collaborative development platform"
  },
  {
    name: "Dart",
    icon: "logos:dart",
    color: "#00B4AB",
    category: "Tools",
    proficiency: 80,
    featured: false,
    description: "Optimized for UI development"
  },
  {
    name: "Flutter",
    icon: "logos:flutter",
    color: "#02569B",
    category: "Tools",
    proficiency: 78,
    featured: false,
    description: "Cross-platform UI framework"
  },
  {
    name: "Prompt Engineering",
    icon: "mdi:robot-outline",
    color: "#8B5CF6",
    category: "Tools",
    proficiency: 80,
    featured: true,
    description:
      "Crafting structured prompts, managing context, and iteratively refining instructions to improve the accuracy and consistency of large language model responses."
  },
];

const categories = ["All", "Frontend", "Backend", "Game Dev", "Automation", "Tools"];

function Expertise() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const filteredTech = activeCategory === "All"
    ? techStack
    : techStack.filter(tech => tech.category === activeCategory);

  const featuredTech = techStack.filter(tech => tech.featured);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    }
  };

  const handleTechClick = (tech: Tech) => {
    setSelectedTech(selectedTech === tech ? null : tech);
  };

  return (
    <div className={`expertise-container ${inView ? 'visible' : ''}`} id="expertise" ref={ref}>
      {/* Header */}
      <div className={`expertise-header ${inView ? 'animate-in' : ''}`}>
        <div className="header-top">
          <div>
            <h1>Tech Stack</h1>
            <p className="expertise-subtitle">
              Technologies I work with — scroll through the stack
            </p>
          </div>
          <div className="expertise-stats">
            <div className="stat-badge">
              <Icon icon="mdi:code-tags" />
              <span>{techStack.length}+ Technologies</span>
            </div>
            <div className="stat-badge">
              <Icon icon="mdi:star" />
              <span>{featuredTech.length} Featured</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tech Stack Scroll */}
      <div
        className="tech-stack-wrapper"
        ref={wrapperRef}
        onMouseMove={handleMouseMove}
        style={{ '--mouse-x': `${mousePosition.x}%`, '--mouse-y': `${mousePosition.y}%` } as React.CSSProperties}
      >
        <div className="tech-stack-scroll" ref={scrollRef}>
          {[...filteredTech, ...filteredTech].map((tech, index) => (
            <div
              key={index}
              className="tech-item"
              style={
                {
                  "--tech-color": tech.color,
                } as React.CSSProperties
              }
              onClick={() => handleTechClick(tech)}
            >
              <div className="tech-icon-wrapper">
                <Icon icon={tech.icon} className="tech-icon" />
                {tech.featured && (
                  <div className="featured-badge">
                    <Icon icon="mdi:sparkle" />
                  </div>
                )}
                <div className="proficiency-ring">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={tech.color}
                      strokeWidth="2"
                      strokeDasharray={`${tech.proficiency}, 100`}
                      strokeLinecap="round"
                      className="ring-progress"
                    />
                  </svg>
                  <span className="proficiency-text">{tech.proficiency}%</span>
                </div>
              </div>
              <span className="tech-name">{tech.name}</span>
              {selectedTech === tech && (
                <div className="tech-tooltip">
                  <p>{tech.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="scroll-gradient left" />
        <div className="scroll-gradient right" />
      </div>

      {/* Featured Skills */}
      <div className="featured-skills">
        <div className="featured-label">
          <Icon icon="mdi:lightning" />
          <span>Featured Expertise</span>
        </div>
        <div className="featured-tags">
          {featuredTech.slice(0, 5).map((tech, idx) => (
            <div
              key={idx}
              className="skill-tag"
              style={{ '--tag-color': tech.color } as React.CSSProperties}
            >
              <Icon icon={tech.icon} />
              {tech.name}
              <span className="skill-proficiency">{tech.proficiency}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expertise Grid */}
      <div className="expertise-grid">
        {[
          {
            icon: "mdi:brain",
            title: "Problem Solving",
            description: "Translating complex requirements into elegant, efficient solutions with clean architecture."
          },
          {
            icon: "mdi:rocket",
            title: "Rapid Prototyping",
            description: "Quickly iterating from concept to MVP using modern frameworks and low-code solutions."
          },
          {
            icon: "mdi:shield-check",
            title: "Quality Assurance",
            description: "Writing testable code with end-to-end testing and comprehensive error handling."
          },
          {
            icon: "mdi:sync",
            title: "Continuous Learning",
            description: "Staying current with emerging technologies and best practices in the ecosystem."
          }
        ].map((item, idx) => (
          <div
            key={idx}
            className={`expertise-card ${inView ? 'animate-in' : ''}`}
            style={{ animationDelay: `${idx * 100}ms` } as React.CSSProperties}
          >
            <div className="expertise-card-header">
              <div className="card-icon">
                <Icon icon={item.icon} />
              </div>
              <h3>{item.title}</h3>
            </div>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Expertise;