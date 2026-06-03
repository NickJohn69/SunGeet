const fs = require('fs');
const content = fs.readFileSync('d:\\ISMT\\SunGeet\\audiomack_search.html', 'utf8');
const searchString = 'STATE';
const index = content.indexOf(searchString);
if (index !== -1) {
    console.log(`Found "${searchString}" at index ${index}`);
    console.log(content.substring(index, index + 200));
} else {
    console.log(`"${searchString}" not found`);
}
