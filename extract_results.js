const fs = require('fs');
const content = fs.readFileSync('fresh_search.html', 'utf8');

// Try finding with escaped quotes
const results = [];
const regex = /\\"id\\":(\d+),\\"title\\":\\"(.*?)\\",\\"artist\\":\\"(.*?)\\"/g;
let match;
while ((match = regex.exec(content)) !== null) {
    results.push({
        id: match[1],
        title: match[2],
        artist: match[3]
    });
}

if (results.length === 0) {
    // Try finding raw JSON strings
    const regex2 = /\{"id":(\d+),"title":"(.*?)","artist":"(.*?)"/g;
    while ((match = regex2.exec(content)) !== null) {
        results.push({
            id: match[1],
            title: match[2],
            artist: match[3]
        });
    }
}

console.log(JSON.stringify(results.slice(0, 5), null, 2));
