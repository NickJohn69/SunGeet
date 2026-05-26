import { create } from 'youtube-dl-exec';
import { NextResponse } from 'next/server';
import path from 'path';

// Resolve absolute path to yt-dlp binary, handling Windows .exe extension
const binaryPath = path.resolve(
  process.cwd(), 
  'node_modules', 
  'youtube-dl-exec', 
  'bin', 
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);

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
      format: 'bestaudio[ext=m4a]/bestaudio',
      noWarnings: true,
      noCheckCertificate: true,
      referer: 'https://www.youtube.com/',
      userAgent: userAgent,
      extractorArgs: 'youtube:player_client=ios,web,web_creator',
      forceIpv4: true
    });

    if (!output.url) throw new Error("No audio URL found in yt-dlp output");
    const streamUrl = output.url;

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
    
    // Dynamically set Content-Type based on yt-dlp reported extension
    const ext = output.ext || 'm4a';
    const mimeType = ext === 'm4a' || ext === 'mp4' ? 'audio/mp4' : 
                   ext === 'webm' ? 'audio/webm' : 
                   ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
    
    responseHeaders.set('Content-Type', mimeType);
    responseHeaders.delete('content-encoding'); // Prevent issues with dual compression
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Stream error:", error);
    return NextResponse.json({ error: 'Failed to stream' }, { status: 500 });
  }
}
