import { Innertube } from 'youtubei.js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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
  const type = searchParams.get('type') || 'video';

  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const youtube = await getYT();

    // Artist Search (Channels)
    if (type === 'artist') {
      const results = await youtube.search(q, { type: 'channel' });
      // Filter for Official Artist Channels or Verified Channels
      const channels = (results.channels || [])
        .filter(c => {
          const badges = c.author?.badges || [];
          return badges.some(b => 
            b.tooltip?.includes('Official Artist Channel') || 
            b.label?.includes('Official Artist Channel') ||
            b.style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST' ||
            b.icon_type === 'OFFICIAL_ARTIST'
          );
        })
        .map(c => {
          let thumbnail = '';
          
          // Try multiple paths to find the thumbnail
          const thumbs = c.author?.thumbnails || c.thumbnails || (c.thumbnail?.thumbnails) || [];
          
          if (thumbs && thumbs.length > 0) {
            thumbnail = thumbs[thumbs.length - 1].url || thumbs[0].url;
          } else if (c.thumbnail?.url) {
            thumbnail = c.thumbnail.url;
          }
          
          // Ensure protocol
          if (thumbnail && thumbnail.startsWith('//')) {
            thumbnail = `https:${thumbnail}`;
          }
          
          return {
            id: c.id,
            name: c.author?.name || c.title?.text || 'Unknown Artist',
            thumbnail: thumbnail,
            subscribers: c.subscriber_count?.text || c.subscribers?.text || 'Artist',
          };
        });
      
      // If filtering is too strict, return the top result regardless of badges
      if (channels.length === 0 && results.channels?.length > 0) {
         const top = results.channels[0];
         let thumbnail = '';
         const thumbs = top.author?.thumbnails || top.thumbnails || [];
         if (thumbs.length > 0) thumbnail = thumbs[thumbs.length - 1].url;
         
         return NextResponse.json([{
            id: top.id,
            name: top.author?.name || top.title?.text || 'Unknown Artist',
            thumbnail: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
            subscribers: top.subscriber_count?.text || 'Artist'
         }]);
      }
      
      return NextResponse.json(channels);
    }

    // Default Video/Song Search
    const results = await youtube.search(q, { type: 'video' });
    const videos = (results.videos || []).slice(0, 30).map(v => {
      const videoId = v.id || v.video_id || '';
      const title = v.title?.text || v.title?.toString() || 'Unknown Title';
      const authorName = v.author?.name || v.author?.text || 'Unknown Artist';
      
      let thumbnail = '';
      if (v.thumbnails && v.thumbnails.length > 0) {
        thumbnail = v.thumbnails[v.thumbnails.length - 1].url || v.thumbnails[0].url;
      } else if (v.thumbnail?.url) {
        thumbnail = v.thumbnail.url;
      } else {
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

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
    }).filter(v => v.id);

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: 'Failed to search videos' }, { status: 500 });
  }
}
