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
    
    // Prefer audio-only formats, sorted by bitrate (best first)
    const formats = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    let format = formats;
    
    // If chooseFormat returned a single format, use it
    // Otherwise find the best one
    if (!format || !format.decipher_url) {
      throw new Error('No audio format found');
    }

    // Redirect to the actual audio stream URL
    // The <audio> element will follow the redirect and play the stream
    return Response.redirect(format.decipher_url, 307);
  } catch (error) {
    console.error("Stream error:", error.message);
    return NextResponse.json({ 
      error: 'Failed to stream', 
      details: error.message 
    }, { status: 500 });
  }
}
