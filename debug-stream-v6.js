const { create } = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

async function testStream() {
  const binaryPath = path.resolve(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  const logFile = path.resolve(process.cwd(), 'stream-debug.log');
  fs.writeFileSync(logFile, `Testing with binary: ${binaryPath}\n`);

  const youtubedl = create(binaryPath);
  const url = 'https://www.youtube.com/watch?v=hev768NSXJQ';
  
  try {
    const output = await youtubedl(url, {
      dumpJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio',
      noWarnings: true,
      noCheckCertificate: true,
      referer: 'https://www.youtube.com/'
    });
    fs.appendFileSync(logFile, 'Success! Output URL: ' + output.url + '\n');
  } catch (error) {
    fs.appendFileSync(logFile, 'Error: ' + error.message + '\n');
    if (error.stderr) fs.appendFileSync(logFile, 'Stderr: ' + error.stderr + '\n');
  }
}

testStream();
