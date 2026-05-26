import play from 'play-dl';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const results = await play.search(q, {
      limit: 30,
      source: { youtube: 'video' }
    });

    const videos = results.map(v => ({
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnails[0]?.url || '',
      duration: v.durationRaw,
      durationSeconds: v.durationInSec || 0,
      author: v.channel?.name || 'Unknown Artist'
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: 'Failed to search videos' }, { status: 500 });
  }
}
