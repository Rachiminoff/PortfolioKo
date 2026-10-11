import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cover-sync-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const expectedSecret = Deno.env.get("COVER_SYNC_SECRET");
  if (!expectedSecret || request.headers.get("x-cover-sync-secret") !== expectedSecret) {
    return json({ error: "Unauthorized cover sync request." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const clientId = Deno.env.get("TWITCH_CLIENT_ID");
  const clientSecret = Deno.env.get("TWITCH_CLIENT_SECRET");
  if (!supabaseUrl || !serviceRoleKey || !clientId || !clientSecret) {
    return json({ error: "Missing Supabase or Twitch/IGDB server secrets." }, 500);
  }

  let requestedLimit = 50;
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.limit != null) requestedLimit = Number(body.limit);
  } catch { /* Use default batch size. */ }
  const limit = Math.min(50, Math.max(1, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 50));

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: games, error: selectError } = await supabase
    .from("game_masterlist")
    .select("igdb_id,game_name")
    .is("cover_url", null)
    .is("cover_checked_at", null)
    .order("igdb_id", { ascending: true })
    .limit(limit);

  if (selectError) return json({ error: selectError.message }, 500);
  if (!games?.length) return json({ processed: 0, updated: 0, message: "No unchecked games are waiting for cover lookup." });

  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  if (!tokenResponse.ok) return json({ error: `Twitch token request failed (${tokenResponse.status}).` }, 502);
  const tokenPayload = await tokenResponse.json();

  const ids = games.map((game) => Number(game.igdb_id)).filter((id) => Number.isSafeInteger(id) && id > 0);
  if (!ids.length) return json({ error: "No valid IGDB IDs found in the pending batch." }, 400);

  const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${tokenPayload.access_token}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
    body: `fields id,name,cover.image_id; where id = (${ids.join(",")}); limit ${ids.length};`,
  });
  if (!igdbResponse.ok) return json({ error: `IGDB cover lookup failed (${igdbResponse.status}).` }, 502);
  const igdbGames = await igdbResponse.json();
  const imageById = new Map<number, string>();
  for (const game of igdbGames as Array<{ id: number; cover?: { image_id?: string } }>) {
    if (game.cover?.image_id) {
      imageById.set(Number(game.id), `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`);
    }
  }

  const checkedAt = new Date().toISOString();
  let updated = 0;
  const errors: string[] = [];
  for (const game of games) {
    const update = await supabase
      .from("game_masterlist")
      .update({ cover_url: imageById.get(Number(game.igdb_id)) ?? null, cover_checked_at: checkedAt })
      .eq("igdb_id", game.igdb_id);
    if (update.error) errors.push(`${game.igdb_id}: ${update.error.message}`);
    else updated += 1;
  }

  return json({ processed: games.length, updated, coversFound: games.filter((game) => imageById.has(Number(game.igdb_id))).length, errors });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
