export const runtime = 'nodejs';

const DEEZER_API = 'https://api.deezer.com';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (!id) {
    return new Response(JSON.stringify({ error: 'Track ID required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch track info from Deezer to get the preview URL
    const trackRes = await fetch(`${DEEZER_API}/track/${id}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!trackRes.ok) throw new Error(`Deezer API responded with ${trackRes.status}`);
    
    const track = await trackRes.json();

    if (!track.preview) {
      throw new Error('No preview URL available for this track');
    }

    // Proxy the Deezer preview MP3 to avoid CORS issues
    const audioRes = await fetch(track.preview, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!audioRes.ok) throw new Error(`Deezer preview stream responded with ${audioRes.status}`);

    // Stream the audio back to the client
    return new Response(audioRes.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioRes.headers.get('Content-Length') || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error("Stream error:", error.message);
    return new Response(JSON.stringify({ error: 'Failed to stream', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
