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
  description: string;
}

const categoryColors: Record<string, string> = {
  "Frontend": "#61DAFB",
  "Backend": "#FF2D20",
  "Game Dev": "#478CBF",
  "Automation": "#3776AB",
  "Tools": "#F05032",
  "AI": "#8B5CF6"
};

const techStack: Tech[] = [
  // Frontend & Mobile
  {
    name: "React",
    icon: "logos:react",
    color: "#61DAFB",
    category: "Frontend",
    proficiency: 95,
    description: "Building interactive UIs with hooks and context"
  },
  {
    name: "TypeScript",
    icon: "logos:typescript-icon",
    color: "#3178C6",
    category: "Frontend",
    proficiency: 90,
    description: "Type-safe JavaScript for scalable applications"
  },
  {
    name: "Tailwind CSS",
    icon: "logos:tailwindcss-icon",
    color: "#06B6D4",
    category: "Frontend",
    proficiency: 92,
    description: "Utility-first CSS framework for rapid UI development"
  },
  {
    name: "React Native",
    icon: "logos:react",
    color: "#61DAFB",
    category: "Frontend",
    proficiency: 85,
    description: "Cross-platform mobile development"
  },
  {
    name: "FlutterFlow",
    icon: "logos:flutter",
    color: "#02569B",
    category: "Frontend",
    proficiency: 75,
    description: "Low-code Flutter development"
  },
  {
    name: "HTML5",
    icon: "logos:html-5",
    color: "#E34F26",
    category: "Frontend",
    proficiency: 95,
    description: "Semantic markup and web standards"
  },
  {
    name: "CSS3",
    icon: "logos:css-3",
    color: "#1572B6",
    category: "Frontend",
    proficiency: 90,
    description: "Modern styling and animations"
  },
  {
    name: "JavaScript",
    icon: "logos:javascript",
    color: "#F7DF1E",
    category: "Frontend",
    proficiency: 92,
    description: "Core web development language"
  },

  // Backend & Database
  {
    name: "Laravel",
    icon: "logos:laravel",
    color: "#FF2D20",
    category: "Backend",
    proficiency: 82,
    description: "PHP framework for building modern web applications"
  },
  {
    name: "PHP",
    icon: "logos:php",
    color: "#777BB4",
    category: "Backend",
    proficiency: 78,
    description: "Server-side scripting language"
  },
  {
    name: "Node.js",
    icon: "logos:nodejs",
    color: "#339933",
    category: "Backend",
    proficiency: 80,
    description: "JavaScript runtime for server-side applications"
  },
  {
    name: "PostgreSQL",
    icon: "logos:postgresql",
    color: "#4169E1",
    category: "Backend",
    proficiency: 85,
    description: "Advanced relational database management"
  },
  {
    name: "Supabase",
    icon: "logos:supabase-icon",
    color: "#3ECF8E",
    category: "Backend",
    proficiency: 88,
    description: "PostgreSQL with real-time capabilities"
  },
  {
    name: "SQLite",
    icon: "logos:sqlite",
    color: "#003B57",
    category: "Backend",
    proficiency: 80,
    description: "Lightweight embedded database"
  },
  {
    name: "MySQL",
    icon: "logos:mysql",
    color: "#4479A1",
    category: "Backend",
    proficiency: 85,
    description: "Relational database management"
  },

  // Game Development
  {
    name: "Godot",
    icon: "logos:godot-icon",
    color: "#478CBF",
    category: "Game Dev",
    proficiency: 85,
    description: "Open-source game engine"
  },
  {
    name: "GDScript",
    icon: "logos:godot-icon",
    color: "#478CBF",
    category: "Game Dev",
    proficiency: 80,
    description: "Python-like game scripting"
  },
  {
    name: "Blender",
    icon: "logos:blender",
    color: "#F5792A",
    category: "Game Dev",
    proficiency: 70,
    description: "3D modeling and animation"
  },

  // Automation & Scripting
  {
    name: "Python",
    icon: "logos:python",
    color: "#3776AB",
    category: "Automation",
    proficiency: 90,
    description: "Versatile scripting and automation"
  },
  {
    name: "Playwright",
    icon: "logos:playwright",
    color: "#2EAD33",
    category: "Automation",
    proficiency: 75,
    description: "Automated browser testing"
  },
  {
    name: "BeautifulSoup",
    icon: "logos:python",
    color: "#4B8BBE",
    category: "Automation",
    proficiency: 70,
    description: "Web scraping and parsing"
  },

  // Tools
  {
    name: "Vite",
    icon: "logos:vitejs",
    color: "#646CFF",
    category: "Tools",
    proficiency: 85,
    description: "Next-generation frontend build tool"
  },
  {
    name: "VS Code",
    icon: "logos:visual-studio-code",
    color: "#007ACC",
    category: "Tools",
    proficiency: 95,
    description: "Lightweight but powerful source code editor"
  },
  {
    name: "Git",
    icon: "logos:git-icon",
    color: "#F05032",
    category: "Tools",
    proficiency: 95,
    description: "Version control system"
  },
  {
    name: "GitHub",
    icon: "logos:github-icon",
    color: "#FFFFFF",
    category: "Tools",
    proficiency: 90,
    description: "Collaborative development platform"
  },
  {
    name: "Dart",
    icon: "logos:dart",
    color: "#00B4AB",
    category: "Tools",
    proficiency: 80,
    description: "Optimized for UI development"
  },
  {
    name: "Flutter",
    icon: "logos:flutter",
    color: "#02569B",
    category: "Tools",
    proficiency: 78,
    description: "Cross-platform UI framework"
  },
  {
    name: "Pandoc",
    icon: "logos:pandoc",
    color: "#2C3E50",
    category: "Tools",
    proficiency: 70,
    description: "Universal document converter"
  },
  {
    name: "Vercel",
    icon: "logos:vercel-icon",
    color: "#FFFFFF",
    category: "Tools",
    proficiency: 85,
    description: "Deployment and hosting platform"
  },

  // AI & LLMs
  {
    name: "AI & LLMs",
    icon: "mdi:brain",
    color: "#8B5CF6",
    category: "AI",
    proficiency: 80,
    description: "Working with language models and AI tools"
  },
  {
    name: "Prompt Engineering",
    icon: "mdi:robot-outline",
    color: "#8B5CF6",
    category: "AI",
    proficiency: 80,
    description: "Crafting structured prompts for LLMs"
  }
];

const categories = [
  { name: "Frontend", color: "#61DAFB" },
  { name: "Backend", color: "#FF2D20" },
  { name: "Game Dev", color: "#478CBF" },
  { name: "Automation", color: "#3776AB" },
  { name: "Tools", color: "#F05032" },
  { name: "AI", color: "#8B5CF6" }
];

function Expertise() {
  const [selectedTech, setSelectedTech] = useState<Tech | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

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

  const getCategoryColor = (category: string): string => {
    return categoryColors[category] || "#ffffff";
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
              <Icon icon="mdi:layers" />
              <span>{categories.length} Categories</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="legend">
          {categories.map(cat => (
            <div key={cat.name} className="legend-item">
              <span
                className="legend-color"
                style={{
                  '--legend-color': cat.color,
                  backgroundColor: cat.color,
                } as React.CSSProperties}
                aria-hidden="true"
              />
              <span className="legend-label">{cat.name}</span>
              <span className="legend-code">{cat.color}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Scroll - Dual Direction */}
      <div
        className="tech-stack-wrapper"
        ref={wrapperRef}
        onMouseMove={handleMouseMove}
        style={{ 
          '--mouse-x': `${mousePosition.x}%`, 
          '--mouse-y': `${mousePosition.y}%`,
        } as React.CSSProperties}
      >
        {/* Row 1 - Left to Right */}
        <div className="tech-stack-scroll scroll-left" ref={scrollRef}>
          {[...techStack, ...techStack, ...techStack].map((tech, index) => {
            const categoryColor = getCategoryColor(tech.category);
            return (
              <div
                key={`${tech.name}-left-${index}`}
                className="tech-item"
                style={
                  {
                    "--tech-color": tech.color,
                    "--category-color": categoryColor,
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

        {/* Row 2 - Right to Left */}
        <div className="tech-stack-scroll scroll-right">
          {[...techStack, ...techStack, ...techStack].map((tech, index) => {
            const categoryColor = getCategoryColor(tech.category);
            return (
              <div
                key={`${tech.name}-right-${index}`}
                className="tech-item"
                style={
                  {
                    "--tech-color": tech.color,
                    "--category-color": categoryColor,
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
      </div>
    </div>
  );
}

export default Expertise;