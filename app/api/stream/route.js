// app/api/stream/route.js
import { NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

export const runtime = 'nodejs';

// Resolve the yt-dlp binary path relative to the project root
function getYtDlpPath() {
  // In Next.js, process.cwd() is the project root
  const binPath = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
  return binPath;
}

/**
 * GET /api/stream?q=<videoId>
 * Returns the best audio-only stream URL for a YouTube video.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('q');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId (q) query param required' }, { status: 400 });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Strategy 1: yt-dlp binary via child_process (most reliable)
  try {
    const binPath = getYtDlpPath();
    const stdout = execFileSync(binPath, [
      '--dump-json',
      '--no-check-certificates',
      '--no-warnings',
      '--prefer-free-formats',
      videoUrl,
    ], {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8',
    });

    const output = JSON.parse(stdout);
    const formats = output.formats || [];
    const audioFormats = formats
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none' && f.url)
      .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0));

    if (audioFormats.length > 0) {
      const chosen = audioFormats.find(f => f.ext === 'm4a') || audioFormats[0];
      return NextResponse.json({
        videoId,
        audioUrl: chosen.url,
        chosen: {
          url: chosen.url,
          mimeType: `audio/${chosen.ext || 'mp4'}`,
          bitrate: chosen.abr || chosen.tbr,
        },
        durationSeconds: output.duration,
      });
    }
    console.warn('[stream] yt-dlp returned no audio formats for', videoId);
  } catch (err) {
    console.error('[stream] yt-dlp failed:', err.message);
  }

  // Strategy 2: youtubei.js getBasicInfo
  try {
    const { Innertube } = await import('youtubei.js');
    const yt = await Innertube.create({ lang: 'en', location: 'US' });
    const info = await yt.getBasicInfo(videoId);
    const formats = info.streaming_data?.adaptive_formats || [];
    const audioFormats = formats
      .filter(f => f.mime_type?.startsWith('audio/') && f.url)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (audioFormats.length > 0) {
      const chosen = audioFormats.find(f => f.mime_type?.includes('mp4')) || audioFormats[0];
      return NextResponse.json({
        videoId,
        audioUrl: chosen.url,
        chosen: {
          url: chosen.url,
          mimeType: chosen.mime_type,
          bitrate: chosen.bitrate,
        },
        durationSeconds: info.basic_info?.duration,
      });
    }
    console.warn('[stream] youtubei.js returned no audio formats for', videoId);
  } catch (err) {
    console.error('[stream] youtubei.js failed:', err.message);
  }

  // Strategy 3: yt-dlp get-url (just the URL, no JSON)
  try {
    const binPath = getYtDlpPath();
    const stdout = execFileSync(binPath, [
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '--get-url',
      '--no-check-certificates',
      '--no-warnings',
      videoUrl,
    ], {
      timeout: 30000,
      encoding: 'utf-8',
    });

    const url = stdout.trim();
    if (url && url.startsWith('http')) {
      return NextResponse.json({
        videoId,
        audioUrl: url,
        chosen: { url, mimeType: 'audio/mp4', bitrate: 128 },
        durationSeconds: 0,
      });
    }
  } catch (err) {
    console.error('[stream] yt-dlp get-url failed:', err.message);
  }

  return NextResponse.json(
    { error: 'All stream extraction methods failed for this video' },
    { status: 500 }
  );
}
