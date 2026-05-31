export const runtime = 'nodejs';

const INNERTUBE_PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (!id) {
    return new Response(JSON.stringify({ error: 'Video ID required' }), { status: 400 });
  }

  try {
    // Request video info using TVHTML5 client (returns direct URLs, no deciphering needed)
    const playerRes = await fetch(INNERTUBE_PLAYER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    // Find best audio format, preferring MP4/AAC for maximum compatibility
    const audioFormats = formats
      .filter(f => f.mimeType?.startsWith('audio/'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    const format =
      audioFormats.find(f => f.mimeType?.includes('mp4')) ||
      audioFormats[0];

    if (!format?.url) throw new Error('No audio stream URL found');

    // Proxy the stream, forwarding Range headers for seek support
    const rangeHeader = request.headers.get('range');
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const streamRes = await fetch(format.url, { headers: fetchHeaders });

    if (!streamRes.ok && streamRes.status !== 206) {
      throw new Error(`Stream responded with ${streamRes.status}`);
    }

    const contentType = streamRes.headers.get('Content-Type') || 'audio/mp4';
    const contentLength = streamRes.headers.get('Content-Length');

    const responseHeaders = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    if (rangeHeader) {
      const contentRange = streamRes.headers.get('Content-Range');
      if (contentRange) {
        responseHeaders['Content-Range'] = contentRange;
      }
      return new Response(streamRes.body, {
        status: 206,
        headers: responseHeaders,
      });
    }

    return new Response(streamRes.body, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Stream error:", error.message);
    return new Response(JSON.stringify({ error: 'Failed to stream', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
