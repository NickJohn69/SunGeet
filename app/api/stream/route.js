import { Innertube } from 'youtubei.js';

export const dynamic = 'force-dynamic';

let yt;

async function getYT() {
  if (!yt) {
    yt = await Innertube.create();
  }
  return yt;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (!id) {
    return new Response(JSON.stringify({ error: 'Video ID required' }), { status: 400 });
  }

  try {
    const youtube = await getYT();

    // getStreamingData deciphers the URL and returns a playable Format
    const format = await youtube.getStreamingData(id, { type: 'audio', quality: 'best' });

    if (!format || !format.url) {
      throw new Error('No audio format found');
    }

    // Redirect to the actual audio stream URL
    // The <audio> element will follow the redirect and play the stream directly
    return Response.redirect(format.url, 307);
  } catch (error) {
    console.error("Stream error:", error.message);
    return new Response(JSON.stringify({ error: 'Failed to stream', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
