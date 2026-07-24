
const { Innertube } = require('youtubei.js');

async function test() {
  try {
    const yt = await Innertube.create();
    console.log('Innertube version:', yt.version || 'unknown');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
}

test();
