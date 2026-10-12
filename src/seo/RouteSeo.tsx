import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_NAME, SITE_URL, getRouteSeo } from './seoConfig';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
}

const JSON_LD_ID = 'route-jsonld';

/**
 * Keeps <title>, description, canonical, robots and social tags in sync with the current route.
 * Renders nothing. (Static per-project HTML is also generated at build time by scripts/generate-seo.js
 * so link-preview crawlers that do not run JavaScript still see the right tags.)
 */
const RouteSeo: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getRouteSeo(pathname);
    const url = `${SITE_URL}${seo.path === '/' ? '/' : seo.path}`;

    document.title = seo.title;
    setMeta('name', 'description', seo.description);
    setMeta('name', 'title', seo.title);
    setMeta(
      'name',
      'robots',
      seo.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
    );
    setCanonical(url);

    setMeta('property', 'og:type', seo.type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:description', seo.description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', seo.image);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', seo.title);
    setMeta('name', 'twitter:description', seo.description);
    setMeta('name', 'twitter:image', seo.image);

    document.getElementById(JSON_LD_ID)?.remove();
    if (seo.jsonLd) {
      const script = document.createElement('script');
      script.id = JSON_LD_ID;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(seo.jsonLd);
      document.head.appendChild(script);
    }
  }, [pathname]);

  return null;
};

export default RouteSeo;
