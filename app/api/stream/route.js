import ytdl from '@distube/ytdl-core';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

  const url = `https://www.youtube.com/watch?v=${id}`;
  const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
  
  try {
    // Get info first to find a good audio format
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent': userAgent,
          'Cookie': '' // Optional: Add cookie support here if needed for restricted videos
        }
      }
    });

    // Pick best audio format
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    if (!format || !format.url) throw new Error("No audio format found");
    const streamUrl = format.url;

    // Proxy the stream with proper Range header support for scrubbing
    const fetchHeaders = new Headers();
    fetchHeaders.set('User-Agent', userAgent);
    fetchHeaders.set('Referer', 'https://www.youtube.com/');
    
    const range = request.headers.get('range');
    if (range) fetchHeaders.set('Range', range);

    const response = await fetch(streamUrl, {
      headers: fetchHeaders
    });

    if (!response.ok) {
      throw new Error(`YouTube stream responded with ${response.status}`);
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    // Ensure accurate Content-Type for browser playback
    const mimeType = format.mimeType?.split(';')[0] || 'audio/mp4';
    responseHeaders.set('Content-Type', mimeType);
    responseHeaders.delete('content-encoding');
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Stream errorDetails:", error);
    return NextResponse.json({ 
      error: 'Failed to stream', 
      details: error.message 
    }, { status: 500 });
  }
}
