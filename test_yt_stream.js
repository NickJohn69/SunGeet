
const ytStream = require('yt-stream');

async function test() {
    try {
        const stream = await ytStream.stream('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
            quality: 'high',
            type: 'audio'
        });
        console.log('Stream type:', stream.type);
        console.log('Stream object keys:', Object.keys(stream));
        console.log('Stream.stream is readable:', !!stream.stream.on);
    } catch (e) {
        console.error('Test failed:', e.message);
    }
}
test();
