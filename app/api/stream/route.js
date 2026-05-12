import { create } from 'youtube-dl-exec';
import { NextResponse } from 'next/server';
import path from 'path';

// Fix Next.js ENOENT issue by resolving absolute path to yt-dlp binary
const binaryPath = path.resolve(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
const youtubedl = create(binaryPath);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

  const url = `https://www.youtube.com/watch?v=${id}`;
  const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
  
  try {
    const output = await youtubedl(url, {
      dumpJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio', // Force M4A for universal browser support
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/'
    });

    if (!output.url) throw new Error("No audio URL found in yt-dlp output");
    const streamUrl = output.url;

    // Proxy the stream to completely hide the user's localhost origin and bypass CORS
    // while perfectly forwarding Range headers to allow music scrubbing/skipping!
    const fetchHeaders = new Headers();
    fetchHeaders.set('User-Agent', userAgent);
    fetchHeaders.set('Referer', 'https://www.youtube.com/');
    
    const range = request.headers.get('range');
    if (range) {
      fetchHeaders.set('Range', range);
    }

    const response = await fetch(streamUrl, {
      headers: fetchHeaders
    });

    if (!response.ok) {
      throw new Error(`YouTube responded with ${response.status}`);
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Content-Type', 'audio/mp4'); // strictly enforce mp4
    responseHeaders.delete('content-encoding');
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Stream error:", error);
    return NextResponse.json({ error: 'Failed to stream' }, { status: 500 });
  }
}
