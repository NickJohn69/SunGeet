const { create } = require('youtube-dl-exec');
const path = require('path');

async function test() {
  const binaryPath = path.resolve(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
  const youtubedl = create(binaryPath);
  
  try {
    const output = await youtubedl('https://www.youtube.com/watch?v=vnHTrxV7TMc', {
      dumpJson: true,
      format: 'bestaudio[ext=m4a]'
    });
    console.log("Success! Extracted URL:", output.url.substring(0, 50) + "...");
  } catch(e) {
    console.error(e.message);
  }
}

test();
