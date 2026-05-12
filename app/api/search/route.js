import ytSearch from 'yt-search';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const r = await ytSearch(q);
    const videos = r.videos.slice(0, 30).map(v => ({
      id: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.timestamp,
      durationSeconds: v.seconds || 0,
      author: v.author.name
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: 'Failed to search videos' }, { status: 500 });
  }
}
