export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (!id) {
    return new Response(JSON.stringify({ error: 'Video ID required' }), { status: 400 });
  }

  try {
    const { stream } = await import('yt-stream');
    const result = await stream(`https://youtube.com/watch?v=${id}`, {
      type: 'audio',
      quality: 'high',
      highWaterMark: 1048576,
    });

    if (!result || !result.url) {
      throw new Error('No audio stream URL found');
    }

    // Redirect to the direct audio URL
    return Response.redirect(result.url, 307);
  } catch (error) {
    console.error("Stream error:", error.message);
    return new Response(JSON.stringify({ error: 'Failed to stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
