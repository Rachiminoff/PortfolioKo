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

export interface Project {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  role: string;
  featured: boolean;
  status: 'Active' | 'Archived' | 'In Development' | 'Completed';
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
  highlights: {
    icon: string;
    title: string;
    description: string;
  }[];
}

export const projectsData: Project[] = [
  {
    id: 1,
    title: "UniQuest",
    slug: "uniquest",
    subtitle: "Mobile-first campus companion that combines productivity, exploration, and gamification for university students.",
    role: "Lead Developer",
    featured: true,
    status: "Active",
    duration: "4 months",
    link: "https://github.com/Skabeez/UniQuest",
    images: [uniq00, uniq01, uniq02, uniq03],
    description: "A cross-platform mobile application that blends task management, campus exploration, and RPG-inspired progression into a unified student experience.",
    overview: "UniQuest is a mobile-first productivity platform designed to make university life more engaging. Rather than treating productivity as a checklist, it introduces RPG-inspired mechanics where students complete tasks, progress through missions, unlock achievements, and explore an interactive campus map. Built with Flutter and Supabase, the platform delivers a responsive cross-device experience with secure authentication and real-time data synchronization.\n\nThe application emerged from a common observation: university students struggle to maintain motivation across academic, social, and personal tasks. By reframing these activities as 'quests' within a gamified system, UniQuest transforms mundane responsibilities into meaningful progression. The campus map feature adds a spatial dimension, helping students discover resources and locations they might otherwise overlook.\n\nDevelopment was accelerated using FlutterFlow's visual development environment while maintaining full Flutter cross-platform capabilities. This hybrid approach enabled rapid prototyping and iteration while preserving the flexibility to extend functionality through custom Dart code.",
    features: [
      "Gamified task management with missions, experience points, and achievements",
      "Interactive campus map with location pins and information cards",
      "Secure email authentication powered by Supabase",
      "Real-time cloud synchronization across devices",
      "Personalized onboarding and guided walkthroughs",
      "Modern dark-first interface optimized for mobile devices",
      "Student profile customization and settings management",
      "Productivity tracking through quests and progression metrics"
    ],
    tech: [
      "Flutter",
      "Dart",
      "Supabase",
      "FlutterFlow"
    ],
    architecture: "Flutter → FlutterFlow → Supabase → Database\n\nUniQuest follows a modern mobile architecture with a clear flow from the user interface to the backend:\n\nFlutter serves as the presentation layer, delivering a responsive, dark-first interface optimized for mobile use. Screens are organized around key user flows: the dashboard for quest overview, the map view for campus exploration, and the profile section for achievement tracking and settings.\n\nThe gamification engine manages mission progression, experience points, and achievement unlocks through a state management system that tracks user activity and rewards progress. This business logic layer handles the core RPG-inspired mechanics while maintaining separation from the UI components.\n\nSupabase provides authentication, real-time subscriptions, and a PostgreSQL database that handles user profiles, task data, and synchronization across devices. The data layer abstracts backend operations, allowing consistent interaction regardless of the underlying data source.\n\nThis architectural separation enables independent testing and iteration of each component, making the application maintainable and extensible for future feature additions.",
    devNotes: [
      "FlutterFlow accelerated development while preserving Flutter's cross-platform capabilities",
      "Supabase provided authentication and real-time backend services with minimal infrastructure overhead",
      "The achievement and mission systems were designed to be modular for future expansion",
      "The application adopts a dark-first design language optimized for extended mobile use",
      "Interactive campus maps were implemented to provide both navigation and contextual campus information",
      "Future iterations could include push notifications for quest reminders and social features for peer accountability"
    ],
    highlights: [
      {
        icon: "mdi:gamepad-variant",
        title: "Gamified Productivity",
        description: "Transforms everyday academic tasks into rewarding missions with experience points, levels, and achievements."
      },
      {
        icon: "mdi:map-marker-radius",
        title: "Interactive Campus Map",
        description: "Explore university landmarks through tappable location pins featuring photos and detailed information cards."
      },
      {
        icon: "mdi:sync",
        title: "Real-time Synchronization",
        description: "Keeps tasks, achievements, and user progress synchronized securely across multiple devices."
      },
      {
        icon: "mdi:account-check",
        title: "Student Experience",
        description: "Provides onboarding, profile customization, secure authentication, and a polished mobile-first interface designed for university life."
      }
    ]
  },
  {
    id: 2,
    title: "Webnovel Extractor",
    slug: "webnovel-extractor",
    subtitle: "Automation toolkit for downloading, cleaning, and compiling web novels into offline-ready formats.",
    role: "Sole Developer",
    featured: false,
    status: "Completed",
    duration: "2 months",
    link: "https://github.com/Rachiminoff/Webnovel-Extractor",
    video: "https://www.youtube.com/embed/Zclw7GV7w7I",
    description: "A Python-based automation toolkit that extracts, cleans, and compiles web novel chapters from supported websites into high-quality EPUB and PDF formats.",
    overview: "Webnovel Extractor is a utility built for readers and fan translators who want a streamlined way to archive web novels for offline reading. Designed primarily for YoruApp/LumoStories and WordPress-based novel sites, the application automates the entire workflow—from downloading chapters and cleaning HTML to generating polished EPUB ebooks and printable PDF files. By combining browser automation, intelligent HTML processing, and document conversion, the tool minimizes manual editing while producing consistently clean output.\n\nThe project was motivated by a personal frustration: reading web novels online is convenient, but internet connectivity issues, intrusive advertisements, and inconsistent formatting make the experience less than ideal. Webnovel Extractor solves these problems by providing a reliable offline archive that preserves the reading experience without the distractions of the original website.",
    features: [
      "Bulk chapter downloads from Table of Contents or individual chapter URLs",
      "Support for both static HTML and JavaScript-rendered websites",
      "Automatic removal of ads, translator notes, and unnecessary page elements",
      "Multiple cleaning modes for different website structures",
      "EPUB compilation for offline reading with proper formatting",
      "EPUB-to-PDF conversion with cover extraction, chapter breaks, and page numbering",
      "Optimized workflow for YoruApp/LumoStories and WordPress-hosted novel sites",
      "Modular pipeline that simplifies support for additional website sources"
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
    architecture: "Website → Downloader → Cleaner → Export → EPUB → PDF\n\nThe application follows a modular pipeline architecture with a clear data flow:\n\nWebsite serves as the source, providing raw HTML content from either static pages or JavaScript-rendered platforms like YoruApp.\n\nThe Downloader retrieves chapter content using either standard HTTP requests or Playwright. Playwright is specifically used for JavaScript-rendered pages, providing a headless browser environment that executes client-side JavaScript to load dynamic content. The downloader handles pagination, navigation through table of contents, and rate limiting to avoid triggering anti-scraping measures.\n\nThe Cleaner processes raw HTML by removing unwanted elements including advertisements, translator notes, navigation elements, and social media widgets. The module uses BeautifulSoup for DOM parsing and includes multiple cleaning modes to accommodate different website structures.\n\nThe Export pipeline compiles cleaned chapters into EPUB files using EbookLib, including automatic cover generation, chapter breaks, and embedded illustrations. The PDF conversion layer uses WeasyPrint to generate print-ready documents with proper pagination, page numbers, and typographic formatting optimized for reading on e-ink devices.\n\nEach module operates independently, allowing users to customize the pipeline or extend it with additional processing steps. The architecture prioritizes reliability and consistency across different source websites, with fallback mechanisms for handling edge cases and malformed HTML.",
    devNotes: [
      "Playwright was selected for reliable rendering of JavaScript-heavy websites such as YoruApp",
      "BeautifulSoup powers HTML parsing and content normalization after extraction",
      "The cleaner includes multiple processing modes to accommodate different website structures",
      "The export pipeline supports both EPUB generation and PDF conversion for flexible offline reading",
      "The project was intentionally designed around modular components to simplify support for additional novel platforms in the future",
      "Future improvements could include support for additional formats like MOBI and automated metadata extraction"
    ],
    highlights: [
      {
        icon: "mdi:web",
        title: "Smart Downloader",
        description: "Downloads chapters from both static and JavaScript-rendered novel websites using the appropriate extraction strategy."
      },
      {
        icon: "mdi:code-braces",
        title: "Intelligent Cleaning",
        description: "Automatically removes ads, translator notes, and unnecessary formatting while preserving readable chapter content."
      },
      {
        icon: "mdi:book-open-page-variant",
        title: "EPUB & PDF Export",
        description: "Compiles cleaned chapters into polished EPUB ebooks and high-quality PDF documents for offline reading."
      },
      {
        icon: "mdi:puzzle",
        title: "Modular Pipeline",
        description: "Independent download, cleaning, and export modules make the toolkit easy to maintain and extend."
      }
    ]
  },
  {
    id: 3,
    title: "FREE FREE FREE",
    slug: "free-free-free",
    subtitle: "Narrative-driven psychological desktop simulation inspired by the internet culture of the mid-2000s.",
    role: "Co-Developer",
    featured: true,
    status: "Active",
    duration: "2 months",
    link: "https://github.com/Rachiminoff/FREEFREEFREE",
    itchLink: "https://daeowob.itch.io/free-free-free",
    video: "https://www.youtube.com/embed/CAeP5QStOrE?si=M8axOWtdfKER_7OF",
    description: "A narrative-driven psychological desktop simulation where a fake GTA IV leak traps players inside a sentient operating system ruled by a self-aware quarantine program.",
    overview: "FREE FREE FREE is a story-driven psychological desktop simulation set in 2005 during the height of internet forums, software piracy, and CRT monitors. Players take the role of a high school student who downloads what appears to be a leaked copy of Grand Theft Auto IV, only to awaken a sentient quarantine program named Cornelius Ray Trojan (CRT). The game seamlessly blends visual novel storytelling, desktop simulation, puzzle minigames, and 3D exploration as players navigate an increasingly surreal operating system where every interaction advances both the narrative and the mystery surrounding CRT.\n\nThe game's design philosophy centers on environmental storytelling and psychological tension rather than jump scares. The desktop interface serves as both a gameplay mechanic and a narrative device, with applications, files, and system events gradually revealing the truth about CRT's origins and intentions. The mid-2000s setting is deliberately chosen to evoke nostalgia while highlighting the era's anxieties about technology and privacy.",
    features: [
      "Authentic Windows-inspired desktop simulation with interactive applications",
      "Narrative-driven visual novel with branching dialogue and multiple endings",
      "Psychological horror through environmental storytelling instead of jump scares",
      "Interactive desktop applications and system events that advance the narrative",
      "Puzzle and arcade-inspired minigames integrated into the story progression",
      "Hybrid 2D desktop interface and 3D exploration sequences",
      "Enemy AI with dynamic pursuit and stealth mechanics",
      "Unlockable epilogue, side stories, and bonus content"
    ],
    tech: [
      "Godot 4",
      "GDScript",
      "Blender"
    ],
    architecture: "Desktop Simulation → Dialogue System → 3D Exploration → Enemy AI\n\nBuilt in Godot 4, the project combines a simulated desktop environment with traditional game systems across two distinct stages:\n\nThe Desktop Simulation phase focuses on desktop interaction, dialogue systems, and narrative progression through simulated operating system applications. The desktop UI is built using Godot's Control nodes, creating an interactive Windows-inspired environment where files, applications, and system events become core gameplay mechanics. A custom dialogue system manages branching conversations with CRT, tracking player choices and narrative flags that influence the story's direction.\n\nThe Dialogue System serves as the narrative engine, managing branching conversations with CRT and tracking player choices. These choices influence story direction and unlock different narrative paths, creating a personalized experience for each player.\n\nThe 3D Exploration phase transitions into fully explorable environments featuring AI pathfinding, survival gameplay, and enemy chase mechanics. Environmental storytelling continues through 3D spaces filled with contextual details and discoverable secrets.\n\nThe Enemy AI utilizes NavigationRegion3D and NavigationAgent3D for dynamic pathfinding during chase sequences, creating tension that supports the game's narrative progression. The AI adapts to player behavior, making each encounter feel unique and threatening.\n\nA centralized state management system tracks player decisions, discovered information, and narrative flags across both stages. This ensures that actions taken in the desktop environment meaningfully affect the 3D sequences and vice versa, creating a cohesive player experience.",
    devNotes: [
      "Godot 4 was chosen for its flexibility in combining desktop simulation, narrative systems, and 3D gameplay",
      "The project combines desktop UI, visual novel systems, and real-time gameplay within a unified architecture",
      "Native Blender integration streamlined the workflow for importing modular 3D environments",
      "Enemy AI utilizes NavigationRegion3D and NavigationAgent3D for dynamic pathfinding during chase sequences",
      "My primary contributions focused on gameplay programming, narrative systems, progression logic, Stage 2 implementation, enemy AI, and unlockable content",
      "Future iterations could expand the narrative with additional endings and more complex puzzle mechanics"
    ],
    highlights: [
      {
        icon: "mdi:desktop-classic",
        title: "Desktop Simulation",
        description: "An interactive 2005-inspired operating system where files, applications, and windows become core gameplay mechanics."
      },
      {
        icon: "mdi:book-open-page-variant",
        title: "Narrative Experience",
        description: "A visual novel driven by dialogue, environmental storytelling, and memorable character interactions with the sentient program CRT."
      },
      {
        icon: "mdi:controller-classic",
        title: "Hybrid Gameplay",
        description: "Seamlessly transitions from desktop puzzles and minigames into immersive 3D exploration and survival sequences."
      },
      {
        icon: "mdi:robot-angry",
        title: "Dynamic Enemy AI",
        description: "Navigation-based enemy pursuit and survival mechanics create tension while supporting the game's narrative progression."
      }
    ]
  },
  {
    id: 4,
    title: "Wais Wallet",
    slug: "wais-wallet",
    subtitle: "Mobile personal finance application built around the envelope budgeting methodology.",
    role: "Co-Developer",
    featured: false,
    status: "Archived",
    duration: "2 months",
    link: "https://github.com/Rachiminoff/Wais_Wallet",
    liveDemo: "https://wais-wallet.vercel.app",
    images: [wais00, wais01, wais02, wais03],
    description: "A cross-platform budgeting application that helps users allocate income into purpose-driven spending categories and track financial goals.",
    overview: "Wais Wallet is a mobile personal finance application inspired by the envelope budgeting methodology. Instead of tracking expenses after they occur, the platform encourages users to assign every portion of their income to dedicated 'Wais Pockets' such as groceries, rent, savings, or leisure before spending begins. The application combines budget planning, savings goals, and financial insights into a clean, intuitive mobile experience that promotes mindful spending and long-term financial discipline.\n\nThe application was developed as a precursor to LedgerLeaf, exploring the envelope budgeting concept within a mobile-first context. While Wais Wallet focuses specifically on the mobile experience and core budgeting mechanics, it laid the foundation for the more comprehensive financial management features later implemented in LedgerLeaf.",
    features: [
      "Envelope budgeting through customizable Wais Pockets",
      "Financial dashboard with safe-to-spend balance calculation",
      "Real-time budget allocation tracking",
      "Budget planner for recurring and variable expenses",
      "Savings goals with visual progress indicators",
      "Responsive cross-platform mobile interface",
      "Clean and intuitive financial visualization",
      "Purpose-driven income allocation workflow"
    ],
    tech: [
      "React Native",
      "Expo",
      "TypeScript",
      "React Navigation"
    ],
    architecture: "UI Components → State Management → Navigation → Offline Storage\n\nWais Wallet follows a component-based mobile architecture with a clear separation of concerns:\n\nThe UI Components layer is constructed from reusable React Native components organized around key user flows. Screens are designed for budgeting, savings, and dashboard functionality, with a clean, minimalist interface that reduces cognitive load. The presentation layer focuses on accessibility and clarity, using consistent design patterns across all screens.\n\nThe State Management layer uses React's Context API to provide a centralized store for budget allocations, transaction history, and savings goals. This approach ensures consistent data flow across components while maintaining simplicity for a mobile application.\n\nThe Navigation layer, powered by React Navigation, provides a structured and scalable navigation flow suitable for mobile applications. The navigation architecture supports deep linking and maintains navigation state across app sessions, ensuring users can return to their previous context.\n\nThe Offline Storage layer emphasizes offline-first data management, with local storage providing immediate access to financial data and synchronization occurring periodically. This design choice ensures that users can access their budget information even without an active internet connection. When connectivity is restored, the application synchronizes changes with persistent storage.\n\nTypeScript provides type safety across the codebase, improving code reliability and developer experience during maintenance and feature expansion.",
    devNotes: [
      "React Native and Expo enabled rapid cross-platform mobile development",
      "The application follows a modular component architecture for easier maintenance and scalability",
      "TypeScript improves code reliability through static type checking",
      "Financial data is presented using concise visual summaries to reduce cognitive load",
      "The interface prioritizes accessibility and simplicity over feature-heavy dashboards",
      "While the project is archived, the concepts and architecture informed the development of LedgerLeaf"
    ],
    highlights: [
      {
        icon: "mdi:wallet",
        title: "Envelope Budgeting",
        description: "Allocate every unit of income into dedicated Wais Pockets before spending begins."
      },
      {
        icon: "mdi:chart-pie",
        title: "Financial Dashboard",
        description: "Monitor safe-to-spend balances, budget allocation, and remaining funds through a centralized overview."
      },
      {
        icon: "mdi:piggy-bank",
        title: "Savings Goals",
        description: "Create multiple savings targets and monitor progress with intuitive visual indicators."
      },
      {
        icon: "mdi:cellphone",
        title: "Mobile-First Experience",
        description: "Built with React Native to deliver a responsive, consistent experience across mobile devices."
      }
    ]
  },
  {
    id: 5,
    title: "LedgerLeaf",
    slug: "ledgerleaf",
    subtitle: "Full-stack personal finance management system centered around intentional, pocket-based budgeting.",
    role: "Sole Developer",
    featured: true,
    status: "Active",
    duration: "2 weeks",
    link: "https://github.com/Rachiminoff/LedgerLeaf",
    liveDemo: "https://ledgerleaf.onrender.com/",
    images: [ledger00, ledger01, ledger02, ledger03],
    description: "A modern full-stack finance management platform that encourages proactive budgeting through pocket-based fund allocation and comprehensive financial insights.",
    overview: "LedgerLeaf is a modern full-stack personal finance management system that expands upon the concepts introduced in my earlier mobile project, Wais Wallet. Built from the ground up using Laravel and React, it encourages users to assign every peso a purpose before spending through a pocket-based budgeting workflow. The platform combines budgeting, expense tracking, savings management, financial analytics, reporting, and user account management into a responsive web application designed for both desktop and mobile devices.\n\nThe transition from a mobile-only application to a full-stack web platform allowed for more sophisticated financial features, including detailed analytics, comprehensive reporting, and a more robust budgeting engine. The pocket-based budgeting approach remains central to the application's philosophy, but the web platform provides a more feature-rich environment for managing complex financial situations.",
    features: [
      "Pocket-based budgeting and fund allocation",
      "Expense tracking with detailed transaction history",
      "Savings goals with progress monitoring and tracking",
      "Interactive financial dashboards and analytics",
      "Budget planner with comprehensive pocket management",
      "PDF and Excel report generation",
      "Secure authentication and user profile management",
      "Responsive desktop and mobile experience"
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
    architecture: "Browser → React → Inertia.js → Laravel → MySQL\n\nLedgerLeaf follows a modern full-stack monolithic architecture with a clear flow from the browser to the database:\n\nThe Browser serves as the entry point, delivering the application to users through a responsive web interface optimized for both desktop and mobile devices.\n\nThe React frontend handles UI rendering and user interactions, delivering a responsive single-page application experience. The frontend architecture is component-based, with reusable components for financial dashboards, budget planners, and transaction lists.\n\nInertia.js provides seamless page transitions and state management between React and Laravel. This approach eliminates the need for a separate API layer while maintaining the benefits of a modern SPA experience. Inertia.js simplifies the integration between Laravel and React by handling data passing and routing.\n\nThe Laravel backend manages authentication, routing, business logic, financial calculations, report generation, and database operations. The backend implements the core budgeting engine, handling pocket allocation, transaction processing, and savings goal management. Financial calculations are performed server-side to ensure correctness and data consistency.\n\nThe MySQL database provides relational data storage for users, pockets, transactions, savings goals, and financial records. The database schema is designed to support complex financial queries while maintaining performance through proper indexing and query optimization.\n\nThe application is deployed with Render for the application layer and Railway for database hosting, providing a reliable production environment.",
    devNotes: [
      "React and Inertia.js provide a modern SPA experience while preserving Laravel's server-side architecture",
      "The application follows a modular component structure that simplifies future feature expansion",
      "Financial dashboards aggregate data into concise summaries that prioritize clarity over complexity",
      "LedgerLeaf represents the evolution of my earlier Wais Wallet concept into a complete production-ready full-stack web application",
      "Future improvements could include automated budgeting suggestions based on spending patterns and integration with external financial services"
    ],
    highlights: [
      {
        icon: "mdi:wallet-plus",
        title: "Pocket-Based Budgeting",
        description: "Allocate funds into dedicated budgeting pockets before spending to promote intentional financial planning."
      },
      {
        icon: "mdi:chart-areaspline",
        title: "Financial Analytics",
        description: "Interactive dashboards visualize spending trends, pocket utilization, savings progress, and overall financial health."
      },
      {
        icon: "mdi:piggy-bank",
        title: "Savings Management",
        description: "Create savings goals, monitor progress, and manage deposits while maintaining accurate Safe Balance calculations."
      },
      {
        icon: "mdi:file-document-multiple",
        title: "Comprehensive Reporting",
        description: "Generate PDF and Excel reports alongside detailed transaction histories for deeper financial analysis."
      }
    ]
  }
];

// Helper function to generate slug from title (if not provided)
export const generateSlug = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, '-');
};