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
  const rangeHeader = request.headers.get('range');

  if (!id) {
    return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
  }

  try {
    const youtube = await getYT();
    const info = await youtube.getBasicInfo(id);
    
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    
    if (!format || !format.url) {
      throw new Error('No audio format found');
    }

    // Proxy the stream, forwarding Range headers for seek support
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

    const contentType = streamRes.headers.get('Content-Type') || 'audio/webm';
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
      responseHeaders['Content-Range'] = streamRes.headers.get('Content-Range');
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
    return NextResponse.json({ 
      error: 'Failed to stream', 
      details: error.message 
    }, { status: 500 });
  }
}
