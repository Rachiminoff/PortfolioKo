import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import CommandPalette, { CommandPaletteCommand } from '../../portfolio/components/CommandPalette';

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

  const commandPaletteCommands: CommandPaletteCommand[] = [
    {
      id: 'persona-home',
      label: 'Back to Home',
      description: 'Return to the main portfolio',
      icon: 'mdi:arrow-left',
      group: 'PAGE',
      keywords: ['home', 'portfolio', 'main'],
      action: goHome,
    },
    ...links.map(([label, id], index) => ({
      id: `persona-${id}`,
      label,
      description: `Jump to ${label.toLowerCase()}`,
      icon: [
        'mdi:account-outline',
        'mdi:chart-box-outline',
        'mdi:heart-outline',
        'mdi:note-text-outline',
        'mdi:format-quote-close',
        'mdi:toolbox-outline',
      ][index],
      group: 'PERSONA',
      keywords: [id],
      action: () => goTo(id),
    })),
    {
      id: 'persona-wish-stats',
      label: 'Wish Stats',
      description: 'Open wish statistics and analytics',
      icon: 'mdi:archive-outline',
      group: 'ARCHIVE',
      keywords: ['wish', 'archive', 'gacha', 'pulls'],
      action: () => {
        close();
        navigate('/wish-archive?tab=analytics');
      },
    },
  ];

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

        <CommandPalette
          commands={commandPaletteCommands}
          contextLabel="PERSONA COMMANDS"
          onOpen={close}
        />

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
