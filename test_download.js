
const { Innertube } = require('youtubei.js');

async function testDownload() {
  const id = 'dQw4w9WgXcQ'; // Rickroll usually has cipher
  try {
    const yt = await Innertube.create();
    console.log('Testing download for ID:', id);
    const stream = await yt.download(id, { type: 'audio', quality: 'best', client: 'ANDROID_TESTSUITE' });
    console.log('Stream obtained successfully');
    
    // Check if it's a stream
    if (stream && typeof stream.getReader === 'function') {
      console.log('Valid ReadableStream');
    }
  } catch (err) {
    console.error('Download test failed:', err.message);
  }
}

testDownload();
