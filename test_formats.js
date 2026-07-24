const { Innertube } = require('youtubei.js');

async function testFormats() {
  const yt = await Innertube.create();
  const id = 'dQw4w9WgXcQ';
  
  console.log('=== Testing getInfo() ===');
  const info = await yt.getInfo(id);
  
  // List all audio formats
  const formats = info.streaming_data?.adaptive_formats || [];
  const audioFormats = formats.filter(f => f.mime_type?.startsWith('audio/'));
  
  console.log('\nAll audio formats:');
  audioFormats.forEach((f, i) => {
    console.log(`  [${i}] mime: ${f.mime_type}, bitrate: ${f.bitrate}, hasURL: ${!!f.url}, hasCipher: ${!!f.signature_cipher}`);
  });

  // Test chooseFormat
  try {
    const best = info.chooseFormat({ type: 'audio', quality: 'best' });
    console.log('\nchooseFormat best audio:');
    console.log('  mime:', best.mime_type);
    console.log('  hasURL:', !!best.url);
    console.log('  url prefix:', best.url?.substring(0, 80));
  } catch (e) {
    console.error('chooseFormat failed:', e.message);
  }

  // Check for MP4 audio specifically
  const mp4Audio = audioFormats.filter(f => f.mime_type?.includes('mp4'));
  console.log('\nMP4 audio formats:', mp4Audio.length);
  mp4Audio.forEach((f, i) => {
    console.log(`  [${i}] mime: ${f.mime_type}, bitrate: ${f.bitrate}, hasURL: ${!!f.url}`);
  });
}

testFormats().catch(console.error);
