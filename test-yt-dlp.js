const youtubedl = require('youtube-dl-exec');

async function test() {
  const url = 'https://www.youtube.com/watch?v=vnHTrxV7TMc';
  try {
    const output = await youtubedl(url, {
      dumpJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/'
    });
    
    const audioFormats = output.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none');
    console.log(audioFormats[0].url);
  } catch(e) {
    console.error(e);
  }
}

test();
