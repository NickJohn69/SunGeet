import { NextResponse } from 'next/server';

// YouTube InnerTube API — same internal API YouTube's web app uses
// No library needed: works reliably from serverless environments
const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/search';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  try {
    const res = await fetch(INNERTUBE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240101.00.00',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240101.00.00',
            hl: 'en',
            gl: 'US',
          }
        },
        query: q,
        params: 'EgIQAQ==', // Filter: videos only
      }),
    });

    if (!res.ok) throw new Error(`InnerTube responded with ${res.status}`);

    const data = await res.json();

    const contents =
      data?.contents
        ?.twoColumnSearchResultsRenderer
        ?.primaryContents
        ?.sectionListRenderer
        ?.contents?.[0]
        ?.itemSectionRenderer
        ?.contents || [];

    const videos = contents
      .filter(item => item.videoRenderer)
      .slice(0, 30)
      .map(item => {
        const v = item.videoRenderer;
        const thumbs = v.thumbnail?.thumbnails || [];
        return {
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || 'Unknown Title',
          thumbnail: thumbs[thumbs.length - 1]?.url || '',
          duration: v.lengthText?.simpleText || '',
          durationSeconds: 0,
          author: v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'Unknown Artist',
        };
      });

    return NextResponse.json(videos);

  } catch (error) {
    console.error('[search] Error:', error.message);
    return NextResponse.json({ error: 'Failed to search', details: error.message }, { status: 500 });
  }
}
