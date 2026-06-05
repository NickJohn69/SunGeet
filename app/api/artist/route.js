import { NextResponse } from 'next/server';

const DEEZER_API = 'https://api.deezer.com';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
  }

  try {
    // Fetch artist info and top tracks in parallel
    const [artistRes, topTracksRes] = await Promise.all([
      fetch(`${DEEZER_API}/artist/${id}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${DEEZER_API}/artist/${id}/top?limit=50`, { signal: AbortSignal.timeout(8000) }),
    ]);

    if (!artistRes.ok) throw new Error(`Deezer artist API responded with ${artistRes.status}`);

    const artist = await artistRes.json();
    const topTracks = topTracksRes.ok ? await topTracksRes.json() : { data: [] };

    const tracks = (topTracks.data || [])
      .filter(t => t.preview)
      .map(track => ({
        id: String(track.id),
        title: track.title_short || track.title || 'Unknown Title',
        thumbnail: track.album?.cover_big || track.album?.cover_medium || '',
        duration: formatDuration(track.duration),
        durationSeconds: track.duration || 0,
        author: track.artist?.name || artist.name || 'Unknown Artist',
        previewUrl: track.preview,
        album: track.album?.title || '',
        artistId: track.artist?.id || artist.id,
        artistPicture: track.artist?.picture_big || artist.picture_big || '',
        albumCover: track.album?.cover_xl || track.album?.cover_big || '',
      }));

    return NextResponse.json({
      artist: {
        id: artist.id,
        name: artist.name,
        thumbnail: artist.picture_xl || artist.picture_big || artist.picture_medium || '',
        fans: artist.nb_fan || 0,
        albums: artist.nb_album || 0,
        link: artist.link || '',
      },
      tracks,
    });
  } catch (error) {
    console.error("Artist details error:", error);
    return NextResponse.json({ error: 'Failed to fetch artist details' }, { status: 500 });
  }
}
