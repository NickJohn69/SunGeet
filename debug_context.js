const fs = require('fs');
const content = fs.readFileSync('fresh_search.html', 'utf8');

const target = 'starboy';
const index = content.indexOf(target);
if (index !== -1) {
    console.log("Context around 'starboy':");
    console.log(content.substring(index - 200, index + 200));
} else {
    console.log("'starboy' not found");
}
