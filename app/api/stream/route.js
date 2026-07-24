// app/api/stream/route.js
import { NextResponse } from 'next/server';
import { execFileSync } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';

// Helper to resolve the yt-dlp binary path dynamically based on OS
function getYtDlpPath() {
  const isWin = process.platform === 'win32';
  const binaryName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', binaryName);
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

  // Strategy 1: @distube/ytdl-core (Pure JS, very robust, deciphering is fully supported client-side)
  try {
    const ytdl = await import('@distube/ytdl-core');
    const info = await ytdl.default.getInfo(videoId);
    const audioFormats = ytdl.default.filterFormats(info.formats, 'audioonly');

    if (audioFormats.length > 0) {
      // Find m4a container format or get the highest audio format
      const chosen = audioFormats.find(f => f.container === 'm4a') || audioFormats[0];
      return NextResponse.json({
        videoId,
        audioUrl: chosen.url,
        chosen: {
          url: chosen.url,
          mimeType: chosen.mimeType || `audio/${chosen.container || 'mp4'}`,
          bitrate: chosen.audioBitrate || chosen.bitrate,
        },
        durationSeconds: parseInt(info.videoDetails.lengthSeconds) || 0,
      });
    }
    console.warn('[stream] @distube/ytdl-core returned no audio formats for', videoId);
  } catch (err) {
    console.error('[stream] @distube/ytdl-core failed:', err.message);
  }

  // Strategy 2: youtubei.js getInfo (using full getInfo to decrypt signature ciphers)
  try {
    const { Innertube } = await import('youtubei.js');
    const yt = await Innertube.create({ lang: 'en', location: 'US' });
    const info = await yt.getInfo(videoId);
    
    // Choose format decrypts the signature cipher and returns a playable URL
    const chosen = info.chooseFormat({ type: 'audio', quality: 'best' });

    if (chosen && chosen.url) {
      return NextResponse.json({
        videoId,
        audioUrl: chosen.url,
        chosen: {
          url: chosen.url,
          mimeType: chosen.mime_type,
          bitrate: chosen.bitrate,
        },
        durationSeconds: info.basic_info?.duration || 0,
      });
    }
    console.warn('[stream] youtubei.js chosen format has no URL for', videoId);
  } catch (err) {
    console.error('[stream] youtubei.js failed:', err.message);
  }

  // Strategy 3: yt-dlp binary spawn (working in localhost but fallback config for deployment platform check)
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

  // Strategy 4: yt-dlp get-url format extraction
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
