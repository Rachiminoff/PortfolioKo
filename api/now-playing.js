exports.handler = async function () {
  const username = process.env.LASTFM_USERNAME;
  const apiKey = process.env.LASTFM_API_KEY;
  if (!username || !apiKey) return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ configured:false }) };
  try {
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.search = new URLSearchParams({method:'user.getrecenttracks',user:username,api_key:apiKey,format:'json',limit:'1'});
    const response = await fetch(url);
    const data = await response.json();
    const track = data?.recenttracks?.track?.[0];
    if (!track) return { statusCode:200, headers:{'Content-Type':'application/json'}, body:JSON.stringify({playing:false}) };
    return { statusCode:200, headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=30'}, body:JSON.stringify({playing:track['@attr']?.nowplaying === 'true', title:track.name, artist:track.artist?.['#text'] || track.artist, album:track.album?.['#text'] || '', image:track.image?.find(i=>i.size==='extralarge')?.['#text'] || '', url:track.url || ''}) };
  } catch { return { statusCode:502, body:JSON.stringify({error:'Unable to reach Last.fm'})}; }
};
