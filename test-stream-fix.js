const id = 'vnHTrxV7TMc';
const INNERTUBE_PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player';

async function test() {
  try {
    const playerRes = await fetch(INNERTUBE_PLAYER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      }),
    });

    console.log('Player response status:', playerRes.status);
    const data = await playerRes.json();
    console.log('Playability Status:', data.playabilityStatus?.status);
    
    if (data.playabilityStatus?.status === 'OK') {
        console.log('Success!');
        const formats = data.streamingData?.adaptiveFormats || [];
        const audioFormats = formats.filter(f => f.mimeType?.startsWith('audio/'));
        const format = audioFormats.find(f => f.mimeType?.includes('mp4')) || audioFormats[0];
        console.log('URL found?', !!format?.url);
    } else {
        console.log('Reason:', data.playabilityStatus?.reason);
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
