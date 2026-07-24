
async function testYTLogic() {
  const id = 'dQw4w9WgXcQ';
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

    const data = await playerRes.json();
    console.log('Playability Status:', data.playabilityStatus?.status);

    const formats = data.streamingData?.adaptiveFormats || [];
    const audioFormats = formats
      .filter(f => f.mimeType?.startsWith('audio/'))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    const format = audioFormats.find(f => f.mimeType?.includes('mp4')) || audioFormats[0];
    
    if (format?.url) {
      console.log('Stream URL found');
      // Try to fetch a small chunk
      const res = await fetch(format.url, {
        headers: { 'Range': 'bytes=0-1024' }
      });
      console.log('Stream Source Status:', res.status);
    } else {
      console.log('No URL in format');
      if (format?.signatureCipher) {
        console.log('Signature Cipher found (needs decryption)');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testYTLogic();
