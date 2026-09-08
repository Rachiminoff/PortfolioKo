import React from 'react';
import { Icon } from '@iconify/react';
import PersonaSectionHeader from './PersonaSectionHeader';
import { currently } from './data/persona.data';
const CurrentlySection: React.FC = () => (
  <section className="persona-now" aria-labelledby="persona-now-title">
    <PersonaSectionHeader index="01 / NOW" title="CURRENTLY" note="SUBJECT TO CHANGE WITHOUT NOTICE" id="persona-now-title" />
    <div className="persona-now-grid">{currently.map(item => <article className="persona-now-card" key={item.label}>
      {item.image && <img src={item.image} alt="" className="persona-now-image" onError={e => { e.currentTarget.style.display = 'none'; }} />}
      <div className="persona-card-top"><Icon icon={item.icon} width={21} /><span>{item.label}</span></div><strong>{item.value}</strong><span className="persona-card-cursor">_</span>
    </article>)}</div>
  </section>
);
export default CurrentlySection;
