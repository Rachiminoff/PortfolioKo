import { createClient } from '@supabase/supabase-js';
import { isBlogAdmin } from './auth.js';
import { isSameOrigin, setSecurityHeaders } from '../_security.js';

let client;
function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client ||= createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}

const MAX_CONTENT = 200_000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_URL = /^(https:\/\/|\/)[^\s"'<>]*$/i;

const text = (max) => (value) =>
  typeof value === 'string' && value.length <= max ? value : undefined;
const url = (value) =>
  value === '' || (typeof value === 'string' && value.length <= 2048 && SAFE_URL.test(value))
    ? value
    : undefined;

const validators = {
  title: text(300),
  slug: (value) =>
    typeof value === 'string' && value.length <= 200 && SLUG.test(value) ? value : undefined,
  excerpt: text(1000),
  content: text(MAX_CONTENT),
  thumbnail: url,
  cover_image: url,
  category: text(100),
  tags: (value) =>
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every((tag) => typeof tag === 'string' && tag.length <= 50)
      ? value
      : undefined,
  reading_time: text(50),
  published: (value) => (typeof value === 'boolean' ? value : undefined),
  featured: (value) => (typeof value === 'boolean' ? value : undefined),
  display_order: (value) => {
    const n = Number(value);
    return Number.isInteger(n) && Math.abs(n) <= 1_000_000 ? n : undefined;
  },
};

/** Allow-list + validate each field. Returns { payload } or { error }. */
function sanitize(body) {
  const payload = {};
  for (const [field, validate] of Object.entries(validators)) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = validate(body[field]);
    if (value === undefined) return { error: `Invalid value for "${field}".` };
    payload[field] = value;
  }
  return { payload };
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (!isBlogAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('Blog API: SUPABASE_SERVICE_ROLE_KEY / Supabase URL is not configured');
    return res.status(503).json({ error: 'Blog storage is not configured.' });
  }

  if (req.method !== 'GET' && !isSameOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('display_order', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ data });
    }

    if (req.method === 'POST') {
      const { payload, error: invalid } = sanitize(req.body || {});
      if (invalid) return res.status(400).json({ error: invalid });
      if (!payload.title || !payload.slug || !payload.content) {
        return res.status(400).json({ error: 'Title, slug, and content are required.' });
      }
      const { data, error } = await supabase.from('blog_posts').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json({ data });
    }

    if (req.method === 'PATCH') {
      const id = Number(new URL(req.url, 'http://localhost').searchParams.get('id'));
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'A valid post id is required.' });
      }
      const { payload, error: invalid } = sanitize(req.body || {});
      if (invalid) return res.status(400).json({ error: invalid });
      payload.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('blog_posts')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ data });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    // Log details server-side only; never echo database error text to the client.
    console.error('Blog API error:', error?.code, error?.message);
    return res.status(500).json({ error: 'Database operation failed.' });
  }
}
