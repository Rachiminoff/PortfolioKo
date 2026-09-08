import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('site_stats')
        .select('unique_visitors,total_visits,updated_at')
        .eq('id', 'main')
        .single();
      if (error) throw error;
      return res.status(200).json({
        data: { visitors: Number(data.unique_visitors || 0), visits: Number(data.total_visits || 0), updatedAt: data.updated_at }
      });
    } catch (error) {
      console.error('Site stats read error:', error);
      return res.status(500).json({ error: 'Unable to read site stats.' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.REACT_APP_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Site stats are not configured.' });
  }

  const visitorId = typeof req.body?.visitorId === 'string' ? req.body.visitorId.trim() : '';
  if (visitorId.length < 8 || visitorId.length > 120) {
    return res.status(400).json({ error: 'Invalid visitor id.' });
  }

  try {
    const { data, error } = await supabase.rpc('record_site_visit', {
      p_visitor_id: visitorId,
    });
    if (error) throw error;
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Site stats API error:', error);
    return res.status(500).json({ error: 'Unable to record site visit.' });
  }
}
