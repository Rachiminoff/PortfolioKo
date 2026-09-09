import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import PersonaSectionHeader from './PersonaSectionHeader';
import { currently } from './data/persona.data';

type NowPlaying = { configured?: boolean; playing?: boolean; title?: string; artist?: string; album?: string; image?: string; url?: string };

const CurrentlySection: React.FC = () => {
  const [track, setTrack] = useState<NowPlaying | null>(null);
  useEffect(() => { let active = true; const load = () => fetch('/api/now-playing').then(r => r.json()).then(d => active && setTrack(d)).catch(() => active && setTrack({configured:false})); load(); const timer = window.setInterval(load, 30000); return () => { active = false; window.clearInterval(timer); }; }, []);
  const staticItems = currently.filter(item => item.label !== 'LISTENING');
  return <section className="persona-now" aria-labelledby="persona-now-title">
    <PersonaSectionHeader index="01 / NOW" title="CURRENTLY" note="SUBJECT TO CHANGE WITHOUT NOTICE" id="persona-now-title" />
    <div className="persona-now-grid">
      {staticItems.map(item => <article className="persona-now-card" key={item.label}>{item.image && <img src={item.image} alt="" className="persona-now-image" />}<div className="persona-card-top"><Icon icon={item.icon} width={21} /><span>{item.label}</span></div><strong>{item.value}</strong><span className="persona-card-cursor">_</span></article>)}
      <article className="persona-now-card persona-now-playing">{track?.image && <img src={track.image} alt="" className="persona-now-image" />}<div className="persona-card-top"><Icon icon="mdi:music-note" width={21} /><span>NOW PLAYING</span></div>{track?.configured === false ? <strong>Connect Last.fm to listen live</strong> : track?.title ? <><strong>{track.title}</strong><span className="persona-now-artist">{track.artist}</span><span className="persona-now-status">{track.playing ? '● LIVE' : 'RECENTLY PLAYED'}</span></> : <strong>Nothing playing right now</strong>}{track?.url && <a className="persona-now-link" href={track.url} target="_blank" rel="noreferrer">LAST.FM ↗</a>}</article>
    </div>
  </section>;
};
export default CurrentlySection;
