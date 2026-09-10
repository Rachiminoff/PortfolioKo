# Personal Portfolio

<p align="center">
  <strong>A modern, responsive portfolio built with React and TypeScript.</strong><br/>
  Showcasing projects, technical expertise, professional experience, certifications, and development insights.
</p>

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
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

This repository contains the source code for my personal portfolio website.

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
- `REACT_APP_SUPABASE_ANON_KEY`

#### Vercel environment variables

Configure the runtime secrets in the Vercel project itself for the environments where they are needed. Keep server-only values out of `REACT_APP_*` variables. Existing API/server variables include values such as `SUPABASE_SERVICE_ROLE_KEY`, `BLOG_PASSWORD`, `BLOG_SESSION_SECRET`, `VAULT_PASSWORD`, `LASTFM_USERNAME`, and `LASTFM_API_KEY`.

Vercel remains responsible for deployment; GitHub Actions only verifies that changes pass the project checks before they are merged or pushed to `main`.

---

## Live Website

> Private

---

## Project Structure

```text
src/
├── assets/
├── components/
├── hooks/
├── pages/
├── styles/
└── utils/
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

This repository contains the source code for my personal portfolio website.

The source code may be referenced for educational purposes. However, the website's branding, written content, images, assets, and overall identity are proprietary and may not be copied, redistributed, or reused without prior permission.

---

<p align="center">
Built with React, TypeScript, and SCSS.
</p>
