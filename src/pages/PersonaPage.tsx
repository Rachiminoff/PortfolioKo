import React from 'react';
import {
  PersonaHero,
  CurrentlySection,
  FavoritesSection,
  WritingsSection,
  PersonaFooterCard,
  SiteStatsSection,
} from '../components/persona';
import '../assets/styles/persona/PersonaPage.scss';

const PersonaPage: React.FC = () => (
  <div className="persona-page">
    <div className="persona-grid" aria-hidden="true" />
    <div className="persona-shape persona-shape-blue" aria-hidden="true" />
    <div className="persona-shape persona-shape-red" aria-hidden="true" />
    <div className="persona-shape persona-shape-yellow" aria-hidden="true" />
    <PersonaHero />
    <main className="persona-content">
      <CurrentlySection />
      <SiteStatsSection />
      <FavoritesSection />
      <WritingsSection />
      <PersonaFooterCard />
    </main>
  </div>
);
export default PersonaPage;
