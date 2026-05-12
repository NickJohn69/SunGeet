const ytStream = require('yt-stream');

async function test() {
  const url = 'https://www.youtube.com/watch?v=vnHTrxV7TMc';
  try {
    const stream = await ytStream.stream(url, {
      quality: 'high',
      type: 'audio',
    });
    console.log(stream.url);
  } catch(e) {
    console.error(e);
  }
}

test();
