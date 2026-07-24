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
  {
    name: "Vercel",
    icon: "logos:vercel-icon",
    color: "#FFFFFF",
    category: "Tools",
    proficiency: 85,
    featured: true,
    description: "Deploying, hosting, and managing modern web applications with automated CI/CD and preview deployments."
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

  const handleScrollHintClick = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={`expertise-container ${inView ? 'visible' : ''}`} id="expertise" ref={ref}>
      {/* Header */}
      <div className={`expertise-header ${inView ? 'animate-in' : ''}`}>
        <div className="header-top">
          <div>
            <span className="header-tag">EXPERTISE</span>
            <h1>Tools &amp; Technologies</h1>
            <p className="expertise-subtitle">
              Technologies I work with — scroll through the stack
            </p>
          </div>
          <div className="expertise-stats">
            <div className="stat-badge">
              <Icon icon="mdi:code-tags" />
              <span>{techStack.length} Technologies</span>
            </div>
            <div className="stat-badge">
              <Icon icon="mdi:star" />
              <span>{featuredTech.length} Featured</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="category-filters" role="tablist">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              role="tab"
              aria-selected={activeCategory === cat}
              tabIndex={activeCategory === cat ? 0 : -1}
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
        style={{ 
          '--mouse-x': `${mousePosition.x}%`, 
          '--mouse-y': `${mousePosition.y}%`,
        } as React.CSSProperties}
      >
        <div className="tech-stack-scroll" ref={scrollRef}>
          {[...filteredTech, ...filteredTech].map((tech, index) => {
            return (
              <div
                key={`${tech.name}-${index}`}
                className="tech-item"
                style={
                  {
                    "--tech-color": tech.color,
                  } as React.CSSProperties
                }
                onClick={() => handleTechClick(tech)}
                role="button"
                tabIndex={0}
                aria-label={tech.name}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTechClick(tech);
                  }
                }}
              >
                <div className="tech-icon-wrapper">
                  <Icon icon={tech.icon} className="tech-icon" />
                  {tech.featured && (
                    <div className="featured-badge" aria-label="Featured technology">
                      <Icon icon="mdi:sparkle" />
                    </div>
                  )}
                </div>
                <span className="tech-name">{tech.name}</span>
                {selectedTech === tech && (
                  <div className="tech-tooltip" role="tooltip">
                    <p>{tech.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="scroll-gradient left" aria-hidden="true" />
        <div className="scroll-gradient right" aria-hidden="true" />
        
        <button 
          className="scroll-hint"
          onClick={handleScrollHintClick}
          aria-label="Scroll through tech stack"
        >
          ← Scroll to explore →
        </button>
      </div>

      {/* Featured Skills */}
      <div className="featured-skills">
        <div className="featured-label">
          <Icon icon="mdi:lightning" />
          <span>Featured Expertise</span>
        </div>
        <div className="featured-tags">
          {featuredTech.slice(0, 6).map((tech, idx) => (
            <div
              key={idx}
              className="skill-tag"
              style={{ '--tag-color': tech.color } as React.CSSProperties}
            >
              <Icon icon={tech.icon} />
              {tech.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Expertise;