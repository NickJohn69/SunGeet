const fs = require('fs');
const content = fs.readFileSync('d:\\ISMT\\SunGeet\\audiomack_search.html', 'utf16le');

// Log the first 1000 characters to see if we're reading it correctly
console.log("First 1000 chars:", content.substring(0, 1000));

// Find INITIAL_STATE
const target = 'INITIAL_STATE';
const index = content.indexOf(target);
console.log("Index of INITIAL_STATE:", index);

if (index !== -1) {
    const start = content.indexOf('{', index);
    let count = 0;
    let end = -1;
    for (let i = start; i < content.length; i++) {
        if (content[i] === '{') count++;
        if (content[i] === '}') count--;
        if (count === 0) {
            end = i + 1;
            break;
        }
    }
    if (end !== -1) {
        const json = content.substring(start, end);
        fs.writeFileSync('d:\\ISMT\\SunGeet\\extracted_state.json', json);
        console.log("State extracted successfully to extracted_state.json");
    } else {
        console.log("Could not find end of JSON object");
    }
} else {
    console.log("INITIAL_STATE not found in UTF-16 content");
}
