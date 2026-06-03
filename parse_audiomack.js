const fs = require('fs');
const html = fs.readFileSync('d:\\ISMT\\SunGeet\\audiomack_search.html', 'utf8');

// Find all script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
let match;
while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.includes('INITIAL_STATE')) {
        console.log("Found INITIAL_STATE in script tag!");
        // Extract the JSON object
        const jsonMatch = content.match(/INITIAL_STATE__\s*=\s*(\{.*\})/);
        if (jsonMatch) {
            console.log("Extracted JSON!");
            const data = JSON.parse(jsonMatch[1]);
            console.log("Search results keys:", Object.keys(data.search || {}));
            const results = data.search?.results?.music?.data || [];
            console.log("Results count:", results.length);
            if (results.length > 0) {
                console.log("First result:", results[0].title, "by", results[0].artist);
            }
        }
    }
}
