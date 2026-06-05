import { NextResponse } from 'next/server';

const DEEZER_API = 'https://api.deezer.com';

/**
 * Format duration seconds into mm:ss string
 */
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type') || 'track';

  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    // ── Artist Search ──────────────────────────────────────────
    if (type === 'artist') {
      const res = await fetch(
        `${DEEZER_API}/search/artist?q=${encodeURIComponent(q)}&limit=20`,
        { signal: AbortSignal.timeout(8000) }
      );
      
      if (!res.ok) throw new Error(`Deezer API responded with ${res.status}`);
      const data = await res.json();

      const artists = (data.data || []).map(artist => ({
        id: artist.id,
        name: artist.name,
        thumbnail: artist.picture_big || artist.picture_medium || artist.picture_xl || '',
        subscribers: artist.nb_fan
          ? `${(artist.nb_fan / 1000000).toFixed(1)}M fans`
          : 'Artist',
        tracklist: artist.tracklist || '',
        deezerLink: artist.link || '',
      }));

      return NextResponse.json(artists);
    }

    // ── Default Track/Song Search ──────────────────────────────
    const res = await fetch(
      `${DEEZER_API}/search?q=${encodeURIComponent(q)}&limit=30`,
      { signal: AbortSignal.timeout(8000) }
    );
    
    if (!res.ok) throw new Error(`Deezer API responded with ${res.status}`);
    const data = await res.json();

    const tracks = (data.data || [])
      .filter(t => t.preview) // Only include tracks that have a preview URL
      .map(track => ({
        id: String(track.id),
        title: track.title_short || track.title || 'Unknown Title',
        thumbnail: track.album?.cover_big || track.album?.cover_medium || track.album?.cover_xl || '',
        duration: formatDuration(track.duration),
        durationSeconds: track.duration || 0,
        author: track.artist?.name || 'Unknown Artist',
        // Deezer-specific fields
        previewUrl: track.preview, // 30-second MP3 preview URL
        album: track.album?.title || '',
        artistId: track.artist?.id || null,
        artistPicture: track.artist?.picture_big || track.artist?.picture_medium || '',
        albumCover: track.album?.cover_xl || track.album?.cover_big || '',
        deezerLink: track.link || '',
      }));

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Deezer search error:", error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
