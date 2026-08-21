import { createClient } from "@supabase/supabase-js";
import { isBlogAdmin } from "./auth.js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const fields = [
  "title", "slug", "excerpt", "content", "thumbnail", "cover_image",
  "category", "tags", "reading_time", "published", "featured", "display_order"
];

function sanitize(body) {
  const payload = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field];
  }
  if (payload.tags && !Array.isArray(payload.tags)) payload.tags = [];
  if (payload.display_order !== undefined) payload.display_order = Number(payload.display_order) || 0;
  return payload;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!isBlogAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured." });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("display_order", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json({ data });
    }

    if (req.method === "POST") {
      const payload = sanitize(req.body || {});
      if (!payload.title || !payload.slug || !payload.content) {
        return res.status(400).json({ error: "Title, slug, and content are required." });
      }
      const { data, error } = await supabase.from("blog_posts").insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json({ data });
    }

    const id = new URL(req.url, `http://${req.headers.host || "localhost"}`).searchParams.get("id");
    if (req.method === "PATCH" && id) {
      const payload = sanitize(req.body || {});
      payload.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", Number(id))
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ data });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Blog API error:", error);
    return res.status(500).json({ error: error?.message || "Database operation failed." });
  }
}
