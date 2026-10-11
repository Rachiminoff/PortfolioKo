import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-poster-sync-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type MovieRow = { id: string; title: string; release_year: number | null };
type TMDBResult = { title?: string; release_date?: string; poster_path?: string | null; popularity?: number };

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const expectedSecret = Deno.env.get("POSTER_SYNC_SECRET");
  if (!expectedSecret || request.headers.get("x-poster-sync-secret") !== expectedSecret) {
    return json({ error: "Unauthorized poster sync request." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const tmdbToken = Deno.env.get("TMDB_API_READ_ACCESS_TOKEN");
  if (!supabaseUrl || !serviceRoleKey || !tmdbToken) {
    return json({ error: "Missing Supabase or TMDB server secrets." }, 500);
  }

  const body = await request.json().catch(() => ({}));
  const requestedLimit = Number(body?.limit ?? 20);
  const limit = Math.min(20, Math.max(1, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 20));
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: movies, error: selectError } = await supabase
    .from("movie_masterlist")
    .select("id,title,release_year")
    .is("poster_url", null)
    .is("poster_checked_at", null)
    .order("title", { ascending: true })
    .limit(limit);
  if (selectError) return json({ error: selectError.message }, 500);
  if (!movies?.length) return json({ processed: 0, updated: 0, postersFound: 0, message: "No unchecked movies are waiting for posters." });

  let updated = 0;
  let postersFound = 0;
  const errors: string[] = [];
  const checkedAt = new Date().toISOString();

  for (const movie of movies as MovieRow[]) {
    try {
      const params = new URLSearchParams({ query: movie.title, include_adult: "false", language: "en-US", page: "1" });
      if (movie.release_year) params.set("year", String(movie.release_year));
      const response = await fetch(`https://api.themoviedb.org/3/search/movie?${params.toString()}`, {
        headers: { Authorization: `Bearer ${tmdbToken}`, Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`TMDB returned ${response.status}`);
      const payload = await response.json();
      const results = (payload.results ?? []) as TMDBResult[];
      const normalizedTitle = normalize(movie.title);
      const sorted = results.slice().sort((a, b) => {
        const score = (item: TMDBResult) => {
          const exact = normalize(item.title ?? "") === normalizedTitle ? 1000 : 0;
          const year = movie.release_year && item.release_date?.slice(0, 4) === String(movie.release_year) ? 500 : 0;
          return exact + year + (Number(item.popularity) || 0);
        };
        return score(b) - score(a);
      });
      const match = sorted.find((item) => item.poster_path);
      const posterUrl = match?.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null;
      const { error: updateError } = await supabase.from("movie_masterlist")
        .update({ poster_url: posterUrl, poster_checked_at: checkedAt, updated_at: checkedAt })
        .eq("id", movie.id);
      if (updateError) throw new Error(updateError.message);
      updated += 1;
      if (posterUrl) postersFound += 1;
    } catch (error) {
      errors.push(`${movie.title}: ${error instanceof Error ? error.message : String(error)}`);
      // Don't mark temporary failures checked, so they can be retried in a later batch.
    }
  }

  return json({ processed: movies.length, updated, postersFound, errors });
});

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
