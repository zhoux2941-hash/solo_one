const { parseRegExpLiteral, parsePattern, visitRegExpAST } = require('regexpp');

console.log('Testing regexpp...');

const result = parseRegExpLiteral('/\\d{3}-\\d{8}/g');
console.log(JSON.stringify(result, null, 2));
