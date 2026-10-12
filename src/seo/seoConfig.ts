import { projectsData } from '../portfolio/data/projects.data';

export const SITE_URL = (
  process.env.REACT_APP_SITE_URL || 'https://tanyadeniseyambao.vercel.app'
).replace(/\/$/, '');
export const SITE_NAME = 'Tanya Denise Yambao';
export const DEFAULT_TITLE = 'Tanya Denise Yambao | Full-Stack React Developer';
export const DEFAULT_DESCRIPTION =
  'Portfolio of Tanya Denise Yambao, a Full-Stack React Developer specializing in React, TypeScript, Node.js, Express, PostgreSQL, and Supabase. Explore projects, technical skills, certifications, and experience building modern web applications.';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export type RouteSeo = {
  title: string;
  description: string;
  path: string;
  image: string;
  /** Private or personal pages are kept out of search results. */
  noindex: boolean;
  type: 'website' | 'article';
  jsonLd?: Record<string, unknown>;
};

const PRIVATE_PAGES: Record<string, { title: string; description: string }> = {
  '/persona': { title: 'Persona', description: 'A personal corner of the site.' },
  '/vault': { title: 'Vault', description: 'Private files and documents.' },
  '/archive': { title: 'Archive', description: 'Private archive.' },
  '/insights': { title: 'Insights', description: 'Site analytics and insights.' },
  '/wish-archive': { title: 'Wish Archive', description: 'Personal wish and pull archive.' },
  '/adashima-stats': { title: 'Adashima Stats', description: 'Personal fan archive statistics.' },
  '/masterlist': {
    title: 'Masterlist',
    description: 'Personal library of literature, games, and movies.',
  },
};

export const PRIVATE_PATHS = Object.keys(PRIVATE_PAGES);

const truncate = (text: string, max = 158) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

export function getRouteSeo(pathname: string): RouteSeo {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  const projectMatch = /^\/projects\/([^/]+)$/.exec(path);
  if (projectMatch) {
    const project = projectsData.find((item) => item.slug === projectMatch[1]);
    if (project) {
      const description = truncate(project.description);
      const url = `${SITE_URL}/projects/${project.slug}`;
      return {
        title: `${project.title} | ${project.category} by ${SITE_NAME}`,
        description,
        path: `/projects/${project.slug}`,
        image: DEFAULT_IMAGE,
        noindex: false,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description,
          url,
          genre: project.category,
          keywords: project.tech.join(', '),
          author: { '@type': 'Person', name: SITE_NAME, url: SITE_URL },
        },
      };
    }
  }

  const privatePage = PRIVATE_PAGES[path];
  if (privatePage) {
    return {
      title: `${privatePage.title} | ${SITE_NAME}`,
      description: privatePage.description,
      path,
      image: DEFAULT_IMAGE,
      noindex: true,
      type: 'website',
    };
  }

  const isHome = path === '/';
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: isHome ? '/' : '/',
    image: DEFAULT_IMAGE,
    noindex: !isHome,
    type: 'website',
  };
}
