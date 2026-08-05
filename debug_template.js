const fs = require('fs');
const c = fs.readFileSync('C:/Users/khelw/Downloads/CRM/Marts_System_Merged.html', 'utf8');
const idx = c.indexOf('${lang');
if (idx >= 0) {
  console.log('Found at:', idx);
  console.log('Context:', c.substring(idx - 20, idx + 60));
  // Show bytes
  const snippet = c.substring(idx, idx + 50);
  console.log('Bytes:', Buffer.from(snippet).toString('hex'));
} else {
  console.log('Not found - template literals removed');
}
