import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

const links = [
  ['Currently', 'currently'],
  ['Stats', 'site-stats'],
  ['Favorites', 'favorites'],
  ['Writings', 'writings'],
  ['Words I Keep', 'quotes'],
  ['Common Tools', 'common-tools'],
];

const PersonaNavbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  const goHome = () => {
    close();
    navigate('/');
  };

  const goTo = (id: string) => {
    close();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <nav className={`persona-navbar ${open ? 'is-open' : ''}`} aria-label="Persona navigation">
        <button
          type="button"
          className="persona-navbar-home"
          onClick={goHome}
          aria-label="Back to home"
        >
          <span className="persona-navbar-home-mark">TDY</span>
          <span className="persona-navbar-home-label">HOME</span>
          <Icon icon="mdi:arrow-left" aria-hidden="true" />
        </button>

        <span className="persona-navbar-index">PERSONA / 001</span>

        <button
          type="button"
          className="persona-navbar-toggle"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close persona menu' : 'Open persona menu'}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
          <b>{open ? 'CLOSE' : 'MENU'}</b>
        </button>
      </nav>

      <div className={`persona-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="persona-menu-inner">
          <div className="persona-menu-kicker">INDEX / PERSONA</div>
          <div className="persona-menu-links">
            <button
              type="button"
              onClick={goHome}
              className="persona-menu-link persona-menu-home-link"
            >
              <span className="persona-menu-number">00</span>
              <span>BACK TO HOME</span>
              <Icon icon="mdi:arrow-top-left" aria-hidden="true" />
            </button>
            {links.map(([label, id], index) => (
              <button key={id} type="button" onClick={() => goTo(id)} className="persona-menu-link">
                <span className="persona-menu-number">{String(index + 1).padStart(2, '0')}</span>
                <span>{label}</span>
                <Icon icon="mdi:arrow-down-right" aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="persona-menu-footer">A PERSONAL INDEX / TDY.DEV</div>
        </div>
      </div>
    </>
  );
};

export default PersonaNavbar;
