import { NextResponse } from 'next/server';

const LRCLIB_HEADERS = {
  'User-Agent': 'SunGeet Music Player v1.0.0 (https://github.com/sungeet)',
};

/**
 * Clean title noise (parenthetical tags, suffixes, etc.)
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
function pickBest(results, duration, targetArtist, targetTrack) {
  if (!Array.isArray(results) || results.length === 0) return null;

  // Manual override for specific problematic tracks
  if (targetArtist.toLowerCase().includes('yabesh thapa') && targetTrack.toLowerCase().includes('shital')) {
    const shitalResult = results.find(r => 
      r.artistName.toLowerCase().includes('yabesh thapa') && 
      r.trackName.toLowerCase().includes('shital')
    );
    if (shitalResult) return shitalResult;
  }

  // Filter out results where the artist doesn't match at all if a target artist is provided
  let pool = results;
  if (targetArtist && targetArtist !== 'Unknown Artist') {
    const artistWords = targetArtist.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    pool = results.filter(r => {
      const matchName = r.artistName.toLowerCase();
      // If at least one distinct word from target artist is in the result's artist name
      return artistWords.some(word => matchName.includes(word)) || matchName.includes(targetArtist.toLowerCase());
    });
  }
  
  if (pool.length === 0) pool = results; // Fallback to all if no artist matches

  const withSynced = pool.filter(r => r.syncedLyrics);
  const finalPool = withSynced.length > 0 ? withSynced : pool;

  if (duration > 0) {
    finalPool.sort((a, b) => Math.abs((a.duration || 0) - duration) - Math.abs((b.duration || 0) - duration));
  }

  const best = finalPool[0];
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
      const best = pickBest(results, duration, artist, track);
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
        const best = pickBest(await res.json(), duration, artist, track);
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
