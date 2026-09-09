import React from 'react';
const PersonaHero: React.FC = () => (
  <header className="persona-hero">
    <div className="persona-kicker">
      <span className="persona-kicker-mark" />
      TDY / PERSONAL FILE
      <span className="persona-kicker-rule" />
      2026
    </div>
    <div className="persona-hero-layout">
      <div>
        <h1>
          PERSONA<span>.</span>
        </h1>
        <p className="persona-intro">
          The part of the website that has absolutely nothing to do with being employable.
        </p>
        <p className="persona-subintro">
          Books. Manga. Movies. Games. Songs. Half-formed thoughts. Things I'm into right now and
          things I will probably be into again in six months.
        </p>
      </div>
      <aside className="persona-stamp">
        <span>NOT A</span>
        <strong>PORTFOLIO</strong>
        <span>JUST A PERSON</span>
      </aside>
    </div>
  </header>
);
export default PersonaHero;
