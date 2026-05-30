const fs = require('fs');
const p = 'js/app.js';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('currentN: 5, treeData: null, animationSequence: [],', 'currentN: 5, treeData: null, animationSequence: [],\n    isCalculating: false,');
fs.writeFileSync(p, c);
console.log('ok1');
