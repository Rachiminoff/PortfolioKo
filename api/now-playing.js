import { getVaultSessionToken, isValidVaultSessionToken } from './vault/session.js';

export default async function handler(req, res) {
  // Only the (private) Persona page uses this; don't expose live listening activity publicly.
  if (!isValidVaultSessionToken(getVaultSessionToken(req))) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const username = process.env.LASTFM_USERNAME;
  const apiKey = process.env.LASTFM_API_KEY;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private, no-store');

  if (!username || !apiKey) {
    return res.status(200).json({ configured: false });
  }

  try {
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.search = new URLSearchParams({
      method: 'user.getrecenttracks',
      user: username,
      api_key: apiKey,
      format: 'json',
      limit: '1',
    });

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Last.fm returned ${response.status}`);

    const data = await response.json();
    if (data.error) return res.status(502).json({ error: data.message || 'Last.fm API error' });

    const track = data?.recenttracks?.track?.[0];
    if (!track) return res.status(200).json({ playing: false });

    return res.status(200).json({
      playing: track['@attr']?.nowplaying === 'true',
      title: track.name,
      artist: track.artist?.['#text'] || track.artist || '',
      album: track.album?.['#text'] || '',
      image: track.image?.find((image) => image.size === 'extralarge')?.['#text'] || '',
      url: track.url || '',
    });
  } catch (error) {
    console.error('Now Playing error:', error);
    return res.status(502).json({ error: 'Unable to reach Last.fm' });
  }
}
