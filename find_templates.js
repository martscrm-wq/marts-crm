const fs = require('fs');
const c = fs.readFileSync('C:/Users/khelw/Downloads/CRM/Marts_System_Merged.html', 'utf8');

// Find all ${} occurrences in the file
const regex = /\$\{[^}]+\}/g;
let match;
let count = 0;
const locations = [];
while ((match = regex.exec(c)) !== null) {
  count++;
  const lineNum = c.substring(0, match.index).split('\n').length;
  locations.push({ line: lineNum, text: match[0].substring(0, 80) });
}
console.log('Total ${} found:', count);
locations.forEach(l => console.log(`  Line ${l.line}: ${l.text}`));
