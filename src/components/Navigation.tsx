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
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import "../assets/styles/Navigation.scss";

type Section = "expertise" | "history" | "projects" | "contact" | "vault" | "certificates";

const navItems: [string, Section, string][] = [
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

  // Handle scroll events for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById("navigation");
      if (navbar) {
        setScrolled(window.scrollY > navbar.clientHeight);
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

  const scrollToSection = (section: Section) => {
    if (section === "vault") {
      navigate("/vault");
      return;
    }

    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(section);
      // Close mobile drawer if open
      if (mobileOpen) {
        handleDrawerToggle();
      }
    }
  };

  const drawer = (
    <Box className="navigation-drawer" onClick={handleDrawerToggle}>
      <Box className="drawer-header">
        <Icon icon="mdi:compass" className="drawer-icon" />
        <span className="drawer-title">Navigation</span>
      </Box>
      <Divider className="drawer-divider" />
      <List className="drawer-list">
        {navItems.map(([label, section, icon]) => (
          <ListItem key={label} disablePadding className="drawer-list-item">
            <ListItemButton
              className={`drawer-button ${activeSection === section ? "active" : ""}`}
              onClick={() => scrollToSection(section)}
            >
              <Icon icon={icon} className="drawer-item-icon" />
              <ListItemText primary={label} className="drawer-item-text" />
              {activeSection === section && <span className="drawer-item-indicator" />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box className="navigation-container">
      <CssBaseline />

      <AppBar
        component="nav"
        id="navigation"
        className={`navbar ${scrolled ? "scrolled" : ""}`}
        elevation={scrolled ? 2 : 0}
      >
        <Toolbar className="navbar-toolbar">
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            className="mobile-menu-button"
            aria-label="Toggle navigation menu"
          >
            <MenuIcon />
          </IconButton>

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
        </Toolbar>
      </AppBar>

      <nav className="mobile-nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          classes={{
            paper: "drawer-paper"
          }}
          className="mobile-drawer"
        >
          {drawer}
        </Drawer>
      </nav>
    </Box>
  );
}

export default Navigation;