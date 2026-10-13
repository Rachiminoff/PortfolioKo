# Personal Portfolio

<p align="center">
  <strong>A modern, responsive portfolio built with React and TypeScript.</strong><br/>
  Showcasing projects, technical expertise, professional experience, certifications, and development insights.
</p>

<p align="center">

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-C76494?style=for-the-badge&logo=sass&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

</p>

<p align="center">

<a href="#overview">Overview</a> •
<a href="#features">Features</a> •
<a href="#tech-stack">Tech Stack</a> •
<a href="#getting-started">Getting Started</a> •
<a href="#project-structure">Project Structure</a> •
<a href="#license">License</a>

</p>

---

## Overview

This repository contains the source code for my personal portfolio website, built with Create React App, React 18, and TypeScript 4.9.

Designed with a focus on clean presentation, performance, and accessibility, it serves as a central hub for showcasing my work as a Full-Stack Developer. The website highlights selected projects, technical skills, professional experience, certifications, and provides an easy way to get in touch.

The application is fully responsive and optimised for both desktop and mobile devices, delivering a consistent user experience across screen sizes.

---

## Features

- Responsive layout for desktop, tablet, and mobile
- Project showcase with detailed information
- Technical skills and technology overview
- Professional experience timeline
- Certifications section
- Contact page
- Smooth page transitions and animations
- Fast client-side navigation
- Clean, accessible interface

---

## Tech Stack

| Category  | Technologies      |
| --------- | ----------------- |
| Frontend  | React, TypeScript |
| Styling   | SCSS              |
| Routing   | React Router      |
| Animation | Framer Motion     |
| Icons     | React Icons       |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

```bash
git clone https://github.com/Rachiminoff/Rachiminoff.github.io.git

cd Rachiminoff.github.io

npm install
```

### Run the Development Server

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
```

### CI / CD

The repository uses GitHub Actions for continuous integration. Pull requests and pushes to `main` run linting, formatting checks, tests, and a production build. Vercel handles production deployment automatically from the connected Git repository.

#### GitHub Actions secrets

Add these repository secrets under **GitHub → Settings → Secrets and variables → Actions**:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY` (frontend only; public by design)

#### Vercel environment variables

Configure the runtime secrets in the Vercel project itself for the environments where they are needed. Keep server-only values out of `REACT_APP_*` variables. Before deploying the vault API, run `supabase/vault_security.sql` in the Supabase SQL Editor to create the server-side rate-limit table. Required vault API variables: `SUPABASE_SERVICE_ROLE_KEY` (server-only; never use the `REACT_APP_` prefix), `VAULT_PASSWORD`, and `VAULT_SESSION_SECRET` (a long random secret used to sign stateless vault cookies). Set `SUPABASE_URL` or reuse `REACT_APP_SUPABASE_URL` for the server-side Supabase URL. Other API/server variables include `BLOG_PASSWORD`, `BLOG_SESSION_SECRET`, `LASTFM_USERNAME`, and `LASTFM_API_KEY`. Do not commit secret values to the repository.

Vercel remains responsible for deployment; GitHub Actions only verifies that changes pass the project checks before they are merged or pushed to `main`.

---

## Live Website

https://tanyadeniseyambao.vercel.app/

---

## Project Structure

```text
src/
├── portfolio/       # Main portfolio components, styles, and project data
├── persona/          # Persona page components, styles, and content
├── pages/            # Route-level page components
├── routes/           # Route guards and access gates
├── seo/              # Runtime SEO metadata and route config
├── hooks/            # Shared React hooks
├── lib/              # Supabase and shared service clients
└── layouts/          # Default and fullscreen layouts
api/                  # Vercel serverless endpoints
scripts/              # Build-time SEO generation
supabase/             # SQL setup and policy scripts
```

---

## Design Goals

This portfolio was built with the following principles in mind:

- Performance-first architecture
- Responsive design
- Accessibility
- Maintainable codebase
- Modern UI with subtle animations
- Clean and readable developer experience

---

## License

This repository contains the source code for my personal portfolio website, built with Create React App, React 18, and TypeScript 4.9.

The source code may be referenced for educational purposes. However, the website's branding, written content, images, assets, and overall identity are proprietary and may not be copied, redistributed, or reused without prior permission.

---

<p align="center">
Built with React, TypeScript, and SCSS.
</p>


Masterlist updates: the Stats Country of Origin pie includes Literature, Games, and Movies; genre stats combine Literature metadata, game tags, and movie genres. See `MASTERLIST_SETUP.md` for the safe SQL migration and TMDB poster-sync Edge Function setup.


### Automatic movie poster sync

See `supabase/schedule_movie_poster_sync.sql` and section 8 of `MASTERLIST_SETUP.md` to configure a Supabase scheduled job. Once configured, it fills missing `movie_masterlist.poster_url` values in batches without manual `curl` requests. Keep TMDB and sync guard secrets in Supabase Edge Function secrets.


## Architecture

- `src/App.tsx` defines the application routes and lazy-loaded page entry points.
- `src/portfolio/data/projects.data.ts` is the source of truth for project cards and project-detail content.
- `src/seo/seoConfig.ts` provides route metadata and JSON-LD; `scripts/generate-seo.js` generates per-project static metadata pages, `sitemap.xml`, and `robots.txt` after the production build.
- `src/lib/supabase.ts` configures the browser Supabase client. Serverless endpoints live under `api/`; privileged server secrets must never be exposed through `REACT_APP_*` variables.
- `src/persona/` contains the separate Persona experience and its content data.

## Featured work

The portfolio includes UniQuest (gamified campus productivity), Webnovel Extractor (ebook automation), Loreboard (static bilingual media catalogue), Robinson (lyric-synchronized generative typography), and HelmTrack (YOLOv8 + ByteTrack computer-vision thesis project). HelmTrack performance figures will be published only after the final evaluation results are confirmed.
