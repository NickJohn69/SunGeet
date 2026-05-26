import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Use YouTube's own InnerTube player API — no library needed, works on Vercel
const INNERTUBE_PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

  try {
    // 1. Request video info using Android client
    const playerRes = await fetch(INNERTUBE_PLAYER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '19.09.37',
            androidSdkVersion: 30,
            hl: 'en',
            gl: 'US',
          }
        },
        videoId: id,
        playbackContext: {
          contentCheckOk: true,
          racyCheckOk: true,
        },
      }),
    });

    if (!playerRes.ok) throw new Error(`InnerTube player responded with ${playerRes.status}`);

    const data = await playerRes.json();

    if (data.playabilityStatus?.status !== 'OK') {
      const reason = data.playabilityStatus?.reason || 'Video not available';
      throw new Error(reason);
    }

    const formats = data.streamingData?.adaptiveFormats || [];

    // 2. Find best audio format — prefer m4a (audio/mp4)
    const audioFormats = formats
      .filter(f => f.mimeType?.startsWith('audio/'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    const format =
      audioFormats.find(f => f.mimeType?.includes('mp4')) ||
      audioFormats[0];

    if (!format?.url) throw new Error('No audio stream URL found');

    // 3. Proxy the stream to bypass IP-locking
    // We forward the Range header if present to support scrubbing
    const range = request.headers.get('range');
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0',
    };
    if (range) {
      fetchHeaders['Range'] = range;
    }

    const streamRes = await fetch(format.url, {
      headers: fetchHeaders,
    });

    if (!streamRes.ok && streamRes.status !== 206) {
      throw new Error(`YouTube stream responded with ${streamRes.status}`);
    }

    // Forward the response as a stream
    return new Response(streamRes.body, {
      status: streamRes.status,
      headers: {
        'Content-Type': streamRes.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': streamRes.headers.get('Content-Length'),
        'Content-Range': streamRes.headers.get('Content-Range'),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('[stream] Error:', error.message);
    return NextResponse.json({
      error: 'Failed to get stream',
      details: error.message
    }, { status: 500 });
  }
}
