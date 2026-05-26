const { create } = require('youtube-dl-exec');
const path = require('path');

async function testStream() {
  const binaryPath = path.resolve(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');
  console.log('Binary path:', binaryPath);
  const youtubedl = create(binaryPath);
  const url = 'https://www.youtube.com/watch?v=vnHTrxV7TMc';
  
  try {
    const output = await youtubedl(url, {
      dumpJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio',
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/'
    });
    console.log('Output URL:', output.url);
  } catch (error) {
    console.error('Error:', error);
  }
}

testStream();
