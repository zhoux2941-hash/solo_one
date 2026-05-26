const regexpp = require('regexpp');

const testPatterns = [
    '\\d{3}-\\d{8}',
    '[a-z]+',
    '(ab|cd)',
];

for (const pattern of testPatterns) {
    console.log(`\n=== Pattern: ${pattern} ===`);
    try {
        const ast = regexpp.parsePattern(pattern);
        console.log(JSON.stringify(ast, (key, value) => {
            if (key === 'parent') return undefined;
            return value;
        }, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
}
