import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEEZER_API = 'https://api.deezer.com';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();
  const title = searchParams.get('title') || id;

  if (!id) return NextResponse.json({ error: 'Track ID required' }, { status: 400 });

  try {
    // Fetch track info from Deezer
    const trackRes = await fetch(`${DEEZER_API}/track/${id}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!trackRes.ok) throw new Error(`Deezer API responded with ${trackRes.status}`);

    const track = await trackRes.json();

    if (!track.preview) {
      throw new Error('No preview URL available for this track');
    }

    // Proxy the Deezer preview for download
    const streamRes = await fetch(track.preview, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!streamRes.ok) throw new Error(`Deezer preview responded with ${streamRes.status}`);

    return new Response(streamRes.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.mp3"`,
        'Content-Length': streamRes.headers.get('Content-Length') || '',
      },
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({
      error: 'Failed to download',
      details: error.message,
    }, { status: 500 });
  }
}
