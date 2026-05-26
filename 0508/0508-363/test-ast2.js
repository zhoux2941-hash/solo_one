const regexpp = require('regexpp');

console.log('regexpp exports:', Object.keys(regexpp));

const testPatterns = [
    '\\d{3}-\\d{8}',
];

for (const pattern of testPatterns) {
    console.log(`\n=== Pattern: ${pattern} ===`);
    try {
        const fullPattern = `/${pattern}/g`;
        const ast = regexpp.parseRegExpLiteral(fullPattern);
        console.log(JSON.stringify(ast, (key, value) => {
            if (key === 'parent') return undefined;
            return value;
        }, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
}
