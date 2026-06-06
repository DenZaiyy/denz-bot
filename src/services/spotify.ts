// Resolves Spotify track URLs to a YouTube search query via OG tag scraping.
// No API credentials required — Spotify server-side renders meta tags for all track pages.

export function isSpotifyUrl(input: string): boolean {
  return /open\.spotify\.com\/(intl-[a-z]+\/)?track\//i.test(input);
}

export async function resolveSpotifyTrack(url: string): Promise<{
  query: string;
  thumbnail?: string;
}> {
  // Strip regional prefix (intl-fr, intl-de, etc.) — canonical URL works without it
  const canonical = url.replace(/\/intl-[a-z]+\//, '/').split('?')[0];

  const res = await fetch(canonical, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
  });
  if (!res.ok) throw new Error(`Spotify page returned ${res.status}`);

  const html = await res.text();
  const title = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
  const desc  = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
  const thumb = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];

  if (!title) throw new Error('Could not extract Spotify track metadata');

  // og:description format: "Artist · Album · Song · Year" — artist is always first
  const artist = desc?.split(' · ')[0]?.trim();
  const query = artist ? `${title} ${artist}` : title;

  return { query, thumbnail: thumb };
}
