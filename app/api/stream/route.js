import ytdl from '@distube/ytdl-core';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          // Use a mobile UA — less likely to be blocked by YouTube
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        }
      }
    });

    // Prefer m4a (mp4 audio) for broadest browser support, fall back to any audio
    const format =
      ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: f => f.container === 'm4a' }) ||
      ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

    if (!format?.url) throw new Error('No audio format found in YouTube response');

    // ✅ REDIRECT instead of proxy — browser streams directly from YouTube CDN
    // This eliminates Vercel's 30s serverless timeout entirely.
    return Response.redirect(format.url, 307);

  } catch (error) {
    console.error('[stream] Error:', error.message);
    return NextResponse.json({
      error: 'Failed to get stream URL',
      details: error.message
    }, { status: 500 });
  }
}
