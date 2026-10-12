#!/usr/bin/env node
/**
 * Post-build SEO step (runs automatically after `npm run build`).
 *
 *  - writes build/sitemap.xml from the real, indexable routes (home + every project)
 *  - writes build/robots.txt, keeping private/gated pages and /api out of crawling
 *  - writes build/projects/<slug>/index.html with that project's own title, description,
 *    canonical, Open Graph and JSON-LD, so link-preview crawlers (which do not run
 *    JavaScript) and search engines see correct tags for each project page.
 *
 * Route metadata comes from src/seo/seoConfig.ts, the same module the app uses at runtime.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build');

// ---- minimal TS loader (stubs assets so data files that import images can be evaluated) ----
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
  });
  const mod = { exports: {} };
  cache.set(file, mod);
  const localRequire = (request) => {
    if (!request.startsWith('.')) return require(request);
    const target = path.resolve(path.dirname(file), request);
    if (/\.(jpe?g|png|gif|svg|webp|avif|mp4|webm|css|scss)$/i.test(target)) return '';
    for (const candidate of [target + '.ts', target + '.tsx', path.join(target, 'index.ts')]) {
      if (fs.existsSync(candidate)) return load(candidate);
    }
    throw new Error(`Cannot resolve ${request} from ${file}`);
  };
  vm.runInNewContext(`(function (exports, require, module, process) {${outputText}\n})`, {
    console,
  })(mod.exports, localRequire, mod, process);
  return mod.exports;
}

const config = load(path.join(root, 'src/seo/seoConfig.ts'));
const data = load(path.join(root, 'src/portfolio/data/projects.data.ts'));
const { SITE_URL, PRIVATE_PATHS, getRouteSeo } = config;

if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
  console.error('generate-seo: build/index.html not found. Run the build first.');
  process.exit(1);
}
const template = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function setTag(html, pattern, tag) {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}</head>`);
}
const metaPattern = (attr, key) =>
  new RegExp(
    `<meta\\s+${attr}=["']?${key.replace(/[:.]/g, '\\$&')}["']?\\s+content=("[^"]*"|'[^']*'|[^\\s>]+)\\s*/?>`,
    'i',
  );

function applySeo(html, seo) {
  const url = `${SITE_URL}${seo.path === '/' ? '/' : seo.path}`;
  const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${esc(value)}"/>`;
  html = setTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${esc(seo.title)}</title>`);
  html = setTag(html, metaPattern('name', 'title'), meta('name', 'title', seo.title));
  html = setTag(
    html,
    metaPattern('name', 'description'),
    meta('name', 'description', seo.description),
  );
  html = setTag(
    html,
    metaPattern('name', 'robots'),
    meta(
      'name',
      'robots',
      seo.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
    ),
  );
  html = setTag(
    html,
    /<link\s+rel=["']?canonical["']?\s+href=("[^"]*"|'[^']*'|[^\s>]+)\s*\/?>/i,
    `<link rel="canonical" href="${esc(url)}"/>`,
  );
  const pairs = [
    ['property', 'og:type', seo.type],
    ['property', 'og:title', seo.title],
    ['property', 'og:description', seo.description],
    ['property', 'og:url', url],
    ['property', 'og:image', seo.image],
    ['name', 'twitter:title', seo.title],
    ['name', 'twitter:description', seo.description],
    ['name', 'twitter:image', seo.image],
  ];
  pairs.forEach(([attr, key, value]) => {
    html = setTag(html, metaPattern(attr, key), meta(attr, key, value));
  });
  if (seo.jsonLd) {
    const json = JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c');
    html = html.replace('</head>', `<script type="application/ld+json">${json}</script></head>`);
  }
  return html;
}

// ---- per-project static pages ----
const slugs = data.projectsData.map((project) => project.slug);
slugs.forEach((slug) => {
  const seo = getRouteSeo(`/projects/${slug}`);
  const dir = path.join(buildDir, 'projects', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), applySeo(template, seo));
});

// ---- sitemap ----
const urls = ['/', ...slugs.map((slug) => `/projects/${slug}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u === '/' ? '/' : u}</loc></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), sitemap);

// ---- robots ----
const robots = `User-agent: *
Allow: /
${[...PRIVATE_PATHS, '/api/'].map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${SITE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(buildDir, 'robots.txt'), robots);

console.log(
  `generate-seo: ${slugs.length} project pages, sitemap (${urls.length} URLs) and robots.txt written.`,
);
