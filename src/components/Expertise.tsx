import React from "react";
import { Icon } from "@iconify/react";

import "../assets/styles/Expertise.scss";

const techStack = [
  // Frontend & Mobile
  {
    name: "React",
    icon: "logos:react",
    color: "#61DAFB",
  },
  {
    name: "TypeScript",
    icon: "logos:typescript-icon",
    color: "#3178C6",
  },
  {
    name: "React Native",
    icon: "logos:react",
    color: "#61DAFB",
  },
  {
    name: "FlutterFlow",
    icon: "logos:flutter",
    color: "#02569B",
  },

  // Backend & Database
  {
    name: "Supabase",
    icon: "logos:supabase-icon",
    color: "#3ECF8E",
  },
  {
    name: "SQLite",
    icon: "logos:sqlite",
    color: "#003B57",
  },
  {
    name: "MySQL",
    icon: "logos:mysql",
    color: "#4479A1",
  },
  {
    name: "PHP",
    icon: "logos:php",
    color: "#777BB4",
  },

  // Game Development
  {
    name: "Godot",
    icon: "logos:godot-icon",
    color: "#478CBF",
  },
  {
    name: "GDScript",
    icon: "logos:godot-icon",
    color: "#478CBF",
  },
  {
    name: "Blender",
    icon: "logos:blender",
    color: "#F5792A",
  },

  // Automation & Scripting
  {
    name: "Python",
    icon: "logos:python",
    color: "#3776AB",
  },
  {
    name: "Playwright",
    icon: "logos:playwright",
    color: "#2EAD33",
  },
  {
    name: "BeautifulSoup",
    icon: "logos:python",
    color: "#4B8BBE",
  },

  // Tools
  {
    name: "Git",
    icon: "logos:git-icon",
    color: "#F05032",
  },
  {
    name: "GitHub",
    icon: "logos:github-icon",
    color: "#FFFFFF",
  },
  {
    name: "Dart",
    icon: "logos:dart",
    color: "#00B4AB",
  },
  {
    name: "Flutter",
    icon: "logos:flutter",
    color: "#02569B",
  },
];

function Expertise() {
  return (
    <div className="expertise-container" id="expertise">

      <div className="expertise-header">
        <h1>Tech Stack</h1>

        <p className="expertise-subtitle">
          Technologies I work with — scroll through the stack
        </p>
      </div>


      <div className="tech-stack-wrapper">
        <div className="tech-stack-scroll">

          {[...techStack, ...techStack].map((tech, index) => (
            <div
              key={index}
              className="tech-item"
              style={
                {
                  "--tech-color": tech.color,
                } as React.CSSProperties
              }
            >

              <div className="tech-icon-wrapper">
                <Icon
                  icon={tech.icon}
                  className="tech-icon"
                />
              </div>

              <span className="tech-name">
                {tech.name}
              </span>

            </div>
          ))}

        </div>
      </div>

    </div>
  );
}

export default Expertise;