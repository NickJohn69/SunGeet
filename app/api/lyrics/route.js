import { NextResponse } from 'next/server';

const LRCLIB_HEADERS = {
  'User-Agent': 'SunGeet Music Player v1.0.0 (https://github.com/sungeet)',
};

/**
 * Clean YouTube title noise in one pass with a single combined regex.
 */
function cleanTitle(raw) {
  return raw
    .replace(/\((?:Official|Lyric|Music)\s*(?:Video|Audio|MV)?\)/gi, '')
    .replace(/\[(?:Official|Lyric|Music)\s*(?:Video|Audio|MV)?\]/gi, '')
    .replace(/\((?:Lyrics?|Audio|Visualizer|HD|HQ|4K|Remix|Live)\)/gi, '')
    .replace(/\[(?:Lyrics?|Audio|Visualizer|HD|HQ|4K|Remix|Live)\]/gi, '')
    .replace(/\((?:feat|ft|prod|with|from)\.?\s*[^)]*\)/gi, '')
    .replace(/\[(?:feat|ft|prod|with|from)\.?\s*[^]]*\]/gi, '')
    .replace(/Official\s*(?:Music\s*)?(?:Video|Audio)/gi, '')
    .replace(/(?:Lyric|Music)\s*Video/gi, '')
    .replace(/\|.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract artist and track from "Artist - Track" format.
 */
function splitArtistTrack(title, channelName) {
  let artist = channelName || '';
  let track = title;

  const sep = title.match(/\s[-–—:]\s/);
  if (sep) {
    const idx = sep.index;
    const left = title.slice(0, idx).trim();
    const right = title.slice(idx + sep[0].length).trim();
    if (!artist || artist === 'Unknown Artist' || /vevo|topic|lyrics/i.test(artist)) {
      artist = left;
    }
    track = right;
  }

  return { artist, track };
}

/**
 * Pick the best result from a lrclib search response.
 * Prefers synced lyrics, then closest duration match.
 */
function pickBest(results, duration) {
  if (!Array.isArray(results) || results.length === 0) return null;

  const withSynced = results.filter(r => r.syncedLyrics);
  const pool = withSynced.length > 0 ? withSynced : results;

  if (duration > 0) {
    pool.sort((a, b) => Math.abs((a.duration || 0) - duration) - Math.abs((b.duration || 0) - duration));
  }

  const best = pool[0];
  return (best && (best.syncedLyrics || best.plainLyrics)) ? best : null;
}

/**
 * Format a successful response.
 */
function successResponse(result, source) {
  return NextResponse.json({
    lyrics: result.plainLyrics || result.syncedLyrics || 'Lyrics not found.',
    syncedLyrics: result.syncedLyrics || null,
    source,
    matchedArtist: result.artistName,
    matchedTrack: result.trackName,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get('title') || '';
  const rawArtist = searchParams.get('artist') || '';
  const duration = parseFloat(searchParams.get('duration') || '0');

  const cleaned = cleanTitle(rawTitle);
  const { artist, track } = splitArtistTrack(cleaned, rawArtist);

  console.log(`[Lyrics] artist="${artist}", track="${track}", dur=${duration}`);

  // --- FAST PATH: Run search + get in PARALLEL ---
  // /api/search is fast and fuzzy; /api/get is exact but can be slow.
  // We race them so the fastest result wins.

  const searchQuery = artist ? `${artist} ${track}` : track;
  const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;

  const getParams = new URLSearchParams({ artist_name: artist, track_name: track });
  if (duration > 0) getParams.set('duration', Math.round(duration).toString());
  const getUrl = `https://lrclib.net/api/get?${getParams}`;

  try {
    // Fire both requests simultaneously with a 4s timeout
    const [searchRes, getRes] = await Promise.allSettled([
      fetch(searchUrl, { headers: LRCLIB_HEADERS, signal: AbortSignal.timeout(8000) }),
      fetch(getUrl, { headers: LRCLIB_HEADERS, signal: AbortSignal.timeout(8000) }),
    ]);

    // Check /api/get first (more accurate if it succeeds)
    if (getRes.status === 'fulfilled' && getRes.value.ok) {
      const data = await getRes.value.json();
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        console.log('[Lyrics] ✓ Found via /api/get');
        return successResponse(data, 'lrclib');
      }
    }

    // Then check /api/search
    if (searchRes.status === 'fulfilled' && searchRes.value.ok) {
      const results = await searchRes.value.json();
      const best = pickBest(results, duration);
      if (best) {
        console.log('[Lyrics] ✓ Found via /api/search');
        return successResponse(best, 'lrclib-search');
      }
    }
  } catch (e) {
    console.error('[Lyrics] Parallel fetch error:', e.message);
  }

  // --- FALLBACK: search with just the track name (no artist) ---
  if (artist && track !== searchQuery) {
    try {
      const res = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(track)}`,
        { headers: LRCLIB_HEADERS, signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const best = pickBest(await res.json(), duration);
        if (best) {
          console.log('[Lyrics] ✓ Found via /api/search (track-only)');
          return successResponse(best, 'lrclib-search');
        }
      }
    } catch (e) {
      console.error('[Lyrics] Track-only search error:', e.message);
    }
  }

  console.log('[Lyrics] ✗ No lyrics found');
  return NextResponse.json({
    lyrics: 'Lyrics not found for this track.',
    syncedLyrics: null,
    source: null,
  });
}
