const { exec } = require('youtube-dl-exec');
const fs = require('fs');

async function test() {
  const url = 'https://www.youtube.com/watch?v=vnHTrxV7TMc';
  try {
    const subprocess = exec(url, {
      output: '-', 
      format: 'bestaudio[ext=m4a]/bestaudio/best',
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/'
    });

    const file = fs.createWriteStream('test_audio.m4a');
    subprocess.stdout.pipe(file);

    subprocess.on('close', (code) => {
      console.log('Finished with code', code);
    });
    
    subprocess.stderr.on('data', (data) => {
      console.error('STDERR:', data.toString());
    });

  } catch(e) {
    console.error(e);
  }
}

test();
