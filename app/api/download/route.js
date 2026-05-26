import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Use YouTube's own InnerTube player API — same approach as stream
const INNERTUBE_PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();
  const title = searchParams.get('title') || id;

  if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

  try {
    // 1. Request video info using TVHTML5 client
    const playerRes = await fetch(INNERTUBE_PLAYER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'TVHTML5',
            clientVersion: '7.20230405.08.01',
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

    if (!playerRes.ok) throw new Error(`InnerTube responded with ${playerRes.status}`);

    const data = await playerRes.json();

    if (data.playabilityStatus?.status !== 'OK') {
      throw new Error(data.playabilityStatus?.reason || 'Video not available');
    }

    const formats = data.streamingData?.adaptiveFormats || [];

    // 2. Find best audio format
    const audioFormats = formats
      .filter(f => f.mimeType?.startsWith('audio/'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    const format =
      audioFormats.find(f => f.mimeType?.includes('mp4')) ||
      audioFormats[0];

    if (!format?.url) throw new Error('No audio stream URL found');

    // 3. Proxy the stream for download
    const streamRes = await fetch(format.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!streamRes.ok) throw new Error(`YouTube stream responded with ${streamRes.status}`);

    return new Response(streamRes.body, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.m4a"`,
        'Content-Length': streamRes.headers.get('Content-Length'),
      }
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ 
      error: 'Failed to download',
      details: error.message 
    }, { status: 500 });
  }
}
