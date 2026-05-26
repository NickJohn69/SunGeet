import { Innertube } from 'youtubei.js';
import { NextResponse } from 'next/server';

let yt = null;

async function getYT() {
  if (!yt) {
    yt = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });
  }
  return yt;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const youtube = await getYT();
    const results = await youtube.search(q, { type: 'video' });

    const videos = (results.videos || []).slice(0, 30).map(v => {
      // Handle different result structures from InnerTube
      const videoId = v.id || v.video_id || '';
      const title = v.title?.text || v.title?.toString() || 'Unknown Title';
      const authorName = v.author?.name || v.author?.text || 'Unknown Artist';
      
      // Get thumbnail - InnerTube provides thumbnails array
      let thumbnail = '';
      if (v.thumbnails && v.thumbnails.length > 0) {
        thumbnail = v.thumbnails[v.thumbnails.length - 1].url || v.thumbnails[0].url;
      } else if (v.thumbnail?.url) {
        thumbnail = v.thumbnail.url;
      } else {
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

      // Duration handling
      const durationText = v.duration?.text || v.duration?.toString() || '0:00';
      const durationSeconds = v.duration?.seconds || 0;

      return {
        id: videoId,
        title,
        thumbnail,
        duration: durationText,
        durationSeconds,
        author: authorName,
      };
    }).filter(v => v.id); // Filter out any results without an ID

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: 'Failed to search videos' }, { status: 500 });
  }
}
