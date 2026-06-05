export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (!id) {
    return new Response(JSON.stringify({ error: 'Video ID required' }), { status: 400 });
  }

  try {
    const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'TVHTML5',
            clientVersion: '7.20230405.08.01',
            hl: 'en',
            gl: 'US',
          }
        },
        videoId: id,
        playbackContext: { contentCheckOk: true, racyCheckOk: true },
      }),
    });

    if (!playerRes.ok) throw new Error(`YouTube API responded with ${playerRes.status}`);

    const data = await playerRes.json();

    if (data.playabilityStatus?.status !== 'OK') {
      throw new Error(data.playabilityStatus?.reason || 'Video not available');
    }

    const formats = data.streamingData?.adaptiveFormats || [];
    const audioFormats = formats
      .filter(f => f.mimeType?.startsWith('audio/'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    const format =
      audioFormats.find(f => f.mimeType?.includes('mp4')) ||
      audioFormats[0];

    if (!format?.url) throw new Error('No audio stream URL found');

    return Response.redirect(format.url, 307);
  } catch (error) {
    console.error("Stream error:", error.message);
    return new Response(JSON.stringify({ error: 'Failed to stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
