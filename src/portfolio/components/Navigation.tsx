import React, { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import CommandPalette, { CommandPaletteCommand } from './CommandPalette';
import '../assets/styles/Navigation.scss';

type Section = 'main' | 'expertise' | 'history' | 'projects' | 'contact' | 'vault' | 'certificates';

const navItems: [string, Section, string][] = [
  ['Main', 'main', 'mdi:account-circle'],
  ['History', 'history', 'mdi:history'],
  ['Projects', 'projects', 'mdi:rocket-launch'],
  ['Expertise', 'expertise', 'mdi:lightning-bolt'],
  ['Certificates', 'certificates', 'mdi:trophy'],
  ['Contact', 'contact', 'mdi:email-outline'],
];

function Navigation() {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<Section>('main');
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on a fullscreen route
  const isFullscreenRoute = location.pathname === '/vault' || location.pathname === '/insights';

  // Handle scroll events for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById('navigation');
      if (navbar) {
        setScrolled(window.scrollY > 48);
      }

      // Only detect active section if not on fullscreen route
      if (!isFullscreenRoute) {
        const sections = navItems.map(([, section]) => section);
        let currentSection: Section = 'main';

        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 100) {
              currentSection = section;
            }
          }
        }

        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFullscreenRoute]);

  const scrollToSection = (section: Section) => {
    if (section === 'vault') {
      navigate('/vault');
      return;
    }

    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(section);
    }
  };

  const commandPaletteCommands: CommandPaletteCommand[] = [
    ...navItems.map(([label, section, icon]) => ({
      id: `main-${section}`,
      label,
      description: `Jump to ${label.toLowerCase()}`,
      icon,
      group: 'SITE',
      keywords: [section],
      action: () => scrollToSection(section),
    })),
    {
      id: 'main-wish-archive',
      label: 'Wish Archive',
      description: 'Open the wish and pull archive',
      icon: 'mdi:archive-outline',
      group: 'ARCHIVE',
      keywords: ['wish', 'gacha', 'pulls'],
      action: () => navigate('/wish-archive'),
    },
    {
      id: 'main-insights',
      label: 'Insights',
      description: 'Open the analytics and insights page',
      icon: 'mdi:chart-line',
      group: 'PAGE',
      keywords: ['analytics', 'data'],
      action: () => navigate('/insights'),
    },
  ];

  // Don't render navigation on fullscreen routes
  if (isFullscreenRoute) {
    return null;
  }

  return (
    <Box className="navigation-container">
      <CssBaseline />

      <AppBar
        component="nav"
        id="navigation"
        className={`navbar ${scrolled ? 'scrolled' : ''}`}
        elevation={0}
      >
        <Toolbar className="navbar-toolbar">
          {/* Brand/Logo */}
          <Box className="navbar-brand">
            <span className="navbar-brand-name">TDY.dev</span>
          </Box>

          {/* Desktop Navigation */}
          <Box className="nav-items-desktop">
            {navItems.map(([label, section, icon]) => (
              <Button
                key={label}
                onClick={() => scrollToSection(section)}
                className={`nav-button ${activeSection === section ? 'active' : ''}`}
                aria-current={activeSection === section ? 'page' : undefined}
              >
                <Icon icon={icon} className="nav-button-icon" />
                <span className="nav-button-label">{label}</span>
              </Button>
            ))}
          </Box>

          <CommandPalette
            commands={commandPaletteCommands}
            contextLabel="SITE COMMANDS"
            onOpen={() => {}}
          />
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navigation;
