const fs = require('fs');
const file = 'C:/Users/khelw/Downloads/CRM/Marts_System_Merged.html';
let c = fs.readFileSync(file, 'utf8');

// Replace template literals in CSS with logical properties
// Pattern: ${lang==='ar'?'left:4px':'right:4px'}
c = c.replace(/\$\{lang==='ar'\?'left:4px':'right:4px'\}/g, 'inset-inline-start:4px');
c = c.replace(/\$\{lang==='ar'\?'right:4px':'left:4px'\}/g, 'inset-inline-end:4px');

// Verify
const hasTemplate = c.includes('${lang');
console.log('Has template literals:', hasTemplate);

// Now rebuild the combined CSS file
const firstStyleEnd = c.indexOf('</style>');
const secondStyleStart = c.indexOf('<style>', firstStyleEnd + 1) + 8;
const secondStyleEnd = c.indexOf('</style>', secondStyleStart);
const style2 = c.substring(secondStyleStart, secondStyleEnd);

const thirdStyleStart = c.indexOf('<style>', secondStyleEnd + 1) + 8;
const thirdStyleEnd = c.indexOf('</style>', thirdStyleStart);
const style3 = c.substring(thirdStyleStart, thirdStyleEnd);

const firstStyleStart = c.indexOf('<style>') + 8;
const style1 = c.substring(firstStyleStart, firstStyleEnd);

const allCss = style1 + '\n' + style2 + '\n' + style3;
fs.writeFileSync('C:/Users/khelw/Downloads/CRM/public/styles.css', allCss, 'utf8');
console.log('CSS written:', allCss.length, 'chars');

fs.writeFileSync(file, c, 'utf8');
console.log('HTML updated');
