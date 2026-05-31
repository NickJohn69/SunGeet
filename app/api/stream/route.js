import { Innertube } from 'youtubei.js';
import { NextResponse } from 'next/server';

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
    return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
  }

  try {
    const youtube = await getYT();
    const info = await youtube.getBasicInfo(id);
    
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    if (!format || !format.decipher_url) {
      throw new Error('No audio format found');
    }

    // Proxy the audio stream to avoid CORS issues with <audio> element
    const streamRes = await fetch(format.decipher_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!streamRes.ok) throw new Error(`Stream responded with ${streamRes.status}`);

    const contentType = streamRes.headers.get('Content-Type') || 'audio/webm';

    return new Response(streamRes.body, {
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error("Stream error:", error.message);
    return NextResponse.json({ 
      error: 'Failed to stream', 
      details: error.message 
    }, { status: 500 });
  }
}
