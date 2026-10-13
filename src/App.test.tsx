import fs from 'fs';
import path from 'path';
import { projectsData } from './portfolio/data/projects.data';

describe('portfolio project catalogue', () => {
  test('every project has a unique slug and id', () => {
    const slugs = projectsData.map((project) => project.slug);
    const ids = projectsData.map((project) => project.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every project has the minimum information needed for its detail page', () => {
    projectsData.forEach((project) => {
      expect(project.title.trim()).not.toBe('');
      expect(project.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(project.description.trim()).not.toBe('');
      expect(project.tech.length).toBeGreaterThan(0);
      expect(project.features.length).toBeGreaterThan(0);
    });
  });

  test('every project slug is present in the checked-in sitemap', () => {
    const sitemap = fs.readFileSync(path.join(process.cwd(), 'public/sitemap.xml'), 'utf8');
    projectsData.forEach((project) => expect(sitemap).toContain(`/projects/${project.slug}`));
  });

  test('projects without public repositories are represented by an empty link, not a fake URL', () => {
    projectsData
      .filter((project) => !project.link)
      .forEach((project) => {
        expect(project.link).toBe('');
      });
  });
});
