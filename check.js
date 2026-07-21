const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\khelw\\Downloads\\CRM\\Marts_System_Merged.html', 'utf8');
const scripts = [];
let idx = 0;
while (true) {
  const start = html.indexOf('<script', idx);
  if (start === -1) break;
  const tagEnd = html.indexOf('>', start);
  const end = html.indexOf('</script>', tagEnd);
  if (end === -1) break;
  scripts.push(html.substring(tagEnd + 1, end));
  idx = end + 9;
}
const code = scripts[9];
try {
  require('vm').compileFunction(code);
  console.log('OK');
} catch (e) {
  // Find lines with bad template syntax
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('${lg:') && !lines[i].includes('${lg?')) {
      console.log('BAD LINE ' + (i+1) + ': ' + lines[i].trim().substring(0,120));
    }
    if (lines[i].includes('${t(') && lines[i].match(/\$\{t\([^)]*\)/) === null) {
      // skip
    }
  }
  console.log('ERROR:', e.message.substring(0, 200));
}
