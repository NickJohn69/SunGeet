
import { Innertube, UniversalCache } from 'youtubei.js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

let yt = null;
async function getYT() {
  if (!yt) {
    yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_store: true
    });
  }
  return yt;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();
  const title = searchParams.get('title') || id;

  if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

  try {
    const youtube = await getYT();
    const info = await youtube.getInfo(id);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });

    if (!format || !format.url) {
      throw new Error('No playable audio format found');
    }

    const streamRes = await fetch(format.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!streamRes.ok) throw new Error(`YouTube stream responded with ${streamRes.status}`);

    const mimeType = format.mime_type?.split(';')[0] || 'audio/mp4';
    const ext = mimeType.includes('mpeg') ? 'mp3' : 
                mimeType.includes('webm') ? 'webm' : 'm4a';

    return new Response(streamRes.body, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.${ext}"`,
        'Content-Length': streamRes.headers.get('Content-Length') || '',
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
