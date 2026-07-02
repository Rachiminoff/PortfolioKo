// Import images
import uniq00 from '../assets/images/uq0.jpg';
import uniq01 from '../assets/images/uq1.jpg';
import uniq02 from '../assets/images/uq2.jpg';
import uniq03 from '../assets/images/uq3.jpg';

import wais00 from '../assets/images/ww0.jpg';
import wais01 from '../assets/images/ww1.jpg';
import wais02 from '../assets/images/ww2.jpg';
import wais03 from '../assets/images/ww3.jpg';

export interface Project {
  id: number;
  title: string;
  subtitle: string;
  role: string;
  roleClass: 'lead' | 'co' | 'sole';
  featured: boolean;
  link: string;
  description: string;
  features: string[];
  tech: string[];
  images?: string[];
  video?: string;
  liveDemo?: string;
  itchLink?: string;
}

export const projectsData: Project[] = [
  {
    id: 1,
    title: "UniQuest",
    subtitle: "Gamified productivity platform designed for university students.",
    role: "Lead Developer",
    roleClass: "lead",
    featured: true,
    link: "https://github.com/Skabeez/UniQuest",
    images: [uniq00, uniq01, uniq02, uniq03],
    description:
      "UniQuest reimagines student productivity through RPG-inspired progression mechanics. It combines task management, missions, achievements, and campus utilities into a unified platform while keeping user data synchronized in real time across multiple devices.",
    features: [
      "Gamified task and mission system",
      "Real-time cloud synchronization",
      "Cross-platform mobile application",
      "Integrated campus utilities"
    ],
    tech: ["FlutterFlow", "Dart", "Supabase"]
  },
  {
    id: 2,
    title: "Webnovel Extractor",
    subtitle: "Automation toolkit for extracting and processing web novels.",
    role: "Sole Developer",
    roleClass: "sole",
    featured: false,
    link: "https://github.com/Rachiminoff/Webnovel-Extractor",
    video: "https://www.youtube.com/embed/Zclw7GV7w7I",
    description:
      "An automation pipeline built to reliably extract web novel chapters from websites with inconsistent layouts. The tool scrapes dynamic content, repairs malformed HTML, removes unnecessary formatting, and generates clean, readable text suitable for EPUB creation or offline reading.",
    features: [
      "Dynamic website scraping",
      "Malformed HTML recovery",
      "Automated content processing",
      "Clean EPUB-ready output"
    ],
    tech: ["Python", "Playwright", "BeautifulSoup"]
  },
  {
    id: 3,
    title: "FREE FREE FREE",
    subtitle: "Psychological desktop simulation set inside a fictional 2005 operating system.",
    role: "Co-Developer",
    roleClass: "co",
    featured: true,
    link: "https://github.com/Rachiminoff/FREEFREEFREE",
    itchLink: "https://daeowob.itch.io/free-free-free",
    video: "https://www.youtube.com/embed/CAeP5QStOrE?si=M8axOWtdfKER_7OF",
    description:
      "A narrative-driven psychological horror game that blurs the boundary between the player's desktop and the game world. Players investigate a mysterious GTA IV leak that unleashes a self-aware quarantine program, transforming the operating system itself into part of the storytelling experience.",
    features: [
      "Immersive desktop simulation",
      "Narrative-driven gameplay",
      "Hybrid 2D and 3D environments",
      "Dynamic AI-driven encounters",
      "Atmospheric interactive systems"
    ],
    tech: ["Godot", "GDScript", "Blender"]
  },
  {
    id: 4,
    title: "Wais Wallet",
    subtitle: "Collaborative finance and expense management platform.",
    role: "Co-Developer",
    roleClass: "co",
    featured: false,
    link: "https://github.com/Rachiminoff/Wais_Wallet",
    liveDemo: "https://wais-wallet.vercel.app",
    images: [wais00, wais01, wais02, wais03],
    description:
      "A modern finance management platform focused on usability, responsive design, and maintainable frontend architecture. Built around reusable React components, it streamlines expense tracking and wallet management while delivering a consistent experience across devices.",
    features: [
      "Responsive user interface",
      "Reusable component architecture",
      "Modern frontend engineering",
      "Intuitive financial workflows"
    ],
    tech: ["TypeScript", "React", "Frontend"]
  }
];