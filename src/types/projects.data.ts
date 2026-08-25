// types/projects.data.ts
import uniq00 from '../assets/images/uq0.jpg';
import uniq01 from '../assets/images/uq1.jpg';
import uniq02 from '../assets/images/uq2.jpg';
import uniq03 from '../assets/images/uq3.jpg';

import wais00 from '../assets/images/ww0.jpg';
import wais01 from '../assets/images/ww1.jpg';
import wais02 from '../assets/images/ww2.jpg';
import wais03 from '../assets/images/ww3.jpg';

import ledger00 from '../assets/images/ll0.png';
import ledger01 from '../assets/images/ll1.png';
import ledger02 from '../assets/images/ll2.png';
import ledger03 from '../assets/images/ll3.png';

export const PROJECT_STATUSES = ['Active', 'Archived', 'In Development', 'Completed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_CATEGORIES = ['Mobile App', 'Web App', 'Web Platform', 'Game', 'Automation Tool'] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export interface ProjectHighlight {
  icon: string;
  title: string;
  description: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  role: string;
  featured: boolean;
  status: ProjectStatus;
  category: ProjectCategory;
  duration: string;
  link: string;
  description: string;
  overview: string;
  features: string[];
  tech: string[];
  images?: string[];
  video?: string;
  liveDemo?: string;
  itchLink?: string;
  architecture?: string;
  devNotes: string[];
  highlights: ProjectHighlight[];
}

export const projectsData: Project[] = [
    {
    id: 1,
    title: "UniQuest",
    slug: "uniquest",
    subtitle: "A mobile-first campus companion that transforms everyday student life through productivity, exploration, and gamified progression.",
    role: "Lead Developer",
    featured: true,
    status: "Active",
    category: "Mobile App",
    duration: "4 months",
    link: "https://github.com/Skabeez/UniQuest",
    images: [uniq00, uniq01, uniq02, uniq03],
    description: "A cross-platform mobile application that combines task management, campus exploration, and RPG-inspired progression into a unified student experience.",
    overview: "UniQuest is a cross-platform mobile application designed to make university life more engaging. Instead of treating productivity as a never-ending checklist, it transforms academic and personal responsibilities into quests, rewarding students with experience points, achievements, and progression as they complete tasks. Alongside productivity tools, the app features an interactive campus map that helps students discover university landmarks and resources in a more intuitive way.\n\nThe project was inspired by a simple observation: staying motivated throughout a semester is often harder than managing the work itself. By introducing familiar RPG mechanics, UniQuest encourages consistency without sacrificing usability. Students are rewarded for building productive habits while enjoying an experience that feels more interactive than a traditional planner.\n\nBuilt with Flutter, FlutterFlow, and Supabase, the project balances rapid development with the flexibility of native Flutter development. FlutterFlow accelerated UI creation and prototyping, while custom Dart code provided the freedom to implement features beyond the capabilities of visual development alone.",
    features: [
      "Quest-based task management with experience points, levels, and achievements",
      "Interactive campus map featuring university landmarks and information cards",
      "Secure email authentication powered by Supabase",
      "Real-time synchronization across devices",
      "Personalized onboarding and guided walkthroughs",
      "Dark-first interface optimized for mobile devices",
      "Student profile customization and achievement tracking",
      "Productivity insights through quests and progression metrics"
    ],
    tech: [
      "Flutter",
      "Dart",
      "Supabase",
      "FlutterFlow"
    ],
    architecture: "Flutter UI → Application Logic → Supabase → PostgreSQL Database\n\nUniQuest follows a layered mobile architecture that separates presentation, business logic, and backend services.\n\nFlutter powers the user interface, delivering a responsive cross-platform experience optimized for mobile devices. The application is organized around key workflows including the dashboard, quest management, campus exploration, and user profiles.\n\nThe application layer manages progression systems such as missions, achievements, experience points, and user state while keeping gameplay mechanics independent from the interface. This separation makes the system easier to maintain and extend.\n\nSupabase provides authentication, cloud data storage, and real-time synchronization through PostgreSQL. User profiles, quests, achievements, and application data remain securely synchronized across sessions and devices.\n\nThis architecture keeps each layer focused on a specific responsibility, making future development, testing, and feature expansion significantly easier.",
    devNotes: [
      "FlutterFlow accelerated UI development while retaining Flutter's flexibility through custom Dart code.",
      "Supabase simplified authentication, backend infrastructure, and real-time synchronization with minimal setup.",
      "The quest and achievement systems were designed to remain modular for future gameplay expansions.",
      "A dark-first design language was chosen to improve readability during extended mobile use.",
      "The campus map provides both navigation and contextual information about university facilities.",
      "Future iterations could introduce push notifications, collaborative challenges, and social productivity features."
    ],
    highlights: [
      {
        icon: "mdi:gamepad-variant",
        title: "Gamified Productivity",
        description: "Turns everyday academic responsibilities into rewarding quests through experience points, levels, and achievements."
      },
      {
        icon: "mdi:map-marker-radius",
        title: "Interactive Campus Map",
        description: "Helps students explore university landmarks using interactive location pins with photos and contextual information."
      },
      {
        icon: "mdi:sync",
        title: "Real-time Synchronization",
        description: "Keeps user progress, quests, and achievements securely synchronized across devices through Supabase."
      },
      {
        icon: "mdi:account-check",
        title: "Student-Centered Experience",
        description: "Delivers a polished onboarding flow, customizable profiles, and an interface thoughtfully designed for university life."
      }
    ]
  },
  {
    id: 2,
    title: "Webnovel Extractor",
    slug: "webnovel-extractor",
    subtitle: "An automation toolkit that transforms online web novels into clean, offline-ready ebooks with minimal manual effort.",
    role: "Sole Developer",
    featured: false,
    status: "Completed",
    category: "Automation Tool",
    duration: "2 months",
    link: "https://github.com/Rachiminoff/Webnovel-Extractor",
    video: "https://www.youtube.com/embed/Zclw7GV7w7I",
    description: "A Python-based automation toolkit that extracts, cleans, and compiles web novels into polished EPUB and PDF formats for offline reading.",
    overview: "Webnovel Extractor is a desktop utility created for readers who prefer collecting and reading web novels offline. It automates the entire workflow—from downloading chapters and cleaning HTML to compiling polished EPUB ebooks and printable PDFs—removing the repetitive manual work usually required to archive online novels.\n\nOriginally built to support YoruApp/LumoStories and WordPress-based novel websites, the application combines browser automation, HTML parsing, and document generation into a streamlined pipeline. Whether a website serves traditional HTML or dynamically renders content through JavaScript, the extractor adapts its approach to produce consistently formatted output.\n\nThe project grew from a personal frustration with online reading. Advertisements, inconsistent formatting, unreliable internet connections, and constant page navigation often interrupted the reading experience. Webnovel Extractor solves these problems by generating clean, distraction-free ebooks that can be enjoyed anytime, even without an internet connection.",
    features: [
      "Bulk chapter downloads from table-of-contents pages or individual chapter URLs",
      "Support for both static HTML and JavaScript-rendered websites",
      "Automatic removal of advertisements, translator notes, and unnecessary page elements",
      "Multiple cleaning modes tailored for different website layouts",
      "EPUB generation with properly formatted chapters",
      "High-quality PDF conversion with pagination and cover support",
      "Optimized compatibility with YoruApp/LumoStories and WordPress-based novel sites",
      "Modular pipeline designed for easy support of additional websites"
    ],
    tech: [
      "Python",
      "Playwright",
      "BeautifulSoup",
      "Requests",
      "EbookLib",
      "WeasyPrint",
      "PyPDF2"
    ],
    architecture: "Source Website → Downloader → HTML Cleaner → EPUB Builder → PDF Export\n\nThe application follows a modular pipeline architecture where each stage is responsible for a single part of the extraction process.\n\nThe Downloader retrieves chapter content using either Requests or Playwright depending on the website. Traditional HTTP requests are used for static pages, while Playwright renders JavaScript-driven websites before extraction.\n\nThe HTML Cleaner processes each chapter using BeautifulSoup, removing advertisements, translator notes, navigation elements, and unnecessary markup while preserving readable content. Multiple cleaning profiles allow the extractor to adapt to different website structures.\n\nThe Export stage compiles cleaned chapters into EPUB ebooks using EbookLib before optionally converting them into professionally formatted PDFs with WeasyPrint. This produces consistent layouts, proper pagination, and a significantly improved offline reading experience.\n\nBecause every stage is independent, additional website parsers, cleaning rules, or export formats can be introduced without requiring major architectural changes.",
    devNotes: [
      "Playwright provides reliable extraction for JavaScript-rendered websites where standard HTTP requests are insufficient.",
      "BeautifulSoup powers HTML parsing, cleanup, and content normalization across supported sources.",
      "Cleaning profiles are modular, making it easy to support websites with different layouts.",
      "The export pipeline supports both EPUB generation and PDF conversion for multiple reading preferences.",
      "The project's modular architecture simplifies maintenance while making future platform support easier to implement.",
      "Future improvements could include additional ebook formats, metadata retrieval, and plugin-based website support."
    ],
    highlights: [
      {
        icon: "mdi:web",
        title: "Adaptive Downloader",
        description: "Automatically selects the appropriate extraction strategy for both static and JavaScript-rendered novel websites."
      },
      {
        icon: "mdi:code-braces",
        title: "Intelligent HTML Cleaning",
        description: "Removes advertisements, translator notes, and unnecessary markup while preserving clean, readable chapter content."
      },
      {
        icon: "mdi:book-open-page-variant",
        title: "Offline Ebook Generation",
        description: "Compiles extracted chapters into polished EPUB ebooks and high-quality PDF documents ready for offline reading."
      },
      {
        icon: "mdi:puzzle",
        title: "Modular Pipeline",
        description: "Independent download, cleaning, and export stages make the toolkit easy to maintain and extend."
      }
    ]
  },
  {
    id: 3,
    title: "FREE FREE FREE",
    slug: "free-free-free",
    subtitle: "A narrative-driven psychological desktop simulation inspired by the internet culture, software piracy, and digital anxieties of the mid-2000s.",
    role: "Co-Developer",
    featured: true,
    status: "Active",
    category: "Game",
    duration: "2 months",
    link: "https://github.com/Rachiminoff/FREEFREEFREE",
    itchLink: "https://daeowob.itch.io/free-free-free",
    video: "https://www.youtube.com/embed/CAeP5QStOrE?si=M8axOWtdfKER_7OF",
    description: "A psychological desktop simulation where a fake GTA IV leak traps players inside a sentient operating system controlled by a self-aware quarantine program.",
    overview: "FREE FREE FREE is a narrative-driven psychological desktop simulation set in 2005, during the height of internet forums, software piracy, and bulky CRT monitors. Players step into the shoes of a high school student who downloads what appears to be a leaked copy of Grand Theft Auto IV, only to awaken a self-aware quarantine program known as Cornelius Ray Trojan (CRT). What begins as harmless curiosity quickly spirals into an increasingly surreal experience where the operating system itself becomes the world, blending visual novel storytelling, desktop simulation, puzzle minigames, and immersive 3D exploration.\n\nRather than relying on traditional jump scares, the game builds tension through atmosphere, environmental storytelling, and subtle manipulation of the desktop environment. Applications, files, and seemingly ordinary system events gradually reveal the history, motives, and true nature of CRT, encouraging players to piece together the narrative themselves. The nostalgic mid-2000s setting isn't just aesthetic—it reinforces the game's themes of digital curiosity, trust, and the uneasy relationship between people and technology during the early days of the modern internet.",
    features: [
      "Windows-inspired desktop simulation with fully interactive applications",
      "Narrative-driven visual novel featuring branching dialogue and multiple endings",
      "Psychological horror built through atmosphere and environmental storytelling",
      "Interactive desktop applications and system events that directly influence progression",
      "Puzzle and arcade-inspired minigames woven naturally into the narrative",
      "Hybrid gameplay combining a 2D desktop interface with immersive 3D exploration",
      "Navigation-based enemy AI with stealth and pursuit mechanics",
      "Unlockable epilogue, bonus content, and optional side stories"
    ],
    tech: [
      "Godot 4",
      "GDScript",
      "Blender"
    ],
    architecture: "Desktop Simulation → Narrative System → 3D Exploration → Enemy AI\n\nBuilt with Godot 4, FREE FREE FREE combines multiple gameplay styles within a unified architecture while maintaining a seamless player experience.\n\nThe Desktop Simulation serves as the primary interface, recreating a Windows-inspired operating system using Godot's Control nodes. Applications, files, notifications, and system interactions are more than visual elements—they function as core gameplay mechanics that drive exploration and storytelling.\n\nThe Narrative System manages branching dialogue, progression flags, and player decisions throughout the experience. Conversations with CRT and interactions across the desktop influence future events, unlock alternative paths, and shape how the story unfolds.\n\nAs the narrative progresses, gameplay transitions into fully explorable 3D environments featuring environmental storytelling, puzzle-solving, and survival mechanics. These sequences expand the world beyond the desktop while preserving narrative continuity.\n\nEnemy behavior is powered by Godot's NavigationRegion3D and NavigationAgent3D systems, enabling dynamic pathfinding during chase sequences. A centralized progression system tracks player choices, discoveries, and story progression across both gameplay styles, ensuring that actions taken in one section meaningfully affect the other.",
    devNotes: [
      "Godot 4 provided the flexibility to combine desktop simulation, visual novel systems, and real-time 3D gameplay within a single project.",
      "Desktop UI, narrative progression, and gameplay systems were designed to seamlessly transition between 2D and 3D experiences.",
      "Blender streamlined the creation and iteration of modular 3D environments.",
      "Enemy AI leverages NavigationRegion3D and NavigationAgent3D to create dynamic pursuit sequences.",
      "My primary contributions focused on gameplay programming, narrative systems, progression logic, Stage 2 development, enemy AI, and unlockable content.",
      "Future updates could expand the story with additional endings, puzzles, and optional narrative routes."
    ],
    highlights: [
      {
        icon: "mdi:desktop-classic",
        title: "Desktop Simulation",
        description: "Explore a fully interactive 2005-inspired operating system where every application, file, and notification contributes to the experience."
      },
      {
        icon: "mdi:book-open-page-variant",
        title: "Psychological Narrative",
        description: "A story-driven experience told through branching dialogue, environmental storytelling, and conversations with the enigmatic CRT."
      },
      {
        icon: "mdi:controller-classic",
        title: "Hybrid Gameplay",
        description: "Fluidly transitions between desktop interaction, puzzle-solving, visual novel storytelling, and immersive 3D exploration."
      },
      {
        icon: "mdi:robot-angry",
        title: "Dynamic Enemy AI",
        description: "Navigation-based enemy behavior creates tense pursuit sequences that reinforce both gameplay and narrative."
      }
    ]
  },
  {
    id: 4,
    title: "Wais Wallet",
    slug: "wais-wallet",
    subtitle: "A mobile-first personal finance application built around intentional, envelope-style budgeting.",
    role: "Co-Developer",
    featured: false,
    status: "Archived",
    category: "Mobile App",
    duration: "2 months",
    link: "https://github.com/Rachiminoff/Wais_Wallet",
    liveDemo: "https://wais-wallet.vercel.app",
    images: [wais00, wais01, wais02, wais03],
    description: "A cross-platform budgeting application that helps users assign every peso a purpose through pocket-based budgeting and savings management.",
    overview: "Wais Wallet is a mobile personal finance application inspired by the envelope budgeting methodology. Rather than recording expenses after they've already happened, the app encourages users to proactively allocate every portion of their income into dedicated 'Wais Pockets' for categories such as groceries, bills, savings, or leisure. The result is a budgeting experience centered on intentional spending instead of reactive expense tracking.\n\nDeveloped as an early exploration of pocket-based budgeting, Wais Wallet laid the groundwork for many of the ideas that would later evolve into LedgerLeaf. While its focus remained on delivering a streamlined mobile experience with essential budgeting features, the project established the core financial philosophy, user workflows, and design patterns that influenced its larger full-stack successor.",
    features: [
      "Envelope budgeting through customizable Wais Pockets",
      "Financial dashboard with Safe-to-Spend balance calculation",
      "Real-time budget allocation tracking",
      "Budget planner for recurring and variable expenses",
      "Savings goals with visual progress tracking",
      "Responsive cross-platform mobile experience",
      "Clean financial dashboards with intuitive visualizations",
      "Purpose-driven income allocation workflow"
    ],
    tech: [
      "React Native",
      "Expo",
      "TypeScript",
      "React Navigation"
    ],
    architecture: "React Native UI → Context API → React Navigation → Local Storage\n\nWais Wallet follows a modular mobile architecture centered around simplicity, maintainability, and a smooth user experience.\n\nThe presentation layer is built with reusable React Native components organized around budgeting, savings, and financial dashboards. Consistent layouts and minimalist design choices keep financial information approachable without overwhelming users.\n\nApplication state is managed using React's Context API, providing a centralized source of truth for budget allocations, transactions, and savings goals while maintaining predictable data flow throughout the application.\n\nReact Navigation powers screen transitions and overall application flow, creating a structured navigation experience that remains scalable as new features are introduced.\n\nFinancial data is stored locally to support an offline-first experience, allowing users to continue managing their budgets without relying on constant internet connectivity. TypeScript provides end-to-end type safety, improving maintainability and reducing runtime errors as the application grows.",
    devNotes: [
      "React Native and Expo enabled rapid cross-platform development from a single codebase.",
      "The project adopts a modular component architecture to simplify maintenance and future expansion.",
      "TypeScript improves code quality through static type checking and stronger developer tooling.",
      "Financial information is presented through concise visual summaries that prioritize clarity over complexity.",
      "The interface emphasizes accessibility, simplicity, and ease of use over feature-heavy dashboards.",
      "Although archived, Wais Wallet became the conceptual foundation for the development of LedgerLeaf."
    ],
    highlights: [
      {
        icon: "mdi:wallet",
        title: "Envelope Budgeting",
        description: "Assign every peso to a dedicated Wais Pocket before spending, encouraging intentional financial planning."
      },
      {
        icon: "mdi:chart-pie",
        title: "Financial Dashboard",
        description: "Track Safe-to-Spend balances, budget allocations, and remaining funds through a clean, centralized overview."
      },
      {
        icon: "mdi:piggy-bank",
        title: "Savings Goals",
        description: "Create personalized savings targets and monitor progress with simple, visual indicators."
      },
      {
        icon: "mdi:cellphone",
        title: "Mobile-First Design",
        description: "Built with React Native to deliver a consistent, responsive experience across modern mobile devices."
      }
    ]
  },
{
  id: 5,
  title: "LedgerLeaf",
  slug: "ledgerleaf",
  subtitle: "A full-stack personal finance platform built around intentional, pocket-based budgeting and meaningful financial insights.",
  role: "Sole Developer",
  featured: true,
  status: "Active",
  category: "Web App",
  duration: "2 weeks",
  link: "https://github.com/Rachiminoff/LedgerLeaf",
  liveDemo: "https://ledgerleaf.onrender.com/",
  images: [ledger00, ledger01, ledger02, ledger03],
  description: "A modern full-stack finance management platform that helps users budget proactively through pocket-based fund allocation, expense tracking, and insightful financial reporting.",
  overview: "LedgerLeaf is a modern full-stack personal finance platform that expands upon the ideas first explored in my earlier mobile application, Wais Wallet. Built with Laravel and React, the platform encourages users to assign every peso a purpose before spending through a pocket-based budgeting system. Alongside budgeting, LedgerLeaf integrates expense tracking, savings management, financial analytics, reporting, and account management into a responsive web application designed for both desktop and mobile devices.\n\nMoving from a mobile-only application to a full-stack web platform made it possible to introduce more advanced financial tools, including interactive dashboards, detailed reporting, and a more capable budgeting engine. While the philosophy of intentional spending remains at its core, LedgerLeaf offers a richer and more scalable experience for users who want greater visibility into their financial habits and long-term goals.",
  features: [
    "Pocket-based budgeting with intentional fund allocation",
    "Expense tracking with searchable transaction history",
    "Savings goals with real-time progress monitoring",
    "Interactive financial dashboards and spending analytics",
    "Comprehensive pocket and budget management",
    "PDF and Excel report generation",
    "Secure authentication and user account management",
    "Responsive experience across desktop and mobile devices"
  ],
  tech: [
    "Laravel",
    "PHP",
    "React 19",
    "TypeScript",
    "Inertia.js",
    "Tailwind CSS",
    "MySQL",
    "Vite"
  ],
  architecture: "Browser → React + Inertia.js → Laravel → MySQL\n\nLedgerLeaf follows a modern full-stack monolithic architecture that combines a reactive frontend with Laravel's server-driven backend.\n\nThe application is delivered through a responsive web interface powered by React, providing a fast and interactive user experience while maintaining a traditional server-backed architecture. Reusable components power dashboards, budgeting tools, reports, and transaction management throughout the application.\n\nInertia.js bridges React and Laravel, allowing the application to behave like a single-page application without introducing a separate REST or GraphQL API. Routing, data hydration, and page transitions remain seamless while keeping development within Laravel's ecosystem.\n\nLaravel serves as the application's backend, handling authentication, routing, business logic, financial calculations, report generation, and data validation. The budgeting engine processes pocket allocations, transactions, savings goals, and financial summaries while ensuring consistency across the platform.\n\nMySQL provides relational storage for users, pockets, transactions, savings goals, and financial records. The schema is structured to support efficient queries, reporting, and future feature expansion while maintaining data integrity.\n\nThe application is deployed on Render, with Railway providing managed database hosting for the production environment.",
  devNotes: [
    "React and Inertia.js provide a modern SPA experience while preserving Laravel's server-driven architecture.",
    "The project follows a modular component structure that makes future features easier to develop and maintain.",
    "Financial dashboards prioritize clarity by presenting complex information through concise visual summaries.",
    "LedgerLeaf represents the evolution of Wais Wallet into a more comprehensive full-stack financial management platform.",
    "Laravel handles business-critical financial calculations server-side to ensure accuracy and data consistency.",
    "Future iterations could introduce automated budgeting recommendations, recurring transactions, and integrations with external financial services."
  ],
  highlights: [
    {
      icon: "mdi:wallet-plus",
      title: "Pocket-Based Budgeting",
      description: "Assign every peso to dedicated budgeting pockets before spending, encouraging intentional financial planning."
    },
    {
      icon: "mdi:chart-areaspline",
      title: "Financial Analytics",
      description: "Interactive dashboards provide clear insights into spending habits, pocket utilization, savings progress, and overall financial health."
    },
    {
      icon: "mdi:piggy-bank",
      title: "Savings Management",
      description: "Create savings goals, monitor progress, and manage deposits while maintaining accurate available balances."
    },
    {
      icon: "mdi:file-document-multiple",
      title: "Comprehensive Reporting",
      description: "Generate PDF and Excel reports alongside detailed transaction histories for deeper financial analysis and record keeping."
    }
    ]
  },
  {
    id: 6,
    title: "Loreboard",
    slug: "loreboard",
    subtitle: "A multilingual, data-driven archive and reference platform for cataloguing a slice-of-life media franchise across novels, manga, music, and community translations.",
    role: "Sole Developer",
    featured: false,
    status: "Active",
    category: "Web Platform",
    duration: "Ongoing",
    link: "",
    description: "A static-first reference site that organizes an expansive fandom catalogue — novels, manga, gallery art, music, and translated extras — into a fast, fully searchable, bilingual experience.",
    overview: "Loreboard is a static-first archive and reference site built to catalogue an expansive body of fandom content: light novels, manga, gallery illustrations, music, statistics, and community-translated extras. Rather than scattering this information across forums and file shares, the project centralizes it into a single, structured, and searchable experience available in both English and Spanish.\n\nThe site deliberately avoids a heavyweight frontend framework. Each major section is its own HTML entry point, with page-specific JavaScript fetching structured JSON at runtime and rendering it into the DOM. This keeps the site lightweight and fast while making content updates as simple as editing a JSON file rather than touching markup or logic.\n\nBecause catalogue accuracy matters as much as presentation, the project ships with an extensive Python and Playwright-driven QA suite that validates every declared data entry — including full bilingual coverage of the music library — alongside browser-based interaction tests and performance checks, giving confidence that new content doesn't silently break existing pages.",
    features: [
      "Structured, JSON-driven catalogue covering novels, manga, music, gallery art, and translated extras",
      "Bilingual content delivery (English and Spanish) with shared data conventions across locales",
      "Static, framework-free architecture using vanilla HTML, CSS, and JavaScript for speed and simplicity",
      "Multi-page Vite build pipeline with runtime-loaded JSON and shared HTML components",
      "Exhaustive automated QA suite covering static data validation, browser interactions, and performance",
      "Search, filtering, and favoriting across the music and reading libraries",
      "Clean-URL routing via Cloudflare Pages redirects for a traditional multi-page site",
      "Clear separation between content (JSON) and presentation (JS/CSS) for low-cost catalogue updates"
    ],
    tech: [
      "JavaScript",
      "HTML5",
      "CSS3",
      "Vite",
      "Python",
      "Playwright",
      "ESLint",
      "Prettier"
    ],
    architecture: "HTML Page → Shared Components (menu/footer) → Page JavaScript → fetch() → JSON Data → DOM Render\n\nLoreboard follows a deliberately simple, static-first architecture with no frontend framework or client-side router. Each major site section is its own HTML entry point under a pages directory, paired with page-specific JavaScript and styles.\n\nContent lives entirely in structured JSON rather than hard-coded markup. Page scripts fetch the relevant JSON at runtime and render it into the DOM, so routine catalogue changes only require editing data files, not application code.\n\nShared UI such as the navigation menu, footer, and feedback widget is factored into reusable HTML/JS components to avoid duplicating site-wide behavior across pages.\n\nVite serves as the development server and production build tool, using multi-page build support to register each HTML entry point as a separate build target. A custom runtime-copy plugin ensures JSON data, shared HTML fragments, and Cloudflare Pages configuration are carried into the final build output, since some assets are loaded dynamically rather than through Vite's module graph.\n\nThe site deploys as a static build to Cloudflare Pages, with clean URLs resolved through redirect rules. A separate Python and Playwright-based QA harness builds the site, serves it locally, and runs static, browser, and performance checks before changes are considered safe to ship.",
    devNotes: [
      "Keeping the frontend framework-free kept the site fast and let each page stay independently simple to reason about.",
      "Centralizing all catalogue content in JSON made large-scale content additions a data task rather than a code task.",
      "Bilingual support required consistent field naming across locale files so shared rendering logic could serve both languages.",
      "The QA suite was built to be exhaustive rather than representative — every music track, for example, is validated in both supported languages.",
      "Vite's multi-page build mode was a good fit for preserving a traditional page-per-section structure while still getting modern tooling.",
      "Future iterations could add a lightweight content-authoring workflow to further reduce the friction of routine catalogue updates."
    ],
    highlights: [
      {
        icon: "mdi:book-multiple",
        title: "Unified Fandom Catalogue",
        description: "Brings novels, manga, gallery art, music, and translated extras together into one structured, browsable archive."
      },
      {
        icon: "mdi:translate",
        title: "Bilingual by Design",
        description: "Serves English and Spanish content from shared data conventions, keeping both locales consistent as the catalogue grows."
      },
      {
        icon: "mdi:speedometer",
        title: "Static-First Performance",
        description: "A framework-free, JSON-driven architecture keeps pages lightweight, fast, and simple to deploy on Cloudflare Pages."
      },
      {
        icon: "mdi:test-tube",
        title: "Exhaustive Automated QA",
        description: "A Python and Playwright test harness validates catalogue data, page interactions, and performance before every release."
      }
    ]
  }
];

// Helper function to generate slug from title (if not provided)
export const generateSlug = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, '-');
};

// Look up a single project by its slug (e.g. for a /projects/:slug route)
export const getProjectBySlug = (slug: string): Project | undefined =>
  projectsData.find((project) => project.slug === slug);

// Projects flagged for prominent display (e.g. on the homepage)
export const getFeaturedProjects = (): Project[] =>
  projectsData.filter((project) => project.featured);

// Filter projects by their current status
export const getProjectsByStatus = (status: ProjectStatus): Project[] =>
  projectsData.filter((project) => project.status === status);

// Filter projects by category (Mobile App, Web App, Game, etc.)
export const getProjectsByCategory = (category: ProjectCategory): Project[] =>
  projectsData.filter((project) => project.category === category);

// Deduplicated, alphabetized list of every technology used across all projects
export const getAllTechnologies = (): string[] =>
  Array.from(new Set(projectsData.flatMap((project) => project.tech))).sort();