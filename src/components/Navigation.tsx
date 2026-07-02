import React, { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import CloseIcon from "@mui/icons-material/Close";
import Toolbar from "@mui/material/Toolbar";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import "../assets/styles/Navigation.scss";

type Section = "main" | "expertise" | "history" | "projects" | "contact" | "vault" | "certificates";

const navItems: [string, Section, string][] = [
  ["Main", "main", "mdi:account-circle"],
  ["History", "history", "mdi:history"],
  ["Projects", "projects", "mdi:rocket-launch"],
  ["Expertise", "expertise", "mdi:lightning-bolt"],
  ["Certificates", "certificates", "mdi:trophy"],
  ["Contact", "contact", "mdi:email-outline"]
];

function Navigation() {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<Section>("expertise");

  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  // Handle scroll events for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById("navigation");
      if (navbar) {
        setScrolled(window.scrollY > 20);
      }

      // Detect active section based on scroll position
      const sections = navItems.map(([, section]) => section);
      let currentSection: Section = "expertise";
      
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
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const scrollToSection = (section: Section) => {
    if (section === "vault") {
      navigate("/vault");
      handleDrawerClose();
      return;
    }

    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(section);
      handleDrawerClose();
    }
  };

  const drawer = (
    <Box className="navigation-drawer" role="navigation" aria-label="Mobile navigation">
      <Box className="drawer-header">
        <Box className="drawer-brand">
          <Icon icon="mdi:compass" className="drawer-brand-icon" />
          <span className="drawer-brand-name"> TDY.dev </span>
        </Box>
        <IconButton
          className="drawer-close-button"
          onClick={handleDrawerClose}
          aria-label="Close navigation menu"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider className="drawer-divider" />
      <List className="drawer-list">
        {navItems.map(([label, section, icon]) => (
          <ListItem key={label} disablePadding className="drawer-list-item">
            <ListItemButton
              className={`drawer-button ${activeSection === section ? "active" : ""}`}
              onClick={() => scrollToSection(section)}
              aria-current={activeSection === section ? "page" : undefined}
            >
              <Icon icon={icon} className="drawer-item-icon" />
              <ListItemText primary={label} className="drawer-item-text" />
              {activeSection === section && <span className="drawer-item-indicator" />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box className="drawer-footer">
        <span className="drawer-footer-text">© 2026 TDY</span>
      </Box>
    </Box>
  );

  return (
    <Box className="navigation-container">
      <CssBaseline />

      <AppBar
        component="nav"
        id="navigation"
        className={`navbar ${scrolled ? "scrolled" : ""}`}
        elevation={0}
      >
        <Toolbar className="navbar-toolbar">
          {/* Brand/Logo */}
          <Box className="navbar-brand">
            <Icon icon="mdi:compass" className="navbar-brand-icon" />
            <span className="navbar-brand-name">TDY.dev</span>
          </Box>

          {/* Desktop Navigation */}
          <Box className="nav-items-desktop">
            {navItems.map(([label, section, icon]) => (
              <Button
                key={label}
                onClick={() => scrollToSection(section)}
                className={`nav-button ${activeSection === section ? "active" : ""}`}
                aria-current={activeSection === section ? "page" : undefined}
              >
                <Icon icon={icon} className="nav-button-icon" />
                <span className="nav-button-label">{label}</span>
              </Button>
            ))}
          </Box>

          {/* Mobile Hamburger */}
          <IconButton
            className={`mobile-menu-button ${mobileOpen ? "open" : ""}`}
            onClick={handleDrawerToggle}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true,
          disableScrollLock: true, // Fixed: Changed from disableScroll to disableScrollLock
        }}
        classes={{
          paper: "drawer-paper"
        }}
        className="mobile-drawer"
        id="mobile-navigation-drawer"
        anchor="right"
      >
        {drawer}
      </Drawer>

      {/* Overlay for drawer */}
      {mobileOpen && (
        <Box
          className="drawer-overlay"
          onClick={handleDrawerClose}
          aria-hidden="true"
        />
      )}
    </Box>
  );
}

export default Navigation;