import { create } from 'youtube-dl-exec';
import { NextResponse } from 'next/server';
import path from 'path';

const binaryPath = path.resolve(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
const youtubedl = create(binaryPath);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const title = searchParams.get('title') || id;

  if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

  const url = `https://www.youtube.com/watch?v=${id}`;
  
  try {
    const subprocess = youtubedl.exec(url, {
      output: '-', 
      format: 'bestaudio[ext=m4a]/bestaudio/best',
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/'
    });
    
    const stream = new ReadableStream({
      start(controller) {
        subprocess.stdout.on('data', chunk => controller.enqueue(chunk));
        subprocess.stdout.on('end', () => controller.close());
        subprocess.stdout.on('error', err => controller.error(err));
        
        request.signal.addEventListener('abort', () => subprocess.kill());
      },
      cancel() {
        subprocess.kill();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.m4a"`,
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: 'Failed to download' }, { status: 500 });
  }
}
