const play = require('play-dl');

async function test() {
  const url = 'https://www.youtube.com/watch?v=vnHTrxV7TMc';
  try {
    const streamInfo = await play.stream(url);
    console.log("Success! Stream type:", streamInfo.type);
  } catch(e) {
    console.error(e);
  }
}

test();
